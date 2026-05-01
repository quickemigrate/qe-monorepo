import { ContainerScroll } from "./ui/container-scroll-animation"

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
      <img
        src="/diagnostic-preview.png"
        alt="Preview del diagnóstico migratorio de Quick Emigrate"
        className="w-full h-full object-contain"
        draggable={false}
      />
    </ContainerScroll>
  )
}
