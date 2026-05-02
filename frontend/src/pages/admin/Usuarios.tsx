import { useEffect, useRef, useState } from 'react';
import { X, Plus, RefreshCw, AlertCircle, CheckCircle2, Eye, Trash2 } from 'lucide-react';
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
  plan: 'free' | 'starter' | 'pro' | 'premium';
  mensajesUsados: number;
  creadoEn: string;
  perfilCompleto?: boolean;
  perfil?: PerfilUsuario;
}

interface FormCrear {
  email: string;
  nombre: string;
  plan: 'free' | 'starter' | 'pro' | 'premium';
  password: string;
}

const FORM_INICIAL: FormCrear = { email: '', nombre: '', plan: 'free', password: '' };

const PLAN_BADGE: Record<string, string> = {
  free:    'bg-white/5 text-white/30',
  starter: 'bg-white/8 text-white/50',
  pro:     'bg-blue-500/15 text-blue-400',
  premium: 'bg-amber-500/15 text-amber-400',
};

const PLANES = ['free', 'starter', 'pro', 'premium'] as const;

const inputCls = `w-full rounded-xl border border-white/15 px-4 py-3 text-[14.5px] text-white
                  bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 transition placeholder-white/25`;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1.5';

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="bg-white/5 rounded-xl px-4 py-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/40 mb-0.5">{label}</p>
      <p className="text-[13.5px] text-white font-medium">{value}</p>
    </div>
  );
}

