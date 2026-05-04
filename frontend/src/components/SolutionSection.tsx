import React from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, CheckCircle2, Headphones } from 'lucide-react';

const SolutionSection = () => (
  <section className="py-16 md:py-24 px-5 md:px-6 overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12 md:mb-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-on-background mb-4 md:mb-6"
        >
          Nuestra solución: <span className="text-primary-container">Claridad y Orden</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base md:text-lg text-on-background/60 max-w-2xl mx-auto font-medium"
        >
          Quick Emigrate transforma la confusión en un plan de acción guiado. Te decimos exactamente qué necesitas, cuándo lo necesitas y cómo presentarlo.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {[
          {
            icon: <ClipboardCheck size={32} />,
            title: 'Diagnóstico Preciso',
            text: 'Evaluamos tu perfil real antes de prometer nada. Saber dónde estás es el primer paso de cualquier viaje.',
          },
          {
            icon: <CheckCircle2 size={32} />,
            title: 'Pasos Estructurados',
            text: 'Un checklist claro, digital y dinámico. Cero ambigüedades. Sabemos qué casilla marcar en cada momento.',
          },
          {
            icon: <Headphones size={32} />,
            title: 'Soporte Continuo',
            text: 'Acompañamiento experto durante todo el proceso, resolviendo dudas reales y evitando errores críticos.',
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface-container-low p-6 md:p-10 rounded-2xl md:rounded-3xl"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-container rounded-2xl flex items-center justify-center text-on-background mb-5 md:mb-8">
              {item.icon}
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-on-background mb-3 md:mb-4">{item.title}</h3>
            <p className="text-on-background/60 leading-relaxed font-medium text-[15px] md:text-base">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SolutionSection;
