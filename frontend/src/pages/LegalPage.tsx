import { useParams, Link } from 'react-router-dom';

type Slug = 'terminos' | 'privacidad' | 'cookies';

const CONTENT: Record<Slug, { title: string; updated: string; sections: { h: string; p: string }[] }> = {
  terminos: {
    title: 'Términos de Servicio',
    updated: '2026-05-07',
    sections: [
      {
        h: '1. Aceptación',
        p: 'Al usar Quick Emigrate (quickemigrate.com) aceptas estos términos. Si no estás de acuerdo, no uses el servicio.',
      },
      {
        h: '2. Descripción del servicio',
        p: 'Quick Emigrate ofrece informes orientativos y herramientas IA para procesos migratorios España. No somos abogados ni gestoría: la información es orientativa, no asesoramiento legal vinculante.',
      },
      {
        h: '3. Pago y reembolsos',
        p: 'Los pagos se procesan vía Stripe. El diagnóstico Starter (59€) es pago único; el plan Pro (39€/mes) es suscripción mensual cancelable. Reembolsos hasta 14 días si no se ha generado el informe.',
      },
      {
        h: '4. Limitación de responsabilidad',
        p: 'Quick Emigrate no garantiza la concesión de visados ni resoluciones favorables. La decisión final corresponde a las autoridades españolas.',
      },
      {
        h: '5. Contacto',
        p: 'hola@quickemigrate.com',
      },
    ],
  },
  privacidad: {
    title: 'Política de Privacidad',
    updated: '2026-05-07',
    sections: [
      {
        h: '1. Datos que recogemos',
        p: 'Email, nombre, país, datos de perfil migratorio (edad, sector, situación, objetivo), documentos que subes voluntariamente, mensajes del chat IA.',
      },
      {
        h: '2. Finalidad',
        p: 'Generar diagnósticos personalizados, ofrecer asistente IA, gestionar tu cuenta y suscripción, contacto comercial. No vendemos tus datos.',
      },
      {
        h: '3. Base legal',
        p: 'Consentimiento al registrarte y ejecución del contrato (RGPD art. 6.1.a y 6.1.b).',
      },
      {
        h: '4. Proveedores',
        p: 'Firebase Auth + Firestore (Google Ireland), Stripe (pagos), Anthropic (modelo IA), Voyage AI (embeddings), Resend (email), Vercel + Railway (hosting). Transferencias internacionales con garantías estándar UE.',
      },
      {
        h: '5. Tus derechos',
        p: 'Acceso, rectificación, supresión, portabilidad, oposición. Solicítalo escribiendo a hola@quickemigrate.com. Plazo respuesta máx 30 días.',
      },
      {
        h: '6. Conservación',
        p: 'Datos de cuenta: mientras la cuenta esté activa + 1 año. Diagnósticos: 5 años (obligación fiscal). Eliminación bajo solicitud.',
      },
      {
        h: '7. Contacto',
        p: 'hola@quickemigrate.com — DPO: Pablo Segundo (CTO).',
      },
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    updated: '2026-05-07',
    sections: [
      {
        h: '1. Qué son',
        p: 'Pequeños archivos que se almacenan en tu dispositivo al navegar.',
      },
      {
        h: '2. Cookies que usamos',
        p: 'Técnicas (sesión Firebase Auth, preferencias UI vía localStorage). Analíticas: Vercel Analytics + Speed Insights (anonimizadas, sin personalización).',
      },
      {
        h: '3. Terceros',
        p: 'Stripe (proceso de pago), Firebase (autenticación). Estos servicios pueden establecer cookies propias bajo sus políticas.',
      },
      {
        h: '4. Control',
        p: 'Puedes borrar cookies desde la configuración de tu navegador. Deshabilitarlas puede romper login y pagos.',
      },
    ],
  },
};

export default function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  const data = slug && slug in CONTENT ? CONTENT[slug as Slug] : null;

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6 pt-20">
        <div className="text-center">
          <h1 className="text-[26px] font-semibold text-white mb-3">Página no encontrada</h1>
          <Link to="/" className="text-[#25D366] font-semibold">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-16 px-6">
      <article className="max-w-[680px] mx-auto">
        <h1 className="text-[34px] md:text-[42px] font-bold tracking-[-0.025em] text-white mb-2">
          {data.title}
        </h1>
        <p className="text-[13px] text-white/40 mb-10">Última actualización: {data.updated}</p>

        <div className="space-y-8">
          {data.sections.map(({ h, p }) => (
            <section key={h}>
              <h2 className="text-[18px] font-semibold text-white mb-2">{h}</h2>
              <p className="text-[15px] text-white/65 leading-[1.7]">{p}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link to="/" className="text-[14px] text-[#25D366] font-semibold hover:opacity-80">
            ← Volver al inicio
          </Link>
        </div>
      </article>
    </div>
  );
}
