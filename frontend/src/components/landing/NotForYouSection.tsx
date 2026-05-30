import { X } from 'lucide-react';

const ITEMS = [
  {
    title: 'Buscas consejo gratis 24/7',
    body: 'Esto es un servicio de pago. Si esperas respuestas ilimitadas sin coste, no somos lo tuyo.',
  },
  {
    title: 'Tu caso ya está en los tribunales',
    body: 'Si tienes un expediente abierto, recurso o litigio en marcha, necesitas un abogado de extranjería, no a nosotros.',
  },
  {
    title: 'No quieres mover un papel',
    body: 'Te decimos qué hacer y te acompañamos, pero los trámites los haces tú. No somos una gestoría.',
  },
];

export default function NotForYouSection() {
  return (
    <section className="ea-section" id="no-es-para-ti">
      <div className="ea-wrap" style={{ maxWidth: 880 }}>
        <div className="ea-sec-head">
          <h2>Para quién <span style={{ color: '#25D366' }}>no</span> es.</h2>
          <p>Mejor decírtelo ahora. Ahorramos tiempo los dos.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {ITEMS.map(({ title, body }) => (
            <div
              key={title}
              className="rounded-3xl p-6 md:p-7"
              style={{
                background: 'rgba(37,211,102,0.04)',
                border: '1px solid rgba(37,211,102,0.18)',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(37,211,102,0.12)',
                  border: '1px solid rgba(37,211,102,0.30)',
                }}
              >
                <X size={18} strokeWidth={2.5} style={{ color: '#25D366' }} />
              </div>
              <h3 className="text-[16px] md:text-[17px] font-semibold text-white mb-2 leading-tight">
                {title}
              </h3>
              <p className="text-[13.5px] md:text-[14px] text-white/55 leading-[1.6]">
                {body}
              </p>
            </div>
          ))}
        </div>
        <p className="text-center text-[13.5px] text-white/40" style={{ marginTop: 56 }}>
          ¿Sigues aquí? Entonces probablemente sí seamos para ti. 👇
        </p>
      </div>
    </section>
  );
}
