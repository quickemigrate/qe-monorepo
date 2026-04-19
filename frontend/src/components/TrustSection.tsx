import React from 'react';
import { ShieldCheck, Clock, FileText } from 'lucide-react';

const TrustSection = () => (
  <section className="py-24 px-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      <div className="order-2 md:order-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-square rounded-3xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80"
              alt="Calle urbana luminosa en España"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-square rounded-3xl overflow-hidden shadow-lg transition-transform hover:scale-95 duration-500">
            <img
              src="https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80"
              alt="Escritorio con checklist y pasaporte"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-square rounded-3xl overflow-hidden shadow-lg col-span-2">
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80"
              alt="Planificación y confianza"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="order-1 md:order-2">
        <h2 className="text-3xl md:text-5xl font-bold text-on-background mb-8 leading-tight">Tu tranquilidad no tiene precio, pero sí un método.</h2>
        <div className="space-y-8">
          {[
            { icon: <ShieldCheck className="text-primary-container" />, title: 'Seguridad Legal', desc: 'No somos intermediarios dudosos. Trabajamos con transparencia total.' },
            { icon: <Clock className="text-primary-container" />, title: 'Ahorro de Tiempo', desc: 'Evitamos que pierdas meses por errores evitables en tu documentación.' },
            { icon: <FileText className="text-primary-container" />, title: 'Orden Predictivo', desc: 'Sabrás qué esperar en cada etapa, sin sustos de última hora.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-container/10 rounded-xl flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <h4 className="text-xl font-bold text-on-background mb-2">{item.title}</h4>
                <p className="text-on-background/60 font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default TrustSection;
