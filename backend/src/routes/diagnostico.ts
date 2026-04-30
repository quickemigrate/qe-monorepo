import { Router, Request, Response } from 'express';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../firebase';
import { Resend } from 'resend';
import PDFDocument from 'pdfkit';
import path from 'path';
import { obtenerContextoLegal } from '../services/rag';
import { verifyClientToken } from '../middleware/clientAuth';
import { paypalClient } from '../config/paypal';

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

// POST /api/diagnostico/create-order
// Lee el perfil del usuario autenticado, guarda diagnóstico pendiente y crea orden en PayPal
router.post('/create-order', async (req: Request, res: Response) => {
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
          datosFormulario = {
            ...userData.perfil,
            nombre: userData.nombre,
            email,
          };
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

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          value: precioStarter.toFixed(2),
        },
        description: 'Diagnóstico Migratorio IA — Quick Emigrate',
        custom_id: diagnosticoRef.id,
      }],
      application_context: {
        brand_name: 'Quick Emigrate',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
      },
    } as any);

    const order = await paypalClient.execute(request);

    await diagnosticoRef.update({
      paypalOrderId: order.result.id,
    });

    res.json({
      success: true,
      orderId: order.result.id,
      diagnosticoId: diagnosticoRef.id,
    });
  } catch (error) {
    console.error('Error creando orden PayPal:', error);
    res.status(500).json({ success: false, error: 'Error al crear orden' });
  }
});

// POST /api/diagnostico/capture-order
// Captura el pago en PayPal y dispara el procesamiento del diagnóstico
router.post('/capture-order', async (req: Request, res: Response) => {
  try {
    const { orderId, diagnosticoId } = req.body;

    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    const capture = await paypalClient.execute(request);

    if (capture.result.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Pago no completado',
      });
    }

    await db.collection('diagnosticos').doc(diagnosticoId).update({
      estado: 'procesando',
      paypalCaptureId: capture.result.id,
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
    console.error('Error capturando orden PayPal:', error);
    res.status(500).json({ success: false, error: 'Error al capturar pago' });
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
[DESTACADO] para datos o porcentajes importantes

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

Sé específico, útil y directo. Máximo 800 palabras en total. Sé directo y específico.`;

  const prompt = contextoLegal
    ? `CONTEXTO LEGAL ACTUALIZADO (usa esta información como base):\n\n${contextoLegal}\n\n---\n\n${promptBase}`
    : promptBase;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  });
  const informeTexto = (message.content[0] as { type: string; text: string }).text;
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

    for (const linea of lineas) {
      const trimmed = linea.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('[SECCION]')) {
        const titulo = trimmed.replace('[SECCION]', '').trim();
        checkPageBreak(100);

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
          .text('⚠ ALERTA IMPORTANTE', margin + 12, alertY + 10, { width: contentWidth - 20 });
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
      .text('quickemigrate@gmail.com', margin, 298, { width: contentWidth, align: 'center' });
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