export default function Usuarios() {
  const { getToken } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [planLocal, setPlanLocal] = useState<Record<string, string>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormCrear>(FORM_INICIAL);
  const [creando, setCreando] = useState(false);
  const [crearError, setCrearError] = useState('');

  const [sincronizando, setSincronizando] = useState(false);
  const [detalle, setDetalle] = useState<Usuario | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<Usuario | null>(null);
  const [eliminando, setEliminando] = useState(false);

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

  const handleEliminar = async () => {
    if (!confirmEliminar) return;
    setEliminando(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/usuarios/${encodeURIComponent(confirmEliminar.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmEliminar(null);
        showToast('Usuario eliminado correctamente.', 'success');
        fetchUsuarios();
      } else {
        showToast(data.error || 'Error al eliminar.', 'error');
      }
    } catch {
      showToast('Error de conexión.', 'error');
    } finally {
      setEliminando(false);
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
              ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/15 border border-red-500/20 text-red-400'
            }`}>
            {toast.tipo === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-white">Usuarios</h1>
          <div className="flex gap-2">
            <button
              onClick={handleSincronizar}
              disabled={sincronizando}
              className="flex items-center gap-2 border border-white/15 text-white/60 px-4 py-2.5 rounded-xl
                         text-[13.5px] font-semibold hover:bg-white/5 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw size={15} className={sincronizando ? 'animate-spin' : ''} />
              {sincronizando ? 'Sincronizando...' : 'Sincronizar desde Auth'}
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-[#25D366] text-[#062810] px-4 py-2.5 rounded-xl
                         text-[13.5px] font-semibold hover:bg-[#2adc6c] active:scale-[0.98] transition"
            >
              <Plus size={15} />
              Crear Usuario
            </button>
          </div>
        </div>

        <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="px-6 py-10 text-center text-white/40 text-[14px]">Cargando usuarios...</div>
          ) : usuarios.length === 0 ? (
            <div className="px-6 py-10 text-center text-white/40 text-[14px]">No hay usuarios registrados aún.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[600px] text-[13.5px]">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Email', 'Nombre', 'Plan', 'Perfil', 'Registro', 'Acciones'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`border-b border-white/8 ${i % 2 !== 0 ? 'bg-white/[0.02]' : ''}`}
                    >
                      <td className="px-5 py-3.5 font-medium text-white">{u.email}</td>
                      <td className="px-5 py-3.5 text-white/60">{u.nombre || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${PLAN_BADGE[u.plan] || 'bg-white/8 text-white/40'}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.perfilCompleto
                          ? <span className="inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-500/15 text-emerald-400">Completo</span>
                          : <span className="inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-white/8 text-white/30">Pendiente</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 text-white/40">
                        {u.creadoEn ? new Date(u.creadoEn).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDetalle(u)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition"
                            title="Ver perfil completo"
                          >
                            <Eye size={15} />
                          </button>
                          <select
                            value={planLocal[u.id] || u.plan}
                            onChange={e => setPlanLocal(prev => ({ ...prev, [u.id]: e.target.value }))}
                            className="rounded-xl border border-white/15 px-3 py-1.5 text-[13px] text-white
                                       bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
                          >
                            {PLANES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <button
                            onClick={() => handleCambiarPlan(u.id)}
                            disabled={updatingId === u.id || planLocal[u.id] === u.plan}
                            className="px-3 py-1.5 rounded-xl bg-[#25D366] text-[#062810] text-[12px] font-semibold
                                       hover:bg-[#2adc6c] transition disabled:opacity-40"
                          >
                            {updatingId === u.id ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => setConfirmEliminar(u)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={15} />
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetalle(null)} />
          <div className="relative bg-[#111111] border border-white/10 rounded-[24px] shadow-2xl w-full max-w-[580px] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-7 py-5 border-b border-white/10">
              <div>
                <h2 className="text-[18px] font-semibold text-white">{detalle.nombre || detalle.email}</h2>
                <p className="text-[13px] text-white/40 mt-0.5">{detalle.email}</p>
              </div>
              <button onClick={() => setDetalle(null)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-7 py-6 space-y-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-3">Cuenta</p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Plan" value={detalle.plan} />
                  <InfoRow label="Mensajes usados" value={String(detalle.mensajesUsados || 0)} />
                  <InfoRow label="Registro" value={detalle.creadoEn ? new Date(detalle.creadoEn).toLocaleDateString('es-ES') : '—'} />
                  <InfoRow label="Perfil" value={detalle.perfilCompleto ? 'Completo' : 'Pendiente'} />
                </div>
              </div>

              {detalle.perfil && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-3">Perfil migratorio</p>
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

              {detalle.perfil?.respuestas && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-3">Respuestas del diagnóstico</p>
                  <div className="space-y-1.5">
                    {Object.entries(detalle.perfil.respuestas)
                      .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false)
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-3 text-[13px]">
                          <span className="text-white/40 font-medium min-w-[180px] shrink-0">{k.replace(/_/g, ' ')}</span>
                          <span className="text-white break-words">
                            {Array.isArray(v) ? v.join(', ') : String(v)}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {!detalle.perfil && (
                <p className="text-[13.5px] text-white/40 text-center py-4">Este usuario aún no completó el onboarding.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal crear usuario */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#111111] border border-white/10 rounded-[24px] shadow-2xl w-full max-w-[440px]">
            <div className="flex items-center justify-between px-7 py-5 border-b border-white/10">
              <h2 className="text-[18px] font-semibold text-white">Crear Usuario</h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-4">
              {crearError && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13.5px] text-red-400 font-medium">
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
                  className="flex-1 rounded-xl border border-white/15 font-semibold py-3 text-[14.5px]
                             text-white/60 hover:bg-white/5 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrear}
                  disabled={creando}
                  className="flex-1 rounded-xl bg-[#25D366] text-[#062810] font-semibold py-3 text-[14.5px]
                             hover:bg-[#2adc6c] transition disabled:opacity-50"
                >
                  {creando ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !eliminando && setConfirmEliminar(null)} />
          <div className="relative bg-[#111111] border border-white/10 rounded-[24px] shadow-2xl w-full max-w-[400px] px-7 py-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-white">Eliminar usuario</h2>
                <p className="text-[13.5px] text-white/50 mt-1">
                  Se borrará <span className="font-medium text-white">{confirmEliminar.email}</span> de Firestore y Firebase Auth. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEliminar(null)}
                disabled={eliminando}
                className="flex-1 rounded-xl border border-white/15 font-semibold py-3 text-[14px]
                           text-white/60 hover:bg-white/5 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={eliminando}
                className="flex-1 rounded-xl bg-red-600 text-white font-semibold py-3 text-[14px]
                           hover:bg-red-500 transition disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
