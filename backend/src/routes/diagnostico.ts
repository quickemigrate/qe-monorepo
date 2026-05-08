import { Router, Request, Response } from 'express';
import { db } from '../firebase';
import { verifyClientToken } from '../middleware/clientAuth';
import { stripe } from '../config/stripe';
import { procesarConRetry, generarPDF } from '../services/diagnosticoProcessor';

const router = Router();

const SAMPLE_INFORME = `[SECCION] Resumen Ejecutivo
[TEXTO] María, tu perfil tiene una probabilidad alta de obtener una autorización de residencia y trabajo en España dentro de los próximos 6-12 meses. Como ingeniera argentina con 4 años de experiencia y estudios universitarios, encajas en varias rutas viables. La opción más sólida en tu caso es el visado de residencia y trabajo por cuenta ajena con oferta firme, complementada con el reconocimiento del título profesional.

[SECCION] Vía Migratoria Recomendada
[SUBSECCION] Visado de residencia y trabajo por cuenta ajena
[TEXTO] Esta vía es la más adecuada para tu perfil porque permite entrar en España con un contrato firmado, autorización inicial de un año prorrogable y acceso directo a la Seguridad Social.
[ITEM] Tu sector (tecnología) está incluido en el catálogo de ocupaciones de difícil cobertura, lo que acelera el procedimiento.
[ITEM] Tu nivel de estudios y experiencia justifican el salario mínimo exigido.
[ITEM] Argentina tiene convenio de doble nacionalidad: tras 2 años de residencia legal puedes solicitar la española.

[SECCION] Probabilidad de Éxito
[DESTACADO] Alta (entre 70-85%)
[TEXTO] Tu perfil cumple los requisitos formales principales. Los puntos pendientes (oferta de empleo formal, homologación) son resolubles con preparación adecuada.
[SUBSECCION] Factores positivos
[ITEM] Sector demandado (tecnología) y experiencia suficiente.
[ITEM] Edad joven y sin antecedentes penales esperados.
[ITEM] Ahorros disponibles para cubrir trámites y desplazamiento.
[ITEM] Convenio de nacionalidad acelera futura ciudadanía.
[SUBSECCION] Factores negativos
[ITEM] Falta de oferta concreta al iniciar el proceso (resoluble en 2-3 meses).
[ITEM] Homologación del título técnico requiere apostilla previa en Argentina.

[SECCION] Checklist de Documentos
[ITEM] Pasaporte vigente con al menos 1 año de validez restante.
[ITEM] Certificado de antecedentes penales argentino apostillado, traducido jurado.
[ITEM] Título universitario apostillado y traducido jurado.
[ITEM] Currículum profesional actualizado en español y formato europeo.
[ITEM] Contrato de trabajo firmado por la empresa en España.
[ITEM] Certificado médico oficial (modelo del consulado).
[ITEM] Justificante de medios económicos (extractos bancarios últimos 3 meses).
[ITEM] Fotografías tamaño pasaporte recientes.

[SECCION] Plazos Estimados
[ITEM] Fase 1: preparación documental en Argentina (apostillas, antecedentes) — 4 a 6 semanas.
[ITEM] Fase 2: búsqueda de oferta laboral con empresa que tramite — 6 a 12 semanas.
[ITEM] Fase 3: presentación expediente en oficina de extranjería en España — 1 a 3 meses.
[ITEM] Fase 4: cita en consulado argentino para visado — 4 a 8 semanas.
[ITEM] Fase 5: viaje, alta TIE y empadronamiento — 2 a 4 semanas tras llegada.

[SECCION] Riesgos y Alertas
[ALERTA] Las apostillas argentinas tardan más de lo previsto. Empieza por ese trámite incluso antes de tener oferta laboral firme — caduca la documentación si pasan más de 6 meses.
[ITEM] Solicita la apostilla de Cancillería argentina apenas tengas certificados emitidos.
[ITEM] Mantén copia digital de toda la documentación en la nube.
[ITEM] Verifica que la empresa que te ofrezca trabajo está al corriente con la Seguridad Social.

[SECCION] Próximos Pasos Inmediatos
[ITEM] Esta semana: solicita certificado de antecedentes penales en RENAPER (válido 6 meses).
[ITEM] Próximas 2 semanas: comienza apostilla del título universitario.
[ITEM] Mes 1: empieza búsqueda activa en LinkedIn y portales especializados (InfoJobs, Tecnoempleo).
[ITEM] Mes 2: contacta empresas españolas que ya hayan contratado argentinos (más experiencia con tu trámite).
[ITEM] Antes del mes 3: ten todos los documentos apostillados y traducidos listos para enviar.

[SECCION] Nota Final
[TEXTO] Tu perfil es competitivo y la ruta clara. La diferencia entre éxito y bloqueo está casi siempre en la preparación documental y el timing. Con organización y los pasos en orden, en menos de un año puedes estar trabajando legalmente en España con vista a la nacionalidad en 24 meses adicionales. Este es un ejemplo de informe — el tuyo será específico para tu caso real.`;

// GET /api/diagnostico/sample — PDF público de ejemplo (cacheado)
router.get('/sample', async (_req: Request, res: Response) => {
  try {
    const sampleRef = db.collection('samples').doc('diagnostico-sample');
    const snap = await sampleRef.get();

    let pdfBase64 = snap.data()?.pdfBase64 as string | undefined;

    if (!pdfBase64) {
      const pdfBuffer = await generarPDF(
        'María García',
        SAMPLE_INFORME,
        {
          pais: 'Argentina',
          objetivo: 'Trabajar',
          plazo: 'Entre 6 meses y 1 año',
        },
      );
      pdfBase64 = pdfBuffer.toString('base64');
      await sampleRef.set({ pdfBase64, generadoEn: new Date().toISOString() });
    }

    const buffer = Buffer.from(pdfBase64, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="diagnostico-ejemplo-quickemigrate.pdf"');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) {
    console.error('Error generando sample PDF:', err);
    res.status(500).json({ success: false, error: 'Error al generar PDF de ejemplo' });
  }
});

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
      payment_method_types: ['card', 'bizum'],
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

    if (!paymentIntentId || !diagnosticoId) {
      return res.status(400).json({ success: false, error: 'Faltan datos del pago' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, error: 'Pago no completado' });
    }

    // Ownership: el PaymentIntent debe haberse creado para este diagnosticoId
    if (paymentIntent.metadata?.diagnosticoId !== diagnosticoId) {
      return res.status(403).json({ success: false, error: 'Pago no corresponde al diagnóstico' });
    }

    const diagRef = db.collection('diagnosticos').doc(diagnosticoId);
    const diagSnap = await diagRef.get();
    if (!diagSnap.exists) {
      return res.status(404).json({ success: false, error: 'Diagnóstico no encontrado' });
    }

    const existing = diagSnap.data()!;

    // Idempotencia: si ya está procesando/completado/error con el mismo PI, devolver éxito sin reprocesar
    if (
      existing.stripePaymentIntentId === paymentIntentId &&
      ['procesando', 'completado', 'error'].includes(existing.estado)
    ) {
      return res.json({ success: true, diagnosticoId, alreadyProcessed: true });
    }

    await diagRef.update({
      estado: 'procesando',
      stripePaymentIntentId: paymentIntentId,
      pagadoEn: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const diagDoc = await diagRef.get();
    const diagData = diagDoc.data()!;

    if (diagData.email) {
      await db.collection('usuarios').doc(diagData.email).update({
        diagnosticoId,
        plan: 'starter',
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

export default router;
