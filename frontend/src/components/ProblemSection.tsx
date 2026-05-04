import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

const ProblemSection = () => (
  <section id="soluciones" className="py-16 md:py-24 px-5 md:px-6 bg-surface-container-low">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 md:gap-16 items-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex-1"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-on-background mb-6 md:mb-8 leading-tight">El laberinto burocrático</h2>
        <p className="text-base md:text-lg text-on-background/60 mb-5 md:mb-6 leading-relaxed">
          Emigrar no debería ser un salto al vacío. Los procesos tradicionales están llenos de información contradictoria, formularios confusos y errores costosos que retrasan tu proyecto de vida.
        </p>
        <p className="text-base md:text-lg text-on-background/60 leading-relaxed font-medium">
          La burocracia española puede ser abrumadora. Un pequeño error en un documento puede significar meses de espera o una denegación.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex-1 w-full"
      >
        <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl tonal-lift">
          <div className="flex items-center gap-3 text-error mb-6 md:mb-8">
            <AlertTriangle size={28} className="md:w-8 md:h-8" />
            <h3 className="text-xl md:text-2xl font-bold text-on-background">Problemas comunes</h3>
          </div>
          <div className="space-y-5 md:space-y-6">
            {[
              'Información desactualizada en foros y blogs.',
              'Citas previas inalcanzables o mafias de venta de citas.',
              'Requisitos que cambian según el consulado de origen.',
              'Falta de seguimiento claro tras la presentación.',
            ].map((text, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="mt-1 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-error/10 text-error">
                  <X size={14} />
                </div>
                <span className="text-on-background/80 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default ProblemSection;
