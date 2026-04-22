import { useState, FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Clock, Mail, ArrowLeft, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface FormData {
  nombre: string;
  email: string;
  pais: string;
  edad: string;
  estudios: string;
  objetivo: string;
  situacion: string;
  plazo: string;
  medios: string;
  sector: string;
}

const EMPTY: FormData = {
  nombre: '',
  email: '',
  pais: '',
  edad: '',
  estudios: '',
  objetivo: '',
  situacion: '',
  plazo: '',
  medios: '',
  sector: '',
};

const inputCls = `w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] text-on-background bg-white
                  focus:outline-none focus:ring-2 focus:ring-primary-container/60 focus:border-transparent transition`;
const labelCls = 'block text-[13px] font-semibold text-on-background/70 mb-1.5';

export default function DiagnosticoPage() {
  const [searchParams] = useSearchParams();
  const cancelado = searchParams.get('cancelado') === 'true';

  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/diagnostico/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar');
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Ha ocurrido un error. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (cancelado) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center px-6 pt-[72px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="text-5xl mb-6">💳</div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-on-background mb-3">
            Pago cancelado
          </h1>
          <p className="text-[15px] text-on-background/50 mb-8 leading-[1.6]">
            No se ha realizado ningún cargo. Puedes volver al formulario cuando quieras.
          </p>
          <Link
            to="/diagnostico"
            className="inline-flex items-center gap-2 bg-primary-container text-on-background font-bold
                       px-6 py-3.5 rounded-full text-[15px] hover:scale-105 transition-transform"
          >
            <ArrowLeft size={16} />
            Volver al diagnóstico
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest font-sans pt-[72px]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-on-background text-white rounded-b-[28px]">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(var(--brand) 1px, transparent 1px), linear-gradient(90deg, var(--brand) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="mx-auto max-w-[720px] px-6 pt-16 pb-14 md:pt-20 md:pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold mb-6"
            style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
          >
            59€ — pago único
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-[38px] md:text-[56px] font-bold tracking-[-0.03em] leading-[1.1] mb-5"
          >
            Tu diagnóstico migratorio{' '}
            <span className="italic font-normal text-white/70" style={{ fontFamily: "'Fraunces', serif" }}>
              personalizado
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-[17px] text-white/55 leading-[1.55] max-w-[480px] mx-auto"
          >
            10 preguntas. IA analiza tu perfil. Recibes tu ruta en PDF.
          </motion.p>
        </div>
      </section>

      {/* Form */}
      <section className="mx-auto max-w-[620px] px-6 py-14">
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-[24px] border border-black/5 p-8 shadow-sm space-y-6"
        >
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13.5px] text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* 1 */}
          <div>
            <label className={labelCls}>1. Nombre completo *</label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={set('nombre')}
              className={inputCls}
              placeholder="María García"
            />
          </div>

          {/* 2 */}
          <div>
            <label className={labelCls}>2. Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={set('email')}
              className={inputCls}
              placeholder="maria@email.com"
            />
            <p className="text-[11.5px] text-on-background/35 mt-1">Aquí recibirás tu informe PDF.</p>
          </div>

          {/* 3 */}
          <div>
            <label className={labelCls}>3. País de origen *</label>
            <select required value={form.pais} onChange={set('pais')} className={inputCls}>
              <option value="">Selecciona tu país</option>
              {['Ecuador', 'Colombia', 'Argentina', 'Venezuela', 'Perú', 'Nicaragua', 'México', 'Otro'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 4 */}
          <div>
            <label className={labelCls}>4. Edad</label>
            <select value={form.edad} onChange={set('edad')} className={inputCls}>
              <option value="">Selecciona tu rango de edad</option>
              {['18-24', '25-34', '35-44', '45+'].map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* 5 */}
          <div>
            <label className={labelCls}>5. Nivel de estudios</label>
            <select value={form.estudios} onChange={set('estudios')} className={inputCls}>
              <option value="">Selecciona tu nivel</option>
              {['Secundaria', 'Formación técnica/profesional', 'Grado universitario', 'Máster o superior'].map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* 6 */}
          <div>
            <label className={labelCls}>6. ¿Cuál es tu objetivo principal en España? *</label>
            <select required value={form.objetivo} onChange={set('objetivo')} className={inputCls}>
              <option value="">Selecciona tu objetivo</option>
              {['Trabajar', 'Estudiar', 'Residir sin trabajar', 'Reagrupación familiar'].map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* 7 */}
          <div>
            <label className={labelCls}>7. ¿Cuál es tu situación actual?</label>
            <select value={form.situacion} onChange={set('situacion')} className={inputCls}>
              <option value="">Selecciona tu situación</option>
              {['Estudio', 'Trabajo', 'Busco oportunidades', 'Emprendedor'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 8 */}
          <div>
            <label className={labelCls}>8. ¿En qué plazo quieres emigrar?</label>
            <select value={form.plazo} onChange={set('plazo')} className={inputCls}>
              <option value="">Selecciona un plazo</option>
              {['Menos de 6 meses', 'Entre 6 meses y 1 año', 'Entre 1 y 3 años', 'Más de 3 años'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 9 */}
          <div>
            <label className={labelCls}>9. ¿De cuántos medios económicos dispones aproximadamente?</label>
            <select value={form.medios} onChange={set('medios')} className={inputCls}>
              <option value="">Selecciona un rango</option>
              {['Menos de 3.000€', 'Entre 3.000€ y 10.000€', 'Más de 10.000€', 'Prefiero no decirlo'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* 10 */}
          <div>
            <label className={labelCls}>10. ¿En qué sector quieres trabajar o desarrollarte?</label>
            <input
              type="text"
              value={form.sector}
              onChange={set('sector')}
              className={inputCls}
              placeholder="Tecnología, Salud, Educación..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full font-bold py-4 text-[16px] flex items-center justify-center gap-2.5
                       hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60 disabled:scale-100 shadow-sm"
            style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Obtener mi diagnóstico por 59€
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </motion.form>

        {/* Garantías */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { icon: ShieldCheck, label: 'Pago seguro con Stripe' },
            { icon: Clock,       label: 'Informe en menos de 5 minutos' },
            { icon: Mail,        label: 'Enviado directamente a tu email' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 bg-white rounded-xl border border-black/5 px-4 py-3.5 shadow-sm">
              <Icon size={18} className="text-primary-container shrink-0" />
              <span className="text-[13px] font-medium text-on-background/70">{label}</span>
            </div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
