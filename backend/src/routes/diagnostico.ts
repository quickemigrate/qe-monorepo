import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../firebase';
import { Resend } from 'resend';
import PDFDocument from 'pdfkit';
import path from 'path';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const resend = new Resend(process.env.RESEND_API_KEY || '');

// POST /api/diagnostico/checkout
// Recibe las respuestas del formulario, las guarda en Firestore y crea una sesión de pago en Stripe
router.post('/checkout', async (req: Request, res: Response) => {
  const { nombre, email, pais, edad, estudios, objetivo, situacion, plazo, medios, sector } = req.body;

  if (!nombre || !email || !pais || !objetivo) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Guardar respuestas del formulario en Firestore con estado pendiente_pago
    const docRef = await db.collection('diagnosticos').add({
      nombre,
      email,
      pais,
      edad,
      estudios,
      objetivo,
      situacion,
      plazo,
      medios,
      sector,
      estado: 'pendiente_pago',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Crear sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/diagnostico/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/diagnostico?cancelado=true`,
      customer_email: email,
      metadata: {
        diagnostico_id: docRef.id,
        nombre,
        email
      }
    });

    res.json({ url: session.url, diagnostico_id: docRef.id });
  } catch (error) {
    console.error('Error creando checkout:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
});

// POST /api/diagnostico/webhook
// Stripe llama a este endpoint cuando el pago se completa
// Genera el informe con IA y lo envía por email
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature failed:', err);
    return res.status(400).send('Webhook Error');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const diagnosticoId = session.metadata?.diagnostico_id;
    const email = session.metadata?.email;
    const nombre = session.metadata?.nombre;

    if (!diagnosticoId || !email) {
      return res.status(400).json({ error: 'Metadata incompleta' });
    }

    // Responder a Stripe inmediatamente para evitar timeout
    res.json({ ok: true });

    // Procesar el informe en segundo plano (sin await)
    procesarDiagnostico(diagnosticoId, email, nombre || '').catch(err => {
      console.error('Error en procesamiento asíncrono:', err);
    });

    return;
  } else {
    res.json({ received: true });
  }
});

// GET /api/diagnostico/:id
// Obtiene el estado de un diagnóstico
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const doc = await db.collection('diagnosticos').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo diagnóstico' });
  }
});

// Procesa el informe en segundo plano tras confirmar pago a Stripe
async function procesarDiagnostico(diagnosticoId: string, email: string, nombre: string) {
  console.log('Iniciando procesamiento diagnóstico:', diagnosticoId, email);
  const doc = await db.collection('diagnosticos').doc(diagnosticoId).get();
  const data = doc.data();
  console.log('Datos obtenidos de Firestore:', data?.nombre, data?.email);

  if (!data) throw new Error('Diagnóstico no encontrado');

  const prompt = `Eres un experto en inmigración española. Genera un informe de diagnóstico migratorio para el siguiente perfil.

IMPORTANTE: No uses markdown (sin ##, sin **, sin tablas, sin guiones como listas). Usa EXACTAMENTE estos marcadores para estructurar el informe:

[SECCION] para títulos de sección principales
[SUBSECCION] para subtítulos
[ITEM] para items de lista
[TEXTO] para párrafos normales
[ALERTA] para alertas o riesgos importantes
[DESTACADO] para datos o porcentajes importantes

PERFIL DEL USUARIO:
- Nombre: ${data.nombre}
- País de origen: ${data.pais}
- Edad: ${data.edad}
- Nivel de estudios: ${data.estudios}
- Objetivo en España: ${data.objetivo}
- Situación actual: ${data.situacion}
- Plazo para emigrar: ${data.plazo}
- Medios económicos disponibles: ${data.medios}
- Sector de interés: ${data.sector}

Genera el informe con estas secciones en orden:

[SECCION] Resumen Ejecutivo
[TEXTO] párrafo resumen...

[SECCION] Vía Migratoria Recomendada
[SUBSECCION] nombre del visado
[TEXTO] explicación...
[ITEM] razón 1
[ITEM] razón 2

[SECCION] Probabilidad de Éxito
[DESTACADO] XX%
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

Sé específico, útil y directo. Máximo 1500 palabras en total.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });
  const informeTexto = (message.content[0] as { type: string; text: string }).text;
  console.log('Informe generado, longitud:', informeTexto.length);

  const pdfBuffer = await generarPDF(data.nombre, informeTexto, data);
  console.log('PDF generado, tamaño:', pdfBuffer.length);

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
    updatedAt: new Date().toISOString()
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

    const logoPath = path.join(__dirname, '../../..', 'assets/logos/logo-dark-iso.png');
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

    let itemCounter = 0;
    let enSeccion = false;

    const checkPageBreak = (needed = 60) => {
      if (doc.y > pageHeight - needed) {
        doc.addPage();
        doc.rect(0, 0, pageWidth, 45).fill('#1A1C1C');
        try {
          doc.image(logoPath, margin, 10, { height: 28 });
        } catch {
          doc.fill('#25D366').font('Helvetica-Bold').fontSize(9).text('Quick Emigrate', margin, 16);
        }
        doc.fill('rgba(255,255,255,0.4)').font('Helvetica').fontSize(8)
          .text(`Diagnóstico de ${nombre}`, pageWidth - margin - 100, 18, { width: 100, align: 'right' });
        doc.y = 65;
      }
    };

    // Header primera página de contenido
    doc.rect(0, 0, pageWidth, 45).fill('#1A1C1C');
    try {
      doc.image(logoPath, margin, 10, { height: 28 });
    } catch {
      doc.fill('#25D366').font('Helvetica-Bold').fontSize(9).text('Quick Emigrate', margin, 16);
    }
    doc.fill('rgba(255,255,255,0.4)').font('Helvetica').fontSize(8)
      .text(`Diagnóstico de ${nombre}`, pageWidth - margin - 100, 18, { width: 100, align: 'right' });
    doc.y = 65;

    const lineas = informe.split('\n');

    for (const linea of lineas) {
      const trimmed = linea.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('[SECCION]')) {
        const titulo = trimmed.replace('[SECCION]', '').trim();
        if (enSeccion) doc.moveDown(0.8);
        checkPageBreak(100);
        enSeccion = true;
        itemCounter = 0;

        doc.rect(margin, doc.y, 4, 22).fill('#25D366');
        doc.fill('#1A1C1C').font('Helvetica-Bold').fontSize(13)
          .text(titulo.toUpperCase(), margin + 12, doc.y, { width: contentWidth - 12 });
        doc.moveDown(0.6);
        doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y)
          .strokeColor('#E5E7EB').lineWidth(0.5).stroke();
        doc.moveDown(0.5);

      } else if (trimmed.startsWith('[SUBSECCION]')) {
        checkPageBreak(40);
        const sub = trimmed.replace('[SUBSECCION]', '').trim();
        doc.moveDown(0.3);
        doc.fill('#25D366').font('Helvetica-Bold').fontSize(10)
          .text(sub, margin, doc.y, { width: contentWidth });
        doc.moveDown(0.3);

      } else if (trimmed.startsWith('[ITEM]')) {
        const item = trimmed.replace('[ITEM]', '').trim();
        doc.font('Helvetica').fontSize(10);
        const itemHeight = doc.heightOfString(item, { width: contentWidth - 22 });
        checkPageBreak(itemHeight + 12);

        const currentY = doc.y;
        doc.circle(margin + 8, currentY + 5, 3).fill('#25D366');
        doc.fill('#374151').font('Helvetica').fontSize(10)
          .text(item, margin + 22, currentY, { width: contentWidth - 22, lineGap: 2 });
        doc.moveDown(0.3);

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
          .text('⚠ ALERTA IMPORTANTE', margin + 12, alertY + 10, { width: contentWidth - 20 });
        doc.fill('#78350F').font('Helvetica').fontSize(9)
          .text(alerta, margin + 12, alertY + 24, { width: contentWidth - 24, lineGap: 2 });
        doc.y = alertY + alertaHeight + 8;
        doc.moveDown(0.3);

      } else if (trimmed.startsWith('[DESTACADO]')) {
        const dest = trimmed.replace('[DESTACADO]', '').trim();
        checkPageBreak(55);
        const destY = doc.y;
        doc.roundedRect(margin, destY, contentWidth, 44, 4).fill('#E8F8EE');
        doc.rect(margin, destY, 4, 44).fill('#25D366');
        doc.fill('#25D366').font('Helvetica-Bold').fontSize(26)
          .text(dest, margin + 16, destY + 8, { width: contentWidth - 20 });
        doc.y = destY + 52;

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
      .text('hola@quickemigrate.com', margin, 298, { width: contentWidth, align: 'center' });
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
