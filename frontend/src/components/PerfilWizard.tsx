import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { Check, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface PerfilFormState {
  nombre: string; pais: string; edad: string; sector: string;
  estudios: string; experiencia: string; situacion: string; medios: string;
  objetivo: string; plazo: string; familiaresEnEspana: string;
  otrosIdiomas: string; cualesIdiomas: string;
}

const EMPTY: PerfilFormState = {
  nombre: '', pais: '', edad: '', sector: '',
  estudios: '', experiencia: '', situacion: '', medios: '',
  objetivo: '', plazo: '', familiaresEnEspana: '',
  otrosIdiomas: '', cualesIdiomas: '',
};

const inputCls = `w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] text-on-background bg-white
                  focus:outline-none focus:ring-2 focus:ring-primary-container/60 focus:border-transparent transition`;
const labelCls = 'block text-[13px] font-semibold text-on-background/70 mb-1.5';

const PAISES = ['Ecuador', 'Colombia', 'Argentina', 'Venezuela', 'Perú', 'Nicaragua', 'México', 'Bolivia', 'República Dominicana', 'Otro'];
const EDADES = ['18-24', '25-34', '35-44', '45+'];
const SECTORES = ['Tecnología', 'Salud', 'Educación', 'Hostelería y turismo', 'Construcción', 'Transporte y logística', 'Comercio', 'Administración', 'Arte y cultura', 'Deporte', 'Agricultura', 'Otro'];
const ESTUDIOS = ['Sin estudios', 'Secundaria', 'Formación técnica/profesional', 'Grado universitario', 'Máster o superior'];
const EXPERIENCIA = ['Sin experiencia', 'Menos de 1 año', 'Entre 1 y 3 años', 'Más de 3 años'];
const SITUACION = ['Estudiando', 'Trabajando', 'Buscando empleo', 'Emprendedor', 'Otro'];
const MEDIOS = ['Menos de 3.000€', 'Entre 3.000€ y 10.000€', 'Entre 10.000€ y 30.000€', 'Más de 30.000€', 'Prefiero no decirlo'];
const OBJETIVOS = ['Trabajar', 'Estudiar', 'Residir sin trabajar', 'Reagrupación familiar'];
const PLAZOS = ['Menos de 6 meses', 'Entre 6 meses y 1 año', 'Entre 1 y 3 años', 'Más de 3 años'];

const STEPS = [
  { title: 'Cuéntanos sobre ti', subtitle: 'Para personalizar tu experiencia, necesitamos conocerte mejor.' },
  { title: 'Tu situación actual', subtitle: 'Esto nos ayuda a encontrar las mejores opciones para ti.' },
  { title: 'Tu proyecto migratorio', subtitle: 'Cuéntanos más sobre tus planes y objetivos en España.' },
];

interface PerfilWizardProps {
  initialData?: Partial<PerfilFormState>;
  onComplete: (data: PerfilFormState) => void;
  showProgress?: boolean;
  submitLabel?: string;
}

export default function PerfilWizard({
  initialData,
  onComplete,
  showProgress = true,
  submitLabel = 'Completar perfil',
}: PerfilWizardProps) {
  const [step, setStep] = useState(1);
  const [visible, setVisible] = useState(true);
  const [form, setForm] = useState<PerfilFormState>({ ...EMPTY, ...initialData });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof PerfilFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }));

  const setRadio = (field: keyof PerfilFormState, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const transition = (nextStep: number) => {
    setVisible(false);
    setTimeout(() => {
      setStep(nextStep);
      setVisible(true);
    }, 200);
  };

  const goNext = () => {
    setError('');
    if (step === 1 && (!form.nombre.trim() || !form.pais)) {
      setError('El nombre y el país son obligatorios.');
      return;
    }
    if (step < 3) transition(step + 1);
  };

  const goPrev = () => {
    setError('');
    if (step > 1) transition(step - 1);
  };

  const handleSubmit = async () => {
    if (!form.objetivo) {
      setError('El objetivo principal es obligatorio.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error('No autenticado');
      const res = await fetch(`${API}/api/usuarios/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al guardar');
      onComplete(form);
    } catch {
      setError('Error al guardar tu perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] mx-auto">
      {/* Barra de progreso */}
      {showProgress && (
        <div className="flex items-center gap-0 mb-8 px-1">
          {[1, 2, 3].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-bold shrink-0 transition-all
                ${step >= s ? 'bg-[#25D366] text-white' : 'bg-black/8 text-on-background/30'}`}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 transition-all ${step > s ? 'bg-[#25D366]' : 'bg-black/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Card del paso */}
      <div className="bg-white rounded-[24px] border border-black/5 p-8 shadow-sm">
        <div className="mb-6">
          <div className="text-[12px] font-semibold text-on-background/40 uppercase tracking-[0.1em] mb-1">
            Paso {step} de 3
          </div>
          <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-on-background">
            {STEPS[step - 1].title}
          </h2>
          <p className="text-[14px] text-on-background/50 mt-1">{STEPS[step - 1].subtitle}</p>
        </div>

        <div className={`transition-all duration-200 space-y-5
          ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}>

          {step === 1 && (
            <>
              <div>
                <label className={labelCls}>Nombre completo *</label>
                <input type="text" required value={form.nombre} onChange={set('nombre')}
                  className={inputCls} placeholder="María García" />
              </div>
              <div>
                <label className={labelCls}>País de origen *</label>
                <select required value={form.pais} onChange={set('pais')} className={inputCls}>
                  <option value="">Selecciona tu país</option>
                  {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Rango de edad</label>
                <select value={form.edad} onChange={set('edad')} className={inputCls}>
                  <option value="">Selecciona tu rango</option>
                  {EDADES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Sector laboral</label>
                <select value={form.sector} onChange={set('sector')} className={inputCls}>
                  <option value="">Selecciona tu sector</option>
                  {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={labelCls}>Nivel de estudios</label>
                <select value={form.estudios} onChange={set('estudios')} className={inputCls}>
                  <option value="">Selecciona tu nivel</option>
                  {ESTUDIOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Experiencia laboral</label>
                <select value={form.experiencia} onChange={set('experiencia')} className={inputCls}>
                  <option value="">Selecciona tu experiencia</option>
                  {EXPERIENCIA.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Situación actual</label>
                <select value={form.situacion} onChange={set('situacion')} className={inputCls}>
                  <option value="">Selecciona tu situación</option>
                  {SITUACION.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Medios económicos disponibles</label>
                <select value={form.medios} onChange={set('medios')} className={inputCls}>
                  <option value="">Selecciona un rango</option>
                  {MEDIOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className={labelCls}>Objetivo principal en España *</label>
                <select required value={form.objetivo} onChange={set('objetivo')} className={inputCls}>
                  <option value="">Selecciona tu objetivo</option>
                  {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Plazo para emigrar</label>
                <select value={form.plazo} onChange={set('plazo')} className={inputCls}>
                  <option value="">Selecciona un plazo</option>
                  {PLAZOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>¿Tienes familiares en España?</label>
                <div className="flex gap-3">
                  {['Sí', 'No'].map(v => (
                    <button key={v} type="button" onClick={() => setRadio('familiaresEnEspana', v)}
                      className={`flex-1 py-3 rounded-xl border text-[14px] font-medium transition
                        ${form.familiaresEnEspana === v
                          ? 'bg-primary-container border-primary-container text-on-background'
                          : 'bg-white border-black/10 text-on-background/60 hover:border-black/20'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>¿Hablas algún idioma además del español?</label>
                <div className="flex gap-3">
                  {['Sí', 'No'].map(v => (
                    <button key={v} type="button" onClick={() => setRadio('otrosIdiomas', v)}
                      className={`flex-1 py-3 rounded-xl border text-[14px] font-medium transition
                        ${form.otrosIdiomas === v
                          ? 'bg-primary-container border-primary-container text-on-background'
                          : 'bg-white border-black/10 text-on-background/60 hover:border-black/20'}`}>
                      {v}
                    </button>
                  ))}
                </div>
                {form.otrosIdiomas === 'Sí' && (
                  <div className="mt-3">
                    <label className={labelCls}>¿Cuál/es?</label>
                    <input type="text" value={form.cualesIdiomas} onChange={set('cualesIdiomas')}
                      className={inputCls} placeholder="Inglés, Francés..." />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13.5px] text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={goPrev} disabled={loading}
              className="flex-1 py-3 rounded-xl border border-black/10 text-[14px] font-semibold text-on-background/60
                         hover:bg-black/3 transition disabled:opacity-50">
              Anterior
            </button>
          )}
          {step < 3 ? (
            <button onClick={goNext}
              className="flex-1 py-3 rounded-xl bg-primary-container text-on-background text-[14px] font-semibold
                         hover:scale-[1.02] active:scale-[0.98] transition shadow-sm">
              Siguiente
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-on-background text-white text-[14px] font-semibold
                         hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 shadow-sm
                         flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                : submitLabel
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
