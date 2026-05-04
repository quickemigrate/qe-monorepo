import React, { useState } from 'react';
import { CheckCircle2, Headphones, ArrowRight } from 'lucide-react';


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const ContactSection = () => {
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('sending');

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const nombre = formData.get('nombre') as string;
      const email = formData.get('email') as string;
      const pais = formData.get('pais') as string;
      const interes = formData.get('interes') as string;
      const mensaje = formData.get('mensaje') as string;

      const res = await fetch(`${BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, pais, interes, mensaje }),
      });

      if (res.ok) {
        setFormStatus('success');
        form.reset();
        setTimeout(() => setFormStatus('idle'), 4000);
      } else {
        setFormStatus('idle');
        alert('Hubo un error al enviar. Inténtalo de nuevo.');
      }
    } catch {
      setFormStatus('idle');
      alert('Sin conexión. Revisa tu internet e inténtalo de nuevo.');
    }
  };

  return (
    <section id="contacto" className="py-16 md:py-24 px-5 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl md:rounded-[2rem] overflow-hidden tonal-lift flex flex-col md:flex-row">
          <div className="bg-on-background p-6 md:p-12 text-surface-container-lowest md:w-2/5">
            <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8">¿Hablamos?</h2>
            <p className="text-surface-container-lowest/60 mb-8 md:mb-12 text-base md:text-lg">
              Si tienes dudas antes de empezar, déjanos un mensaje. Te responderemos en menos de 24 horas laborables.
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-lowest/10 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <span className="font-medium text-surface-container-lowest/80">Respuesta rápida garantizada</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-lowest/10 flex items-center justify-center">
                  <Headphones size={20} />
                </div>
                <span className="font-medium text-surface-container-lowest/80">Atención personalizada</span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-12 md:flex-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-on-background/40">Nombre</label>
                  <input
                    required
                    name="nombre"
                    type="text"
                    placeholder="Juana Pérez"
                    className="w-full border-b-2 border-on-background/10 py-3 focus:outline-none focus:border-primary-container transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-on-background/40">Email</label>
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder="juana@ejemplo.com"
                    className="w-full border-b-2 border-on-background/10 py-3 focus:outline-none focus:border-primary-container transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-on-background/40">País de origen</label>
                <input
                  name="pais"
                  type="text"
                  placeholder="Argentina, México, Colombia..."
                  className="w-full border-b-2 border-on-background/10 py-3 focus:outline-none focus:border-primary-container transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-on-background/40">Interés Principal</label>
                <select name="interes" className="w-full border-b-2 border-on-background/10 py-3 focus:outline-none focus:border-primary-container transition-colors bg-transparent">
                  <option>Diagnóstico Inicial</option>
                  <option>Visado de Estudios</option>
                  <option>Visado No Lucrativo</option>
                  <option>Trámites TIE / NIE</option>
                  <option>Otro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-on-background/40">Mensaje</label>
                <textarea
                  name="mensaje"
                  rows={4}
                  placeholder="Cuéntanos brevemente tu situación..."
                  className="w-full border-b-2 border-on-background/10 py-3 focus:outline-none focus:border-primary-container transition-colors resize-none"
                ></textarea>
              </div>

              <button
                disabled={formStatus === 'sending'}
                className={`group w-full py-5 rounded-full font-black text-lg transition-all flex items-center justify-center gap-3 ${
                  formStatus === 'success'
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-container text-on-background hover:scale-[1.02]'
                }`}
              >
                {formStatus === 'idle' && <>Enviar Mensaje <ArrowRight size={20} /></>}
                {formStatus === 'sending' && 'Enviando...'}
                {formStatus === 'success' && '¡Mensaje Enviado!'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
