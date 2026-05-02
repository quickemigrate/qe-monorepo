import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../firebase';
import { Resend } from 'resend';
import PDFDocument from 'pdfkit';
import path from 'path';
import { obtenerContextoLegal } from '../services/rag';
import { verifyClientToken } from '../middleware/clientAuth';
import { stripe } from '../config/stripe';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const resend = new Resend(process.env.RESEND_API_KEY || '');

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

function sanitizarScoring(texto: string): string {
  let result = texto.replace(/(\d{1,3})(%)/g, (match, num, _pct, offset) => {
    const before = texto.substring(Math.max(0, offset - 5), offset);
    if (/\d+[-–]\s?$/.test(before)) return match;
    const n = parseInt(num);
    if (n < 0 || n > 100) return match;
    const lo = Math.floor(n / 5) * 5;
    const hi = Math.min(lo + 10, 100);
    return lo === hi ? ` ${lo}%` : ` ${lo}–${hi}%`;
  });
  result = result.replace(/score:\s*0\.(\d{2})/gi, (_m, d) => {
    const n = parseInt(d);
    if (n >= 80) return 'valoración: Alta';
    if (n >= 60) return 'valoración: Media-Alta';
    if (n >= 40) return 'valoración: Media';
    return 'valoración: Baja';
  });
  result = result.replace(/\b(\d{1,3})\/100\b/g, (_m, num) => {
    const n = parseInt(num);
    const lo = Math.floor(n / 5) * 5;
    const hi = Math.min(lo + 10, 100);
    return ` ${lo}–${hi} sobre 100`;
  });
  return result;
}

// POST /api/diagnostico/create-payment-intent
router.post('/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let email = '';
    let datosFormulario: any = {};

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const { getAuth } = await import('firebase-admin/auth');
        const decoded = await getAuth().verifyIdToken(token);
        email = decoded.email!;

        const userDoc = await db.collection('usuarios').doc(email).get();
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          datosFormulario = { ...userData.perfil, nombre: userData.nombre, email };
        }
      } catch (e) {
        console.error('Error verificando token:', e);
      }
    }

    if (!datosFormulario.nombre || !datosFormulario.email || !datosFormulario.pais || !datosFormulario.objetivo) {
      return res.status(400).json({
        success: false,
        error: 'Completa tu perfil antes de continuar (nombre, país y objetivo son obligatorios)',
      });
    }

    const diagnosticoRef = await db.collection('diagnosticos').add({
      ...datosFormulario,
      email,
      estado: 'pendiente_pago',
      creadoEn: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    let precioStarter = 59;
    try {
      const configDoc = await db.collection('config').doc('planes').get();
      const configData = configDoc.data();
      if (configData?.planes) {
        const starterPlan = configData.planes.find((p: any) => p.id === 'starter');
        if (starterPlan?.precio != null) precioStarter = starterPlan.precio;
      }
    } catch { /* fallback */ }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(precioStarter * 100),
      currency: 'eur',
      description: 'Diagnóstico Migratorio IA — Quick Emigrate',
      metadata: { diagnosticoId: diagnosticoRef.id, email },
    });

    await diagnosticoRef.update({ stripePaymentIntentId: paymentIntent.id });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      diagnosticoId: diagnosticoRef.id,
    });
  } catch (error) {
    console.error('Error creando PaymentIntent:', error);
    res.status(500).json({ success: false, error: 'Error al crear orden' });
  }
});

// POST /api/diagnostico/confirm-payment
router.post('/confirm-payment', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, diagnosticoId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, error: 'Pago no completado' });
    }

    await db.collection('diagnosticos').doc(diagnosticoId).update({
      estado: 'procesando',
      stripePaymentIntentId: paymentIntentId,
      pagadoEn: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const diagDoc = await db.collection('diagnosticos').doc(diagnosticoId).get();
    const diagData = diagDoc.data()!;

    if (diagData.email) {
      await db.collection('usuarios').doc(diagData.email).update({
        diagnosticoId,
        actualizadoEn: new Date().toISOString(),
      });
    }

    procesarConRetry(diagnosticoId, diagData);

    res.json({ success: true, diagnosticoId });
  } catch (error) {
    console.error('Error confirmando pago Stripe:', error);
    res.status(500).json({ success: false, error: 'Error al confirmar pago' });
  }
});

