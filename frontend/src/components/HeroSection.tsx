import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

const HeroSection = () => (
  <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="inline-flex items-center gap-2 bg-on-background/5 px-3 py-1 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-primary-container"></span>
          <span className="text-xs font-bold uppercase tracking-widest text-on-background/60">Primera fase: visados para España</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-on-background leading-[1.1] mb-6">
          Tu visado para España,{' '}
          <span className="text-primary-container relative">
            más claro y guiado
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute -bottom-2 left-0 w-full h-2 text-primary-container/30"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
            >
              <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
            </motion.svg>
          </span>
          .
        </h1>
        <p className="text-lg md:text-xl text-on-background/60 mb-10 max-w-xl leading-relaxed font-medium">
          Asistencia digital para hispanoamericanos. Sin promesas falsas, solo un camino estructurado hacia tu nueva vida en España.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="#servicios" className="group bg-primary-container text-on-background px-8 py-4 rounded-full font-bold text-center flex items-center justify-center gap-2 hover:bg-primary-container/90 transition-colors shadow-lg">
            Reservar diagnóstico
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="#soluciones" className="bg-on-background text-surface-container-lowest px-8 py-4 rounded-full font-bold text-center hover:opacity-90 transition-opacity">
            Ver servicios
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative hidden md:block"
      >
        <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80"
            alt="Persona planificando mudanza a España con portátil y documentos"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-background/40 to-transparent"></div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-6 left-6 right-6 glass p-6 rounded-2xl flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-primary-container/20 rounded-xl flex items-center justify-center text-primary-container">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="text-sm font-bold text-on-background">Proceso Verificado</div>
              <div className="text-xs text-on-background/60">Actualizado según normativa 2026</div>
            </div>
          </motion.div>
        </div>

        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-container/10 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-on-background/5 blur-3xl rounded-full"></div>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
