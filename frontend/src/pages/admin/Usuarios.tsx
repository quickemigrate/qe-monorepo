import { useEffect, useRef, useState } from 'react';
import { X, Plus, RefreshCw, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface PerfilUsuario {
  pais?: string;
  edad?: string;
  sector?: string;
  estudios?: string;
  experiencia?: string;
  situacion?: string;
  medios?: string;
  objetivo?: string;
  plazo?: string;
  familiaresEnEspana?: string;
  otrosIdiomas?: string;
  cualesIdiomas?: string;
  respuestas?: Record<string, any>;
}

interface Usuario {
  id: string;
  email: string;
  nombre?: string;
  plan: 'starter' | 'pro' | 'premium';
  mensajesUsados: number;
  creadoEn: string;
  perfilCompleto?: boolean;
  perfil?: PerfilUsuario;
}

interface FormCrear {
  email: string;
  nombre: string;
  plan: 'starter' | 'pro' | 'premium';
  password: string;
}

const FORM_INICIAL: FormCrear = { email: '', nombre: '', plan: 'starter', password: '' };

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-600',
  pro:     'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
};

const PLANES = ['starter', 'pro', 'premium'] as const;

const inputCls = `w-full rounded-xl border border-black/10 px-4 py-3 text-[14.5px] text-on-background
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition`;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-1.5';

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="bg-surface-container-lowest rounded-xl px-4 py-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-on-background/40 mb-0.5">{label}</p>
      <p className="text-[13.5px] text-on-background font-medium">{value}</p>
    </div>
  );
}