// POST /api/diagnostico/generar-gratis — Pro/Premium: genera diagnóstico sin pago
router.post('/generar-gratis', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;

    const userDoc = await db.collection('usuarios').doc(userEmail).get();
    if (!userDoc.exists) {
      return res.status(403).json({ success: false, error: 'Usuario no encontrado' });
    }

    const userData = userDoc.data()!;
    if (!['pro', 'premium'].includes(userData.plan)) {
      return res.status(403).json({ success: false, error: 'Requiere plan Pro o Premium' });
    }

    const datosFormulario = { ...userData.perfil, nombre: userData.nombre, email: userEmail };

    if (!datosFormulario.nombre || !datosFormulario.pais || !datosFormulario.objetivo) {
      return res.status(400).json({
        success: false,
        error: 'Completa tu perfil antes de continuar (nombre, país y objetivo son obligatorios)',
      });
    }

    const diagnosticoRef = await db.collection('diagnosticos').add({
      ...datosFormulario,
      email: userEmail,
      estado: 'procesando',
      creadoEn: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gratis: true,
    });

    await db.collection('usuarios').doc(userEmail).update({
      diagnosticoId: diagnosticoRef.id,
      actualizadoEn: new Date().toISOString(),
    });

    procesarConRetry(diagnosticoRef.id, datosFormulario);

    res.json({ success: true, diagnosticoId: diagnosticoRef.id });
  } catch (error) {
    console.error('Error generando diagnóstico gratis:', error);
    res.status(500).json({ success: false, error: 'Error al generar diagnóstico' });
  }
});

// GET /api/diagnostico/:id/pdf — descarga el PDF del diagnóstico (cliente autenticado)
router.get('/:id/pdf', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userEmail = (req as any).user.email;

    const diagDoc = await db.collection('diagnosticos').doc(id).get();
    if (!diagDoc.exists) {
      return res.status(404).json({ success: false, error: 'Diagnóstico no encontrado' });
    }

    const diagData = diagDoc.data()!;
    if (diagData.email !== userEmail) {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    if (!diagData.pdfBase64) {
      return res.status(404).json({ success: false, error: 'PDF no disponible aún' });
    }

    const pdfBuffer = Buffer.from(diagData.pdfBase64, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="diagnostico-quickemigrate.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    res.status(500).json({ success: false, error: 'Error al descargar PDF' });
  }
});

// GET /api/diagnostico/:id
router.get('/:id', verifyClientToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userEmail = (req as any).user.email;
  try {
    const doc = await db.collection('diagnosticos').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    }
    const data = doc.data()!;
    if (data.email !== userEmail) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    res.json({ id: doc.id, ...data });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo diagnóstico' });
  }
});

async function procesarConRetry(id: string, data: any, intento = 1): Promise<void> {
  try {
    await procesarDiagnostico(id, data);
  } catch (error) {
    console.error(`Error diagnóstico ${id} — intento ${intento}/3:`, error);
    if (intento < 3) {
      await new Promise(r => setTimeout(r, 5000 * intento));
      return procesarConRetry(id, data, intento + 1);
    }
    await db.collection('diagnosticos').doc(id).update({
      estado: 'error',
      errorMsg: String(error),
      updatedAt: new Date().toISOString(),
    });
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Quick Emigrate <hola@quickemigrate.com>',
      to: process.env.CONTACT_EMAIL || '',
      subject: `⚠️ Error diagnóstico ${id}`,
      html: `<p>El diagnóstico <b>${id}</b> falló 3 veces.<br>Email usuario: ${data.email}<br>Error: ${String(error)}</p>`,
    }).catch(console.error);
  }
}

