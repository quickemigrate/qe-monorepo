import cron from 'node-cron';
import { Resend } from 'resend';
import { db } from '../firebase';

type RecordatorioTipo = 'd3' | 'd7' | 'd30';

interface Plantilla {
  asunto: (nombre: string) => string;
  html: (params: { nombre: string; pais?: string; baseUrl: string; optOutUrl: string }) => string;
}

const PLANTILLAS: Record<RecordatorioTipo, Plantilla> = {
  d3: {
    asunto: (nombre) => `${nombre}, ¿pudiste revisar tu diagnóstico?`,
    html: ({ nombre, baseUrl, optOutUrl }) => baseTemplate({
      nombre, optOutUrl,
      titulo: '¿Has revisado tu informe?',
      cuerpo: `
        <p>Hace 3 días te enviamos tu diagnóstico migratorio personalizado. ¿Has tenido oportunidad de leerlo?</p>
        <p>Si tienes dudas sobre algún apartado del informe, podemos ayudarte:</p>
        <ul>
          <li>El asistente IA Mia puede explicarte cualquier punto del informe en lenguaje claro.</li>
          <li>Si necesitas validación de un abogado, dimos de alta el Plan Premium.</li>
        </ul>
      `,
      cta: { label: 'Ver mi diagnóstico', url: `${baseUrl}/cliente/inicio` },
    }),
  },
  d7: {
    asunto: () => `Tu checklist de documentos esta semana`,
    html: ({ nombre, baseUrl, optOutUrl }) => baseTemplate({
      nombre, optOutUrl,
      titulo: 'Próximos pasos para esta semana',
      cuerpo: `
        <p>Una semana después de tu diagnóstico, este es un buen momento para empezar a reunir documentos.</p>
        <p>Tu informe incluye una checklist específica. Te recomendamos:</p>
        <ol>
          <li>Empieza por los documentos del país de origen — son los que más tardan (apostilla, antecedentes).</li>
          <li>Pide cita en el consulado con antelación si la ruta lo requiere.</li>
          <li>Sube tus documentos a tu área privada para tenerlos centralizados.</li>
        </ol>
      `,
      cta: { label: 'Subir mis documentos', url: `${baseUrl}/cliente/documentos` },
    }),
  },
  d30: {
    asunto: () => `Un mes después: ¿cómo va tu proceso?`,
    html: ({ nombre, baseUrl, optOutUrl }) => baseTemplate({
      nombre, optOutUrl,
      titulo: '¿Cómo va tu emigración a España?',
      cuerpo: `
        <p>Ha pasado un mes desde tu diagnóstico. Sea cual sea tu avance, queremos seguir acompañándote.</p>
        <p>Si necesitas más respuestas o seguimiento, el Plan Pro incluye:</p>
        <ul>
          <li>Asistente IA con tu contexto personal</li>
          <li>Gestión de tus documentos</li>
          <li>Diagnóstico ampliado actualizado</li>
        </ul>
        <p>Si ya tienes la cita en el consulado o has presentado expediente, ¡cuéntanoslo!</p>
      `,
      cta: { label: 'Explorar Plan Pro', url: `${baseUrl}/cliente/plan` },
    }),
  },
};

