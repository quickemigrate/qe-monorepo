import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: '¿Esto reemplaza a un abogado de extranjería?',
    a: 'No. Quick Emigrate te orienta, te dice qué visado pedir, qué papeles juntar y cómo prepararte. Si tu caso es complejo o necesitas representación legal, te recomendamos un abogado. Somos el paso previo: entender qué hacer, antes de gastar 800€ en una consulta.',
  },
  {
    q: '¿Y si el diagnóstico dice que no soy elegible?',
    a: 'Te lo decimos claro y te damos las alternativas reales. Mejor saberlo hoy con honestidad que descubrirlo después de gastar 2000€ en gestiones que no iban a prosperar. Si no hay vía viable, lo decimos.',
  },
  {
    q: '¿Cómo de actualizada está la información?',
    a: 'Trabajamos sobre la normativa de extranjería española actualizada a 2026 y publicaciones del BOE. Cuando hay cambios relevantes (nuevos visados, requisitos, cuantías), actualizamos la base en días, no meses.',
  },
  {
    q: '¿Puedo cancelar la suscripción?',
    a: 'Sí, cuando quieras. Sin permanencia ni penalización. Cancelas desde tu área de cliente y dejas de pagar el siguiente mes. El diagnóstico que ya hiciste es tuyo y lo conservas.',
  },
  {
    q: '¿Mis datos y documentos están seguros?',
    a: 'Sí. Datos cifrados, almacenamiento privado y nunca compartimos información con terceros. Tus documentos los procesamos solo para darte respuestas concretas a tu caso — no los usamos para entrenar modelos ni los vendemos.',
  },
  {
    q: '¿En qué se diferencia de buscar en Google o ChatGPT?',
    a: 'Google te da 50 artículos genéricos, muchos desactualizados. ChatGPT no conoce tu caso ni la normativa española al detalle. Nosotros cruzamos tu situación con la ley vigente y te damos una recomendación concreta para ti. Sin generalidades.',
  },
  {
    q: '¿Cuánto tarda el diagnóstico?',
    a: 'Menos de 5 minutos desde que completas el formulario. El informe PDF te llega por email y también lo tienes en tu área de cliente.',
  },
  {
    q: '¿Sirve si no soy de Latinoamérica?',
    a: 'Nuestra base está pensada para procesos Latam → España, que es donde más experiencia tenemos. Si vienes de otro país, el diagnóstico funciona pero puede haber matices que se nos escapen. Escríbenos antes y te decimos.',
  },
];

function FaqItem({ q, a, open, onToggle }: Faq & { open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-white/[0.08]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-[15px] md:text-[16px] font-semibold text-white/90 group-hover:text-white transition-colors">
          {q}
        </span>
        <ChevronDown
          size={20}
          className="shrink-0 text-white/40 group-hover:text-[#25D366] transition-all"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <div
        style={{
          maxHeight: open ? '500px' : '0',
          opacity: open ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease, opacity 0.25s ease',
        }}
      >
        <p className="pb-5 pr-8 text-[14px] md:text-[14.5px] text-white/55 leading-[1.65]">
          {a}
        </p>
      </div>
    </div>
  );
}

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="ea-section" id="faq">
      <div className="ea-wrap" style={{ maxWidth: 760 }}>
        <div className="ea-sec-head">
          <h2>Preguntas <span style={{ color: 'var(--green)' }}>honestas.</span></h2>
          <p>Las dudas reales que nos llegan por WhatsApp. Sin letra pequeña.</p>
        </div>
        <div>
          {FAQS.map((f, i) => (
            <FaqItem
              key={f.q}
              q={f.q}
              a={f.a}
              open={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
