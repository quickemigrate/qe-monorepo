import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ArrowRight } from 'lucide-react';
import { SERVICES } from '../data';

const ServicesSection = () => (
  <section id="servicios" className="py-24 px-6 bg-on-background text-surface-container-lowest">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Nuestros Servicios</h2>
          <p className="text-surface-container-lowest/60 text-lg font-medium">
            Transparencia desde el primer día. Precios cerrados para que sepas exactamente cuánto cuesta tu tranquilidad.
          </p>
        </div>
        <div className="hidden md:block">
          <div className="bg-surface-container-lowest/10 border border-surface-container-lowest/20 px-6 py-4 rounded-2xl">
            <span className="text-sm font-bold uppercase tracking-widest opacity-60">Foco Actual</span>
            <div className="text-xl font-bold">Visados para España</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SERVICES.map((service) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -10 }}
            viewport={{ once: true }}
            className={`relative p-10 rounded-3xl flex flex-col ${service.isPopular ? 'bg-primary-container text-on-background' : 'bg-surface-container-lowest text-on-background'}`}
          >
            {service.isPopular && (
              <div className="absolute -top-4 left-10 bg-on-background text-surface-container-lowest px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                Punto de partida
              </div>
            )}
            <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
            <p className={`flex-grow leading-relaxed mb-10 ${service.isPopular ? 'text-on-background/80' : 'text-on-background/60'}`}>
              {service.description}
            </p>
            <div className="mt-auto">
              <div className="text-4xl font-extrabold mb-8">{service.price}</div>
              <a href="#contacto" className={`block w-full py-4 rounded-full font-bold transition-all text-center ${service.isPopular ? 'bg-on-background text-surface-container-lowest' : 'bg-primary-container text-on-background hover:bg-primary-container/80'}`}>
                {service.id === 'diagnóstico' ? 'Empezar ahora' : 'Contratar servicio'}
              </a>
            </div>
          </motion.div>
        ))}

        <div className="p-10 rounded-3xl border-2 border-surface-container-lowest/20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-surface-container-lowest/10 rounded-full flex items-center justify-center mb-6">
            <LayoutDashboard size={28} />
          </div>
          <h3 className="text-xl font-bold mb-4">¿Necesitas algo específico?</h3>
          <p className="text-surface-container-lowest/60 text-sm mb-8">Cuéntanos tu caso particular y buscaremos la mejor forma de guiarte.</p>
          <a href="#contacto" className="text-primary-container font-black flex items-center gap-2 group">
            Consultar ahora
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default ServicesSection;
