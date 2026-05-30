import { ScrollText, Scale, ShieldCheck, Unlock } from 'lucide-react';

const ITEMS = [
  { icon: ScrollText,  title: 'Normativa al día',     sub: 'Ley de extranjería vigente, sin desfase' },
  { icon: Scale,       title: 'Basado en el BOE',     sub: 'Fuentes oficiales, no rumores' },
  { icon: ShieldCheck, title: 'Datos cifrados',       sub: 'Tu información, solo tuya' },
  { icon: Unlock,      title: 'Sin permanencia',      sub: 'Cancela cuando quieras' },
];

export default function TrustBand() {
  return (
    <section className="relative border-y border-white/[0.06] py-8 md:py-10" style={{ background: '#0C0B0A' }}>
      <div className="max-w-7xl mx-auto px-5 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6">
          {ITEMS.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: 'rgba(37,211,102,0.10)',
                  border: '1px solid rgba(37,211,102,0.25)',
                }}
              >
                <Icon size={18} strokeWidth={2} style={{ color: '#25D366' }} />
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] md:text-[14px] font-semibold text-white leading-tight">
                  {title}
                </div>
                <div className="text-[12px] md:text-[12.5px] text-white/45 leading-tight mt-0.5">
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