export default function Usuarios() {
  const { getToken } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [planLocal, setPlanLocal] = useState<Record<string, string>>({});

  // Modal crear
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormCrear>(FORM_INICIAL);
  const [creando, setCreando] = useState(false);
  const [crearError, setCrearError] = useState('');

  // Sincronizar
  const [sincronizando, setSincronizando] = useState(false);

  // Detalle usuario
  const [detalle, setDetalle] = useState<Usuario | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, tipo: 'success' | 'error') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, tipo });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const fetchUsuarios = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API}/api/usuarios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const lista: Usuario[] = data.data || [];
      setUsuarios(lista);
      const mapa: Record<string, string> = {};
      lista.forEach(u => { mapa[u.id] = u.plan; });
      setPlanLocal(mapa);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const handleCambiarPlan = async (id: string) => {
    setUpdatingId(id);
    const token = await getToken();
    await fetch(`${API}/api/usuarios/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan: planLocal[id] }),
    });
    setUpdatingId(null);
    fetchUsuarios();
  };

  const handleCrear = async () => {
    setCrearError('');
    if (!form.email || !form.nombre || !form.password) {
      setCrearError('Todos los campos son obligatorios.');
      return;
    }
    if (form.password.length < 6) {
      setCrearError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    setCreando(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setCrearError(data.error || 'Error al crear el usuario.');
      } else {
        setModalOpen(false);
        setForm(FORM_INICIAL);
        showToast('Usuario creado correctamente.', 'success');
        fetchUsuarios();
      }
    } catch {
      setCrearError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setCreando(false);
    }
  };

  const handleSincronizar = async () => {
    setSincronizando(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/usuarios/sincronizar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`${data.sincronizados} usuario${data.sincronizados !== 1 ? 's' : ''} sincronizado${data.sincronizados !== 1 ? 's' : ''}.`, 'success');
        fetchUsuarios();
      } else {
        showToast(data.error || 'Error al sincronizar.', 'error');
      }
    } catch {
      showToast('Error de conexión.', 'error');
    } finally {
      setSincronizando(false);
    }
  };

  const closeModal = () => {
    if (creando) return;
    setModalOpen(false);
    setForm(FORM_INICIAL);
    setCrearError('');
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-[13.5px] font-medium
            ${toast.tipo === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
            {toast.tipo === 'success'
              ? <CheckCircle2 size={16} />
              : <AlertCircle size={16} />
            }
            {toast.msg}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background">
            Usuarios
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleSincronizar}
              disabled={sincronizando}
              className="flex items-center gap-2 border border-black/10 text-on-background/70 px-4 py-2.5 rounded-xl
                         text-[13.5px] font-semibold hover:bg-surface-container-low transition disabled:opacity-50"
            >
              <RefreshCw size={15} className={sincronizando ? 'animate-spin' : ''} />
              {sincronizando ? 'Sincronizando...' : 'Sincronizar desde Auth'}
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-on-background text-white px-4 py-2.5 rounded-xl
                         text-[13.5px] font-semibold hover:opacity-90 active:scale-[0.98] transition"
            >
              <Plus size={15} />
              Crear Usuario
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          {loading ? (
            <div className="px-6 py-10 text-center text-on-background/40 text-[14px]">
              Cargando usuarios...
            </div>
          ) : usuarios.length === 0 ? (
            <div className="px-6 py-10 text-center text-on-background/40 text-[14px]">
              No hay usuarios registrados aún.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[600px] text-[13.5px]">
                <thead>
                  <tr className="border-b border-black/5">
                    {['Email', 'Nombre', 'Plan', 'Perfil', 'Registro', 'Acciones'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`border-b border-black/4 ${i % 2 !== 0 ? 'bg-surface-container-lowest/40' : ''}`}
                    >
                      <td className="px-5 py-3.5 font-medium text-on-background">{u.email}</td>
                      <td className="px-5 py-3.5 text-on-background/60">{u.nombre || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${PLAN_BADGE[u.plan] || 'bg-gray-100 text-gray-500'}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.perfilCompleto
                          ? <span className="inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-100 text-emerald-700">Completo</span>
                          : <span className="inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-gray-100 text-gray-500">Pendiente</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 text-on-background/40">
                        {u.creadoEn ? new Date(u.creadoEn).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDetalle(u)}
                            className="p-1.5 rounded-lg text-on-background/40 hover:text-on-background hover:bg-surface-container-low transition"
                            title="Ver perfil completo"
                          >
                            <Eye size={15} />
                          </button>
                          <select
                            value={planLocal[u.id] || u.plan}
                            onChange={e => setPlanLocal(prev => ({ ...prev, [u.id]: e.target.value }))}
                            className="rounded-xl border border-black/10 px-3 py-1.5 text-[13px] text-on-background
                                       bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/50"
                          >
                            {PLANES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <button
                            onClick={() => handleCambiarPlan(u.id)}
                            disabled={updatingId === u.id || planLocal[u.id] === u.plan}
                            className="px-3 py-1.5 rounded-xl bg-on-background text-white text-[12px] font-semibold
                                       hover:opacity-90 transition disabled:opacity-40"
                          >
                            {updatingId === u.id ? 'Guardando...' : 'Guardar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal detalle usuario */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetalle(null)} />
          <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[580px] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-7 py-5 border-b border-black/5">
              <div>
                <h2 className="text-[18px] font-semibold text-on-background">{detalle.nombre || detalle.email}</h2>
                <p className="text-[13px] text-on-background/40 mt-0.5">{detalle.email}</p>
              </div>
              <button onClick={() => setDetalle(null)} className="text-on-background/40 hover:text-on-background transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-7 py-6 space-y-6">
              {/* Info básica */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-3">Cuenta</p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Plan" value={detalle.plan} />
                  <InfoRow label="Mensajes usados" value={String(detalle.mensajesUsados || 0)} />
                  <InfoRow label="Registro" value={detalle.creadoEn ? new Date(detalle.creadoEn).toLocaleDateString('es-ES') : '—'} />
                  <InfoRow label="Perfil" value={detalle.perfilCompleto ? 'Completo' : 'Pendiente'} />
                </div>
              </div>

              {/* Perfil de onboarding */}
              {detalle.perfil && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-3">Perfil migratorio</p>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoRow label="País / Nacionalidad" value={detalle.perfil.pais} />
                    <InfoRow label="Edad" value={detalle.perfil.edad} />
                    <InfoRow label="Sector" value={detalle.perfil.sector} />
                    <InfoRow label="Estudios" value={detalle.perfil.estudios} />
                    <InfoRow label="Experiencia" value={detalle.perfil.experiencia} />
                    <InfoRow label="Situación laboral" value={detalle.perfil.situacion} />
                    <InfoRow label="Medios económicos" value={detalle.perfil.medios} />
                    <InfoRow label="Objetivo" value={detalle.perfil.objetivo} />
                    <InfoRow label="Plazo" value={detalle.perfil.plazo} />
                    <InfoRow label="Familiares en España" value={detalle.perfil.familiaresEnEspana} />
                    <InfoRow label="Otros idiomas" value={detalle.perfil.otrosIdiomas} />
                    {detalle.perfil.cualesIdiomas && <InfoRow label="¿Cuáles idiomas?" value={detalle.perfil.cualesIdiomas} />}
                  </div>
                </div>
              )}

              {/* Respuestas completas del wizard */}
              {detalle.perfil?.respuestas && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-3">Respuestas del diagnóstico</p>
                  <div className="space-y-1.5">
                    {Object.entries(detalle.perfil.respuestas)
                      .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false)
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-3 text-[13px]">
                          <span className="text-on-background/40 font-medium min-w-[180px] shrink-0">{k.replace(/_/g, ' ')}</span>
                          <span className="text-on-background break-words">
                            {Array.isArray(v) ? v.join(', ') : String(v)}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {!detalle.perfil && (
                <p className="text-[13.5px] text-on-background/40 text-center py-4">Este usuario aún no completó el onboarding.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal crear usuario */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[440px]">
            <div className="flex items-center justify-between px-7 py-5 border-b border-black/5">
              <h2 className="text-[18px] font-semibold text-on-background">Crear Usuario</h2>
              <button onClick={closeModal} className="text-on-background/40 hover:text-on-background transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-4">
              {crearError && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13.5px] text-red-600 font-medium">
                  <AlertCircle size={16} />
                  {crearError}
                </div>
              )}

              <div>
                <label className={labelCls}>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={inputCls}
                  placeholder="usuario@email.com"
                  autoFocus
                />
              </div>

              <div>
                <label className={labelCls}>Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className={inputCls}
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <label className={labelCls}>Plan *</label>
                <select
                  value={form.plan}
                  onChange={e => setForm(f => ({ ...f, plan: e.target.value as FormCrear['plan'] }))}
                  className={inputCls}
                >
                  {PLANES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Contraseña temporal *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={inputCls}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  disabled={creando}
                  className="flex-1 rounded-xl border border-black/10 font-semibold py-3 text-[14.5px]
                             text-on-background/60 hover:bg-surface-container-low transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrear}
                  disabled={creando}
                  className="flex-1 rounded-xl bg-on-background text-white font-semibold py-3 text-[14.5px]
                             hover:opacity-90 transition disabled:opacity-50"
                >
                  {creando ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
