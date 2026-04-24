import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Clock, Mail, ArrowLeft, Loader2, Edit2 } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

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

interface PerfilExtras {
  experiencia: string;
  familiaresEnEspana: string;
  otrosIdiomas: string;
  cualesIdiomas: string;
}

const EMPTY: FormData = {
  nombre: '', email: '', pais: '', edad: '',
  estudios: '', objetivo: '', situacion: '',
  plazo: '', medios: '', sector: '',
};

const inputCls = `w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] text-on-background bg-white
                  focus:outline-none focus:ring-2 focus:ring-primary-container/60 focus:border-transparent transition`;
const labelCls = 'block text-[13px] font-semibold text-on-background/70 mb-1.5';

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-white/6 last:border-0">
      <span className="text-[12px] text-white/40 font-semibold uppercase tracking-wide min-w-[130px] shrink-0 pt-px">{label}</span>
      <span className="text-[13.5px] text-white/80">{value || '—'}</span>
    </div>
  );
}

export default function DiagnosticoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cancelado = searchParams.get('cancelado') === 'true';

  const [authChecking, setAuthChecking] = useState(true);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [extras, setExtras] = useState<PerfilExtras>({ experiencia: '', familiaresEnEspana: '', otrosIdiomas: '', cualesIdiomas: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [stepVisible, setStepVisible] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      if (!user) {
        navigate('/cliente/login', {
          state: { mensaje: 'Necesitas una cuenta para hacer tu diagnóstico' },
        });
        return;
      }

      // Load profile to pre-fill
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API}/api/usuarios/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const perfil = data.data;
          setForm(f => ({
            ...f,
            nombre: perfil?.nombre || user.displayName || '',
            email: user.email || '',
            pais: perfil?.perfil?.pais || '',
            edad: perfil?.perfil?.edad || '',
            estudios: perfil?.perfil?.estudios || '',
            objetivo: perfil?.perfil?.objetivo || '',
            plazo: perfil?.perfil?.plazo || '',
            sector: perfil?.perfil?.sector || '',
            medios: perfil?.perfil?.medios || '',
            situacion: perfil?.perfil?.situacion || '',
          }));
          setExtras({
            experiencia: perfil?.perfil?.experiencia || '',
            familiaresEnEspana: perfil?.perfil?.familiaresEnEspana || '',
            otrosIdiomas: perfil?.perfil?.otrosIdiomas || '',
            cualesIdiomas: perfil?.perfil?.cualesIdiomas || '',
          });
        }
      } catch {
        // Keep empty form — user can fill in manually
      }

      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }));

  const transitionTo = (next: 'form' | 'confirm') => {
    setStepVisible(false);
    setTimeout(() => {
      setStep(next);
      setStepVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
  };

  const handleRevise = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    transitionTo('confirm');
  };

  const handlePagar = async () => {
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
      transitionTo('form');
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de pago cancelado ───────────────────────────────
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

  // ── Auth check ───────────────────────────────────────────────
  if (authChecking) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-on-background/30" />
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

      {/* Contenido del paso */}
      <section className="mx-auto max-w-[620px] px-6 py-14">
        <div className={`transition-all duration-200 ${stepVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>

          {/* ── PASO 1: Formulario ── */}
          {step === 'form' && (
            <motion.form
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handleRevise}
              className="bg-white rounded-[24px] border border-black/5 p-8 shadow-sm space-y-6"
            >
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13.5px] text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-[13px] text-emerald-700 font-medium">
                Diagnóstico vinculado a tu cuenta: <strong>{form.email}</strong>
              </div>

              <div>
                <label className={labelCls}>1. País de origen *</label>
                <select required value={form.pais} onChange={set('pais')} className={inputCls}>
                  <option value="">Selecciona tu país</option>
                  {['Ecuador', 'Colombia', 'Argentina', 'Venezuela', 'Perú', 'Nicaragua', 'México', 'Bolivia', 'República Dominicana', 'Otro'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>2. Edad</label>
                <select value={form.edad} onChange={set('edad')} className={inputCls}>
                  <option value="">Selecciona tu rango de edad</option>
                  {['18-24', '25-34', '35-44', '45+'].map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>3. Nivel de estudios</label>
                <select value={form.estudios} onChange={set('estudios')} className={inputCls}>
                  <option value="">Selecciona tu nivel</option>
                  {['Sin estudios', 'Secundaria', 'Formación técnica/profesional', 'Grado universitario', 'Máster o superior'].map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>4. ¿Cuál es tu objetivo principal en España? *</label>
                <select required value={form.objetivo} onChange={set('objetivo')} className={inputCls}>
                  <option value="">Selecciona tu objetivo</option>
                  {['Trabajar', 'Estudiar', 'Residir sin trabajar', 'Reagrupación familiar'].map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>5. ¿Cuál es tu situación actual?</label>
                <select value={form.situacion} onChange={set('situacion')} className={inputCls}>
                  <option value="">Selecciona tu situación</option>
                  {['Estudiando', 'Trabajando', 'Buscando empleo', 'Emprendedor', 'Otro'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>6. ¿En qué plazo quieres emigrar?</label>
                <select value={form.plazo} onChange={set('plazo')} className={inputCls}>
                  <option value="">Selecciona un plazo</option>
                  {['Menos de 6 meses', 'Entre 6 meses y 1 año', 'Entre 1 y 3 años', 'Más de 3 años'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>7. ¿De cuántos medios económicos dispones?</label>
                <select value={form.medios} onChange={set('medios')} className={inputCls}>
                  <option value="">Selecciona un rango</option>
                  {['Menos de 3.000€', 'Entre 3.000€ y 10.000€', 'Entre 10.000€ y 30.000€', 'Más de 30.000€', 'Prefiero no decirlo'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>8. ¿En qué sector quieres trabajar o desarrollarte?</label>
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
                className="w-full rounded-full font-bold py-4 text-[16px] flex items-center justify-center gap-2.5
                           hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm"
                style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
              >
                Revisar mi diagnóstico
                <ArrowRight size={18} />
              </button>
            </motion.form>
          )}

          {/* ── PASO 2: Confirmación ── */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-on-background mb-1">
                  Comprueba que tus datos son correctos
                </h2>
                <p className="text-[14px] text-on-background/50">
                  Usaremos esta información para generar tu informe personalizado
                </p>
              </div>

              {/* Card: Perfil */}
              <div className="bg-on-background rounded-2xl p-5 space-y-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-3">
                  👤 Perfil
                </div>
                <InfoRow label="Nombre" value={form.nombre} />
                <InfoRow label="País" value={form.pais} />
                <InfoRow label="Edad" value={form.edad} />
                <InfoRow label="Sector" value={form.sector} />
              </div>

              {/* Card: Formación */}
              <div className="bg-on-background rounded-2xl p-5 space-y-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-3">
                  📚 Formación y situación
                </div>
                <InfoRow label="Estudios" value={form.estudios} />
                <InfoRow label="Experiencia" value={extras.experiencia} />
                <InfoRow label="Situación" value={form.situacion} />
                <InfoRow label="Medios económicos" value={form.medios} />
              </div>

              {/* Card: Objetivo */}
              <div className="bg-on-background rounded-2xl p-5 space-y-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-3">
                  🎯 Objetivo migratorio
                </div>
                <InfoRow label="Objetivo" value={form.objetivo} />
                <InfoRow label="Plazo" value={form.plazo} />
                <InfoRow label="Familiares en España" value={extras.familiaresEnEspana} />
                <InfoRow
                  label="Otros idiomas"
                  value={extras.otrosIdiomas === 'Sí' && extras.cualesIdiomas
                    ? `Sí — ${extras.cualesIdiomas}`
                    : extras.otrosIdiomas || undefined}
                />
              </div>

              {/* Card: Precio */}
              <div className="bg-on-background rounded-2xl p-6 text-center">
                <div className="text-[15px] font-semibold text-white mb-1">Diagnóstico Migratorio IA</div>
                <div className="text-[13px] text-white/40 mb-4">Análisis personalizado + informe PDF</div>
                <div className="text-[52px] font-bold leading-none" style={{ color: '#25D366' }}>59€</div>
                <div className="text-[13px] text-white/40 mt-1">pago único</div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13.5px] text-red-600 font-medium">
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => transitionTo('form')}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full border border-black/10
                             text-[15px] font-semibold text-on-background/70 hover:bg-black/3 transition disabled:opacity-50"
                >
                  <Edit2 size={15} />
                  Editar datos
                </button>
                <button
                  onClick={handlePagar}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-[15px]
                             hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60 disabled:scale-100 shadow-sm"
                  style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
                >
                  {loading ? (
                    <><Loader2 size={17} className="animate-spin" /> Procesando...</>
                  ) : (
                    <>Confirmar y pagar <ArrowRight size={17} /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Garantías (solo en formulario) */}
        {step === 'form' && (
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
        )}
      </section>
    </div>
  );
}