function baseTemplate({ nombre, titulo, cuerpo, cta, optOutUrl }: {
  nombre: string;
  titulo: string;
  cuerpo: string;
  cta: { label: string; url: string };
  optOutUrl: string;
}): string {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f4f5; padding: 32px 16px;">
  <div style="background: #1A1C1C; border-radius: 16px; padding: 28px;">
    <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Quick Emigrate</p>
    <h1 style="color: #fff; font-size: 22px; margin: 0;">Hola ${escape(nombre)},</h1>
    <h2 style="color: #25D366; font-size: 18px; margin: 12px 0 0 0;">${escape(titulo)}</h2>
  </div>
  <div style="background: #fff; border-radius: 16px; padding: 28px; margin-top: 16px; color: #374151; line-height: 1.65; font-size: 14.5px;">
    ${cuerpo}
    <div style="text-align: center; margin: 24px 0 8px;">
      <a href="${cta.url}" style="display: inline-block; background: #25D366; color: #062810; font-weight: 700; padding: 12px 22px; border-radius: 999px; text-decoration: none; font-size: 14px;">${escape(cta.label)}</a>
    </div>
  </div>
  <p style="color: #6B7280; font-size: 11.5px; text-align: center; margin: 16px 8px 0;">
    Recibes este email porque generaste un diagnóstico en quickemigrate.com.
    <a href="${optOutUrl}" style="color: #6B7280;">Dejar de recibir recordatorios</a>.
  </p>
</div>`;
}

function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

const SCHEDULE: { tipo: RecordatorioTipo; minDias: number; maxDias: number }[] = [
  { tipo: 'd3', minDias: 3, maxDias: 6 },
  { tipo: 'd7', minDias: 7, maxDias: 13 },
  { tipo: 'd30', minDias: 30, maxDias: 45 },
];

export async function procesarRecordatorios(): Promise<{ enviados: number; errores: number }> {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Quick Emigrate <hola@quickemigrate.com>';
  const baseUrl = process.env.FRONTEND_URL || 'https://quickemigrate.com';

  if (!resendKey) {
    console.warn('[recordatorios] RESEND_API_KEY no configurada — saltando');
    return { enviados: 0, errores: 0 };
  }

  const resend = new Resend(resendKey);
  const apiBase = process.env.BACKEND_PUBLIC_URL || 'https://qe-production.up.railway.app';
  const ahora = Date.now();
  let enviados = 0;
  let errores = 0;

  for (const { tipo, minDias, maxDias } of SCHEDULE) {
    const desde = new Date(ahora - maxDias * 24 * 60 * 60 * 1000).toISOString();
    const hasta = new Date(ahora - minDias * 24 * 60 * 60 * 1000).toISOString();

    let snap;
    try {
      snap = await db.collection('diagnosticos')
        .where('estado', '==', 'completado')
        .where('completadoEn', '>=', desde)
        .where('completadoEn', '<=', hasta)
        .limit(100)
        .get();
    } catch (err) {
      console.error(`[recordatorios] Error consultando ${tipo}:`, err);
      errores++;
      continue;
    }

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const flagPath = `recordatorios.${tipo}`;

      // Skip si ya enviado
      if (data.recordatorios?.[tipo]) continue;
      if (!data.email) continue;
      if (data.recordatoriosOptOut) continue;

      const optOutUrl = `${apiBase}/api/usuarios/recordatorios/optout/${docSnap.id}`;
      try {
        await resend.emails.send({
          from: fromEmail,
          to: data.email,
          subject: PLANTILLAS[tipo].asunto(data.nombre || ''),
          html: PLANTILLAS[tipo].html({ nombre: data.nombre || '', pais: data.pais, baseUrl, optOutUrl }),
          headers: {
            'List-Unsubscribe': `<${optOutUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });

        await docSnap.ref.update({
          [flagPath]: new Date().toISOString(),
        });
        enviados++;
      } catch (err) {
        console.error(`[recordatorios] Error enviando ${tipo} a ${data.email}:`, err);
        errores++;
      }
    }
  }

  if (enviados > 0 || errores > 0) {
    console.log(`[recordatorios] tipo-batch enviados=${enviados} errores=${errores}`);
  }
  return { enviados, errores };
}

export function startRecordatoriosCron() {
  if (process.env.DISABLE_RECORDATORIOS === 'true') {
    console.log('[recordatorios] desactivados via DISABLE_RECORDATORIOS');
    return;
  }
  // Diario 09:00 Madrid time
  cron.schedule('0 9 * * *', () => {
    procesarRecordatorios().catch(err => console.error('[recordatorios] cron error:', err));
  }, { timezone: 'Europe/Madrid' });
  console.log('[recordatorios] cron programado (09:00 Europe/Madrid)');
}