// Procesa el informe en segundo plano tras confirmar pago
async function procesarDiagnostico(diagnosticoId: string, data: any) {
  const email = data.email || '';
  const nombre = data.nombre || '';
  console.log('Iniciando procesamiento diagnóstico:', diagnosticoId, email);

  if (!data) throw new Error('Diagnóstico no encontrado');

  const contextoLegal = await obtenerContextoLegal(
    data.pais || 'general',
    normalizarObjetivo(data.objetivo || '')
  ).catch(() => '');

  const idiomasStr = data.otrosIdiomas === 'Sí'
    ? (data.cualesIdiomas ? `Sí (${data.cualesIdiomas})` : 'Sí')
    : (data.otrosIdiomas || 'Solo español');

  const CAMPOS_YA_MAPEADOS = new Set([
    'name', 'email', 'age', 'nationality', 'country_of_residence',
    'current_profession', 'study_area', 'education_level', 'years_experience',
    'employment_status', 'savings_eur_range', 'migration_goal', 'urgency',
    'family_in_spain_or_eu', 'diagnostic_disclaimer_accepted', 'diagnostic_data_consent',
    'otrosIdiomas', 'cualesIdiomas',
  ]);

  const respuestasExtra = data.respuestas
    ? Object.entries(data.respuestas as Record<string, any>)
        .filter(([k, v]) => !CAMPOS_YA_MAPEADOS.has(k) && v !== undefined && v !== null && v !== '' && v !== false)
        .map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
        .join('\n')
    : '';

  const promptBase = `Eres un experto en inmigración española. Genera un informe de diagnóstico migratorio para el siguiente perfil.

IMPORTANTE: No uses markdown (sin ##, sin **, sin tablas, sin guiones como listas). Usa EXACTAMENTE estos marcadores para estructurar el informe:

[SECCION] para títulos de sección principales
[SUBSECCION] para subtítulos
[ITEM] para items de lista
[TEXTO] para párrafos normales
[ALERTA] para alertas o riesgos importantes
[DESTACADO] para valoración de probabilidad de éxito (NUNCA porcentaje exacto: usa intervalo como "65-80%" o texto como "Alta", "Media-Alta", "Media", "Baja")

PERFIL DEL USUARIO:
- Nombre: ${data.nombre}
- País de origen: ${data.pais}
- Edad: ${data.edad || 'No especificada'}
- Sector laboral: ${data.sector || 'No especificado'}
- Nivel de estudios: ${data.estudios || 'No especificado'}
- Experiencia laboral: ${data.experiencia || 'No especificada'}
- Situación actual: ${data.situacion || 'No especificada'}
- Medios económicos disponibles: ${data.medios || 'No especificados'}
- Objetivo en España: ${data.objetivo}
- Plazo para emigrar: ${data.plazo || 'No especificado'}
- Familiares en España: ${data.familiaresEnEspana || 'No especificado'}
- Otros idiomas: ${idiomasStr}
${respuestasExtra ? `\nINFORMACIÓN COMPLEMENTARIA DEL FORMULARIO:\n${respuestasExtra}` : ''}

Genera el informe con estas secciones en orden:

[SECCION] Resumen Ejecutivo
[TEXTO] párrafo resumen...

[SECCION] Vía Migratoria Recomendada
[SUBSECCION] nombre del visado
[TEXTO] explicación...
[ITEM] razón 1
[ITEM] razón 2

[SECCION] Probabilidad de Éxito
[DESTACADO] Alta (entre 70-85%) — usa intervalo o texto, NUNCA porcentaje exacto único
[TEXTO] explicación...
[SUBSECCION] Factores positivos
[ITEM] factor 1
[SUBSECCION] Factores negativos
[ITEM] factor 1

[SECCION] Checklist de Documentos
[ITEM] documento 1
[ITEM] documento 2

[SECCION] Plazos Estimados
[ITEM] Fase 1: descripción — X semanas
[ITEM] Fase 2: descripción — X semanas

[SECCION] Riesgos y Alertas
[ALERTA] descripción del riesgo principal
[ITEM] cómo mitigarlo

[SECCION] Próximos Pasos Inmediatos
[ITEM] acción 1
[ITEM] acción 2

[SECCION] Nota Final
[TEXTO] mensaje motivador

Sé específico, útil y directo. Máximo 800 palabras en total. Sé directo y específico.`;

  const prompt = contextoLegal
    ? `CONTEXTO LEGAL ACTUALIZADO (usa esta información como base):\n\n${contextoLegal}\n\n---\n\n${promptBase}`
    : promptBase;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  });
  const informeRaw = (message.content[0] as { type: string; text: string }).text;
  const informeTexto = sanitizarScoring(informeRaw);
  console.log('Informe generado, longitud:', informeTexto.length);

  const pdfBuffer = await generarPDF(nombre, informeTexto, data);
  console.log('PDF generado, tamaño:', pdfBuffer.length);

  const pdfBase64 = pdfBuffer.toString('base64');

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Quick Emigrate <hola@quickemigrate.com>',
    to: email,
    subject: `Tu diagnóstico migratorio personalizado — Quick Emigrate`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f4f5; padding: 40px 20px;">
        <div style="background: #1A1C1C; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
          <div style="margin-bottom: 16px;">
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#25D366"/>
              <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="22" fill="white">Q</text>
            </svg>
          </div>
          <h1 style="color: #fff; font-size: 24px; margin: 0 0 8px 0;">¡Tu diagnóstico está listo, ${data.nombre}!</h1>
          <p style="color: rgba(255,255,255,0.6); margin: 0;">Hemos analizado tu perfil y preparado una ruta personalizada para tu emigración a España.</p>
        </div>
        <div style="background: #25D366; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
          <p style="color: #fff; font-size: 16px; font-weight: 700; margin: 0;">Tu informe PDF está adjunto a este email</p>
        </div>
        <div style="background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #1A1C1C; font-size: 16px; margin: 0 0 16px 0;">¿Qué incluye tu diagnóstico?</h2>
          <ul style="color: #6B7280; font-size: 14px; line-height: 1.8; padding-left: 20px;">
            <li>Vía migratoria recomendada para tu perfil</li>
            <li>Probabilidad de éxito estimada</li>
            <li>Checklist completa de documentos</li>
            <li>Plazos estimados del proceso</li>
            <li>Riesgos específicos y cómo evitarlos</li>
            <li>Próximos 5 pasos inmediatos</li>
          </ul>
        </div>
        <div style="background: #1A1C1C; border-radius: 12px; padding: 20px; text-align: center; margin-top: 24px;">
          <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 0;">© 2026 Quick Emigrate — Tu ruta hacia España, clara y guiada.</p>
        </div>
      </div>
    `,
    attachments: [{
      filename: `diagnostico-quick-emigrate-${data.nombre.toLowerCase().replace(/\s/g, '-')}.pdf`,
      content: pdfBuffer.toString('base64')
    }]
  });

  console.log('Email enviado a:', email);

  await db.collection('diagnosticos').doc(diagnosticoId).update({
    estado: 'completado',
    informe: informeTexto,
    pdfBase64,
    completadoEn: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log(`Diagnóstico completado para ${email}`);
}

// Función auxiliar para generar el PDF
async function generarPDF(nombre: string, informe: string, data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: `Diagnóstico Migratorio — ${nombre}`,
        Author: 'Quick Emigrate',
      }
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    // ── PORTADA ──────────────────────────────────────────────
    doc.rect(0, 0, pageWidth, pageHeight).fill('#1A1C1C');

    const logoPath = path.join(__dirname, '../assets/logo-dark-iso.png');
    doc.image(logoPath, margin, 55, { height: 55 });
    doc.fill('#FFFFFF').font('Helvetica-Bold').fontSize(20).text('Quick Emigrate', margin + 65, 74);

    doc.moveTo(margin, 130).lineTo(pageWidth - margin, 130).strokeColor('#25D366').lineWidth(2).stroke();

    doc.fill('#FFFFFF').font('Helvetica-Bold').fontSize(34).text('Diagnóstico', margin, 160);
    doc.fill('#FFFFFF').font('Helvetica-Bold').fontSize(34).text('Migratorio', margin, 200);

    doc.fill('#25D366').font('Helvetica-Bold').fontSize(16)
      .text(`Informe personalizado para ${nombre}`, margin, 255, { width: contentWidth });

    const cards = [
      { label: 'PAÍS', value: data.pais },
      { label: 'OBJETIVO', value: data.objetivo },
      { label: 'PLAZO', value: data.plazo },
    ];
    cards.forEach((card, i) => {
      const x = margin + i * (contentWidth / 3);
      const w = contentWidth / 3 - 8;
      doc.roundedRect(x, 310, w, 65, 6).fill('#2A2D2D');
      doc.fill('#25D366').font('Helvetica-Bold').fontSize(8).text(card.label, x + 10, 322, { width: w - 20 });
      doc.fill('#FFFFFF').font('Helvetica').fontSize(10).text(card.value || '—', x + 10, 336, { width: w - 20 });
    });

    doc.fill('rgba(255,255,255,0.35)').font('Helvetica').fontSize(9)
      .text(`Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, pageHeight - 80, { width: contentWidth });
    doc.fill('rgba(255,255,255,0.2)').font('Helvetica').fontSize(8)
      .text('Documento confidencial — quickemigrate.com', margin, pageHeight - 60, { width: contentWidth });

    // ── PÁGINAS DE CONTENIDO ─────────────────────────────────
    doc.addPage();

    const addPageHeader = () => {
      doc.rect(0, 0, pageWidth, 45).fill('#1A1C1C');
      try {
        doc.image(logoPath, margin, 10, { height: 28 });
      } catch {
        doc.fill('#25D366').font('Helvetica-Bold').fontSize(9).text('Quick Emigrate', margin, 16);
      }
      doc.fill('rgba(255,255,255,0.4)').font('Helvetica').fontSize(8)
        .text(`Diagnóstico de ${nombre}`, pageWidth - margin - 100, 18, { width: 100, align: 'right' });
    };

    const checkPageBreak = (needed = 60) => {
      const remainingSpace = pageHeight - margin - doc.y;
      if (remainingSpace < needed + 80) {
        doc.addPage();
        addPageHeader();
        doc.y = 65;
      }
    };

    addPageHeader();
    doc.y = 65;

    const lineas = informe.split('\n');

    const estimateLineHeight = (line: string): number => {
      const t = line.trim();
      if (!t) return 0;
      const raw = t.replace(/\[(?:SECCION|SUBSECCION|ITEM|TEXTO|ALERTA|DESTACADO)\]\s*/g, '');
      if (t.startsWith('[ALERTA]')) {
        doc.font('Helvetica').fontSize(9);
        return Math.max(50, doc.heightOfString(raw, { width: contentWidth - 24 }) + 28) + 20;
      }
      if (t.startsWith('[DESTACADO]')) {
        doc.font('Helvetica-Bold').fontSize(26);
        return Math.max(52, doc.heightOfString(raw, { width: contentWidth - 32 }) + 24) + 16;
      }
      doc.font('Helvetica').fontSize(10);
      // FIX: [ITEM] renders with contentWidth - 22, not contentWidth
      const w = t.startsWith('[ITEM]') ? contentWidth - 22 : contentWidth;
      return doc.heightOfString(raw, { width: w }) + 20;
    };

    for (let i = 0; i < lineas.length; i++) {
      const trimmed = lineas[i].trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('[SECCION]')) {
        const titulo = trimmed.replace('[SECCION]', '').trim();

        let firstBlockHeight = 0;
        for (let j = i + 1; j < lineas.length; j++) {
          const next = lineas[j].trim();
          if (!next) continue;
          if (next.startsWith('[SECCION]')) break;
          firstBlockHeight = estimateLineHeight(lineas[j]);
          break;
        }
        doc.font('Helvetica-Bold').fontSize(13);
        checkPageBreak(Math.max(200, 60 + firstBlockHeight));

        doc.rect(margin, doc.y, 4, 22).fill('#25D366');
        doc.fill('#1A1C1C').font('Helvetica-Bold').fontSize(13)
          .text(titulo.toUpperCase(), margin + 12, doc.y, { width: contentWidth - 12 });
        doc.moveDown(0.6);
        doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y)
          .strokeColor('#E5E7EB').lineWidth(0.5).stroke();
        doc.moveDown(0.5);

      } else if (trimmed.startsWith('[SUBSECCION]')) {
        const sub = trimmed.replace('[SUBSECCION]', '').trim();

        let firstBlockHeight = 0;
        for (let j = i + 1; j < lineas.length; j++) {
          const next = lineas[j].trim();
          if (!next) continue;
          if (next.startsWith('[SECCION]') || next.startsWith('[SUBSECCION]')) break;
          firstBlockHeight = estimateLineHeight(lineas[j]);
          break;
        }
        // FIX: reset font before moveDown — estimateLineHeight may have changed it
        doc.font('Helvetica').fontSize(10);
        checkPageBreak(Math.max(120, 40 + firstBlockHeight));
        doc.moveDown(0.3);
        doc.fill('#25D366').font('Helvetica-Bold').fontSize(10)
          .text(sub, margin, doc.y, { width: contentWidth });
        doc.moveDown(0.3);

      } else if (trimmed.startsWith('[ITEM]')) {
        const item = trimmed.replace('[ITEM]', '').trim();
        doc.font('Helvetica').fontSize(10);
        const itemLines = doc.heightOfString(item, { width: contentWidth - 22 });
        const itemHeight = itemLines + 16;
        checkPageBreak(itemHeight + 40);

        const currentY = doc.y;
        doc.circle(margin + 8, currentY + 5, 3).fill('#25D366');
        doc.fill('#374151').font('Helvetica').fontSize(10)
          .text(item, margin + 22, currentY, { width: contentWidth - 22, lineGap: 2 });
        doc.moveDown(0.4);

      } else if (trimmed.startsWith('[TEXTO]')) {
        const texto = trimmed.replace('[TEXTO]', '').trim();
        doc.font('Helvetica').fontSize(10);
        const textoHeight = doc.heightOfString(texto, { width: contentWidth });
        checkPageBreak(textoHeight + 16);
        doc.fill('#374151').font('Helvetica').fontSize(10)
          .text(texto, margin, doc.y, { width: contentWidth, lineGap: 3, align: 'justify' });
        doc.moveDown(0.5);

      } else if (trimmed.startsWith('[ALERTA]')) {
        const alerta = trimmed.replace('[ALERTA]', '').trim();
        doc.font('Helvetica').fontSize(9);
        const alertaLines = doc.heightOfString(alerta, { width: contentWidth - 24 });
        const alertaHeight = Math.max(50, alertaLines + 28);
        checkPageBreak(alertaHeight + 20);

        const alertY = doc.y;
        doc.roundedRect(margin, alertY, contentWidth, alertaHeight, 4).fill('#FEF3C7');
        doc.rect(margin, alertY, 4, alertaHeight).fill('#F59E0B');
        doc.fill('#92400E').font('Helvetica-Bold').fontSize(8)
          .text('ALERTA IMPORTANTE', margin + 12, alertY + 10, { width: contentWidth - 20 });
        doc.fill('#78350F').font('Helvetica').fontSize(9)
          .text(alerta, margin + 12, alertY + 24, { width: contentWidth - 24, lineGap: 2 });
        doc.y = alertY + alertaHeight + 8;
        doc.moveDown(0.3);

      } else if (trimmed.startsWith('[DESTACADO]')) {
        const dest = trimmed.replace('[DESTACADO]', '').trim();
        const destFontSize = 26;
        doc.fontSize(destFontSize).font('Helvetica-Bold');
        const textWidth = contentWidth - 32;
        const textHeight = doc.heightOfString(dest, { width: textWidth });
        const boxHeight = Math.max(52, textHeight + 24);
        checkPageBreak(boxHeight + 16);
        const destY = doc.y;
        doc.roundedRect(margin, destY, contentWidth, boxHeight, 4).fill('#E8F8EE');
        doc.rect(margin, destY, 4, boxHeight).fill('#25D366');
        doc.fill('#25D366').font('Helvetica-Bold').fontSize(destFontSize)
          .text(dest, margin + 16, destY + 12, { width: textWidth, lineGap: 4 });
        doc.y = destY + boxHeight + 8;
        doc.moveDown(0.3);

      } else if (trimmed && !trimmed.startsWith('[')) {
        checkPageBreak(30);
        doc.fill('#374151').font('Helvetica').fontSize(10)
          .text(trimmed, margin, doc.y, { width: contentWidth, lineGap: 3 });
        doc.moveDown(0.4);
      }
    }

    // ── PÁGINA FINAL ─────────────────────────────────────────
    doc.addPage();
    doc.rect(0, 0, pageWidth, pageHeight).fill('#1A1C1C');

    doc.image(logoPath, pageWidth/2 - 30, 100, { height: 60 });

    doc.fill('#FFFFFF').font('Helvetica-Bold').fontSize(22)
      .text('Quick Emigrate', margin, 185, { width: contentWidth, align: 'center' });
    doc.fill('#25D366').font('Helvetica').fontSize(12)
      .text('Tu ruta hacia España, clara y guiada.', margin, 215, { width: contentWidth, align: 'center' });

    doc.moveTo(margin + 80, 250).lineTo(pageWidth - margin - 80, 250)
      .strokeColor('#25D366').lineWidth(1).stroke();

    doc.fill('rgba(255,255,255,0.7)').font('Helvetica').fontSize(11)
      .text('¿Tienes dudas sobre tu diagnóstico?', margin, 275, { width: contentWidth, align: 'center' });
    doc.fill('#25D366').font('Helvetica-Bold').fontSize(14)
      .text('diagnostico@quickemigrate.com', margin, 298, { width: contentWidth, align: 'center' });
    doc.fill('rgba(255,255,255,0.6)').font('Helvetica').fontSize(11)
      .text('quickemigrate.com', margin, 322, { width: contentWidth, align: 'center' });

    doc.roundedRect(margin + 20, 370, contentWidth - 40, 80, 8).fill('rgba(37,211,102,0.12)');
    doc.rect(margin + 20, 370, 4, 80).fill('#25D366');
    doc.fill('#25D366').font('Helvetica-Bold').fontSize(10)
      .text('PRÓXIMO PASO RECOMENDADO', margin + 34, 386, { width: contentWidth - 60 });
    doc.fill('#FFFFFF').font('Helvetica').fontSize(10)
      .text('Accede a tu área privada en quickemigrate.com/cliente para hacer seguimiento de tu expediente y subir tus documentos.', margin + 34, 406, { width: contentWidth - 60, lineGap: 3 });

    doc.fill('rgba(255,255,255,0.2)').font('Helvetica').fontSize(8)
      .text(`© 2026 Quick Emigrate — Documento confidencial generado el ${new Date().toLocaleDateString('es-ES')}`, margin, pageHeight - 45, { width: contentWidth, align: 'center' });

    doc.end();
  });
}

export default router;
