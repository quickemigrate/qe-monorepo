import { ContainerScroll } from "./ui/container-scroll-animation"

const checklistItems = [
  "Pasaporte vigente",
  "Certificado de antecedentes penales",
  "Carta de admisión universitaria",
  "Seguro médico internacional",
  "Extractos bancarios (últimos 3 meses)",
]

const titleComponent = (
  <div className="text-center mb-4">
    <span className="inline-block text-xs font-semibold uppercase tracking-[0.15em] text-[#25D366] mb-4">
      El resultado
    </span>
    <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
      Tu diagnóstico,<br />
      <span className="text-[#25D366]">listo en minutos.</span>
    </h2>
    <p className="mt-4 text-white/45 text-lg max-w-xl mx-auto font-light leading-relaxed">
      Un informe PDF personalizado con tu ruta migratoria exacta,
      checklist de documentos y probabilidad de éxito real.
    </p>
  </div>
)

export default function DiagnosticPreviewSection() {
  return (
    <ContainerScroll titleComponent={titleComponent}>
      <div className="w-full h-full flex items-center justify-center bg-[#1A1C1C] rounded-xl overflow-hidden relative">
        <div className="w-full h-full p-6 flex flex-col gap-3 overflow-hidden font-sans">

          {/* Header PDF */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#25D366] flex items-center justify-center text-[#062810] font-bold text-xs">
                QE
              </div>
              <span className="text-white/60 text-xs font-medium">Quick Emigrate</span>
            </div>
            <span className="text-white/30 text-xs">Diagnóstico Migratorio · 2026</span>
          </div>

          {/* Título informe */}
          <div className="py-2">
            <div className="text-white font-bold text-sm mb-1">
              Diagnóstico Migratorio Personalizado
            </div>
            <div className="text-[#25D366] text-xs">
              Informe generado para: María González · Colombia
            </div>
          </div>

          {/* Probabilidad destacada */}
          <div className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-lg p-3 flex items-center gap-4">
            <div className="text-[#25D366] font-bold text-3xl">78%</div>
            <div>
              <div className="text-white text-xs font-semibold">Probabilidad de éxito</div>
              <div className="text-white/40 text-xs">Visado de estudiante recomendado</div>
            </div>
          </div>

          {/* Checklist */}
          <div className="flex flex-col gap-1.5">
            <div className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">
              Checklist de documentos
            </div>
            {checklistItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#25D366] text-[8px]">✓</span>
                </div>
                <span className="text-white/60 text-xs">{item}</span>
              </div>
            ))}
          </div>

          {/* Alerta */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex gap-2 items-start mt-auto">
            <span className="text-amber-400 text-xs">⚠</span>
            <span className="text-amber-400/80 text-xs leading-relaxed">
              Los extractos bancarios deben acreditar mínimo 7.200€ (100% IPREM anual).
            </span>
          </div>

        </div>
      </div>
    </ContainerScroll>
  )
}
