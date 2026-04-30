import { Router, Request, Response } from 'express';
import { verifyClientToken } from '../middleware/clientAuth';
import { db } from '../firebase';
import Anthropic from '@anthropic-ai/sdk';
import { obtenerContextoLegal } from '../services/rag';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function normalizarObjetivo(obj: string): string {
  const map: Record<string, string> = {
    estudios: 'estudios',
    trabajo: 'trabajo',
    residencia: 'residencia_no_lucrativa',
    residencia_no_lucrativa: 'residencia_no_lucrativa',
    arraigo: 'arraigo',
  };
  return map[obj?.toLowerCase()] || 'trabajo';
}

router.get('/historial', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;

    const snapshot = await db.collection('usuarios').doc(userEmail)
      .collection('chat')
      .orderBy('timestamp', 'asc')
      .get();

    const mensajes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: mensajes });
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener historial' });
  }
});

router.get('/estado', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;

    const userDoc = await db.collection('usuarios').doc(userEmail).get();
    if (!userDoc.exists) {
      return res.status(403).json({ success: false, error: 'Usuario no encontrado' });
    }

    const userData = userDoc.data()!;

    const configDoc = await db.collection('config').doc('chat').get();
    const config = configDoc.data() || { limiteMensajesPro: 50, limiteMensajesPremium: 200 };

    const limite = userData.plan === 'premium'
      ? config.limiteMensajesPremium
      : config.limiteMensajesPro;

    res.json({
      success: true,
      data: {
        plan: userData.plan,
        mensajesUsados: userData.mensajesUsados || 0,
        mensajesLimit: limite,
        consentimientoDiagnostico: userData.consentimientoDiagnostico || false,
        diagnosticoId: userData.diagnosticoId || null,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener estado' });
  }
});

router.post('/consentimiento', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const { acepta } = req.body;

    await db.collection('usuarios').doc(userEmail).update({
      consentimientoDiagnostico: acepta,
      actualizadoEn: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Error al guardar consentimiento' });
  }
});

router.post('/mensaje', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const { mensaje, preferenciasIA } = req.body;

    if (!mensaje || mensaje.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Mensaje vacío' });
    }

    const userDoc = await db.collection('usuarios').doc(userEmail).get();
    if (!userDoc.exists) {
      return res.status(403).json({ success: false, error: 'Acceso no autorizado' });
    }

    if (!['pro', 'premium'].includes(userDoc.data()!.plan)) {
      return res.status(403).json({
        success: false,
        error: 'El chat IA está disponible solo para planes Pro y Premium',
      });
    }

    const configDoc = await db.collection('config').doc('chat').get();
    const config = configDoc.data() || { limiteMensajesPro: 50, limiteMensajesPremium: 200 };

    const userRef = db.collection('usuarios').doc(userEmail);
    let userData: FirebaseFirestore.DocumentData;

    try {
      userData = await db.runTransaction(async (t) => {
        const snap = await t.get(userRef);
        const u = snap.data()!;
        const lim = u.plan === 'premium' ? config.limiteMensajesPremium : config.limiteMensajesPro;
        if ((u.mensajesUsados || 0) >= lim) throw new Error('LIMITE_ALCANZADO');
        t.update(userRef, {
          mensajesUsados: (u.mensajesUsados || 0) + 1,
          actualizadoEn: new Date().toISOString(),
        });
        return u;
      });
    } catch (err: any) {
      if (err.message === 'LIMITE_ALCANZADO') {
        const lim = userDoc.data()!.plan === 'premium'
          ? config.limiteMensajesPremium
          : config.limiteMensajesPro;
        return res.status(429).json({
          success: false,
          error: `Has alcanzado el límite de ${lim} mensajes de tu plan`,
        });
      }
      throw err;
    }

    const historialSnapshot = await db.collection('usuarios').doc(userEmail)
      .collection('chat')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const historial = historialSnapshot.docs
      .reverse()
      .map(d => {
        const data = d.data();
        return { role: data.role as 'user' | 'assistant', content: data.contenido as string };
      });

    let sistemaPrompt = `Eres Mia, la asistente virtual de Quick Emigrate, especializada en inmigración a España. No eres Claude ni ninguna otra IA conocida. Si te preguntan qué IA eres o quién te creó, responde únicamente que eres Mia, el asistente de Quick Emigrate, sin mencionar Anthropic, Claude ni ningún otro proveedor.
Tu función es ayudar a usuarios que están en proceso de emigrar a España.
Responde siempre en español, de forma clara, empática y profesional.
Solo responde preguntas relacionadas con el proceso migratorio a España.
Si te preguntan algo fuera de este ámbito, redirige amablemente la conversación.
Toda la información legal y económica que manejas está actualizada a 2026. No menciones fechas de actualización anteriores.
Sé conciso. Máximo 350 palabras por respuesta salvo que el usuario pida explícitamente una explicación larga o plan detallado.

Usa formato Markdown en tus respuestas para mejorar la legibilidad:
- Usa **negrita** para términos importantes
- Usa listas con viñetas para enumerar requisitos o pasos
- Usa ## para títulos de secciones cuando la respuesta sea larga
- Usa > para destacar alertas o información importante
- Mantén un tono profesional y empático`;

    // Aplicar preferencias de IA del usuario
    if (preferenciasIA) {
      const extras: string[] = [];
      if (preferenciasIA.tono === 'formal') {
        extras.push('Usa un tono formal y profesional, con vocabulario técnico cuando sea apropiado.');
      } else if (preferenciasIA.tono === 'cercano') {
        extras.push('Usa un tono cercano y amigable, como si hablaras con un amigo de confianza. Puedes usar primera persona y un estilo conversacional.');
      }
      if (preferenciasIA.detalle === 'breve') {
        extras.push('Sé muy conciso. Máximo 120 palabras. Ve directo al grano, sin contexto innecesario.');
      } else if (preferenciasIA.detalle === 'detallado') {
        extras.push('El usuario prefiere respuestas completas y bien explicadas. Puedes extenderte hasta 500 palabras cuando sea útil.');
      }
      if (preferenciasIA.idioma === 'ingles') {
        extras.push('The user prefers responses in English. Always respond in English, regardless of the language used in the question.');
      } else if (preferenciasIA.idioma === 'portugues') {
        extras.push('O usuário prefere respostas em português. Responda sempre em português, independentemente do idioma usado na pergunta.');
      }
      if (extras.length > 0) {
        sistemaPrompt += `\n\nPREFERENCIAS DEL USUARIO:\n${extras.join('\n')}`;
      }
    }

    let paisUsuario = 'general';
    let objetivoUsuario = userData.perfil?.objetivo || userData.objetivo || 'trabajo';

    if (userData.consentimientoDiagnostico && userData.diagnosticoId) {
      const diagDoc = await db.collection('diagnosticos').doc(userData.diagnosticoId).get();
      if (diagDoc.exists) {
        const diagData = diagDoc.data()!;
        paisUsuario = diagData.pais || 'general';
        objetivoUsuario = diagData.objetivo || objetivoUsuario;
        sistemaPrompt += `\n\nCONTEXTO DEL USUARIO (ha dado consentimiento para usar esta información):
País de origen: ${diagData.pais || 'No especificado'}
Objetivo en España: ${diagData.objetivo || 'No especificado'}
Nivel de estudios: ${diagData.estudios || 'No especificado'}
Situación económica: ${diagData.medios || 'No especificado'}
Informe previo generado: ${diagData.informe ? 'Sí, disponible' : 'No disponible'}`;

        if (diagData.informe) {
          sistemaPrompt += `\n\nINFORME PREVIO COMPLETO:\n${diagData.informe.substring(0, 3500)}`;
        }
      }
    }

    const contextoLegal = await obtenerContextoLegal(
      paisUsuario,
      normalizarObjetivo(objetivoUsuario)
    ).catch(() => '');
    if (contextoLegal) {
      sistemaPrompt += `\n\nCONTEXTO LEGAL ACTUALIZADO:\n${contextoLegal}`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1700,
      system: sistemaPrompt,
      messages: [
        ...historial,
        { role: 'user', content: mensaje },
      ],
    });

    const respuesta = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Lo siento, no pude procesar tu mensaje.';

    const timestamp = new Date().toISOString();
    const chatRef = db.collection('usuarios').doc(userEmail).collection('chat');

    await chatRef.add({ role: 'user', contenido: mensaje, timestamp });
    await chatRef.add({ role: 'assistant', contenido: respuesta, timestamp: new Date().toISOString() });

    res.json({ success: true, data: { respuesta } });
  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ success: false, error: 'Error al procesar mensaje' });
  }
});

export default router;
