import React from 'react';
import { motion } from 'motion/react';
import { FileText, ClipboardCheck, CheckCircle2, Headphones, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Cuéntanos tu perfil',
    desc: 'Rellena el formulario inicial con tu situación: país, objetivo y documentación disponible.',
    icon: <FileText size={28} />,
  },
  {
    step: '02',
    title: 'Diagnóstico personalizado',
    desc: 'En 48–72 h analizamos tu caso y te entregamos la vía migratoria más adecuada con probabilidades reales.',
    icon: <ClipboardCheck size={28} />,
  },
  {
    step: '03',
    title: 'Tu ruta documentada',
    desc: 'Recibes un checklist dinámico paso a paso: qué pedir, cómo pedirlo y en qué orden presentarlo.',
    icon: <CheckCircle2 size={28} />,
  },
  {
    step: '04',
    title: 'Acompañamiento hasta el visado',
    desc: 'Resolvemos dudas, revisamos documentos y te preparamos para la cita consular hasta el "aprobado".',
    icon: <Headphones size={28} />,
  },
];

const HowItWorksSection = () => (
  <section className="py-16 md:py-24 px-5 md:px-6 bg-surface-container-low">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12 md:mb-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-on-background mb-4 md:mb-6"
        >
          ¿Cómo funciona?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base md:text-lg text-on-background/60 max-w-2xl mx-auto font-medium"
        >
          De la duda al visado en cuatro pasos claros. Sin sorpresas.
        </motion.p>
      </div>

      <div className="relative">
        {/* Connecting line (desktop only) */}
        <div className="hidden md:block absolute top-10 left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-0.5 bg-primary-container/20" />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-8">
          {STEPS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-5 md:mb-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-container rounded-2xl flex items-center justify-center text-on-background shadow-md">
                  {item.icon}
                </div>
                <div className="absolute -top-2.5 -right-2.5 md:-top-3 md:-right-3 w-7 h-7 bg-on-background text-surface-container-lowest rounded-full text-xs font-black flex items-center justify-center">
                  {item.step}
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-on-background mb-2 md:mb-3">{item.title}</h3>
              <p className="text-on-background/60 font-medium leading-relaxed text-sm max-w-xs">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="text-center mt-12 md:mt-16"
      >
        <a
          href="#servicios"
          className="inline-flex items-center gap-2 bg-primary-container text-on-background px-8 md:px-10 py-3.5 md:py-4 rounded-full font-bold hover:scale-105 transition-transform active:scale-95 shadow-sm text-[15px] md:text-base"
        >
          Empezar con el diagnóstico
          <ArrowRight size={18} />
        </a>
      </motion.div>
    </div>
  </section>
);

export default HowItWorksSection;
