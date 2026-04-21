import { useEffect, useState, FormEvent } from 'react';
import { X, Plus } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Expediente {
  id: string;
  nombre: string;
  email: string;
  pais: string;
  tipoVisado: string;
  estado: string;
  notas?: string;
  createdAt: string;
}

const TIPOS_VISADO = [
  'Diagnóstico de viabilidad',
  'Visado de estudios',
  'Visado no lucrativo',
  'TIE / NIE',
  'Prórroga de estancia por estudios',
  'Otro',
];

const ESTADOS_EXP = ['nuevo', 'en proceso', 'documentación pendiente', 'presentado', 'aprobado', 'denegado'];

const ESTADO_BADGE: Record<string, string> = {
  'nuevo':                     'bg-green-100 text-green-700',
  'en proceso':                'bg-blue-100 text-blue-700',
  'documentación pendiente':   'bg-yellow-100 text-yellow-700',
  'presentado':                'bg-purple-100 text-purple-700',
  'aprobado':                  'bg-emerald-100 text-emerald-700',
  'denegado':                  'bg-red-100 text-red-600',
};

const EMPTY_FORM = { nombre: '', email: '', pais: '', tipoVisado: TIPOS_VISADO[0], estado: 'nuevo', notas: '' };

export default function AdminExpedientes() {
  const { getToken } = useAuth();
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Expediente | null>(null);
  const [editEstado, setEditEstado] = useState('');
  const [editNotas, setEditNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchExpedientes = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API}/api/expedientes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setExpedientes(data.expedientes || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchExpedientes(); }, []);

  const openPanel = (exp: Expediente) => {
    setSelected(exp);
    setEditEstado(exp.estado);
    setEditNotas(exp.notas || '');
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const token = await getToken();
    await fetch(`${API}/api/expedientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setCreating(false);
    setShowModal(false);
    setForm(EMPTY_FORM);
    fetchExpedientes();
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const token = await getToken();
    await fetch(`${API}/api/expedientes/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ estado: editEstado, notas: editNotas }),
    });
    setSaving(false);
    setSelected(null);
    fetchExpedientes();
  };

  const inputCls = `w-full rounded-xl border border-black/10 px-4 py-3 text-[14.5px] text-on-background
                    bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition`;
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-1.5';

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background">Expedientes</h1>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-on-background text-white font-semibold
                       px-5 py-2.5 text-[14px] hover:opacity-90 transition active:scale-[0.98]"
          >
            <Plus size={16} />
            Nuevo expediente
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          {loading ? (
            <div className="px-6 py-10 text-center text-on-background/40 text-[14px]">Cargando expedientes...</div>
          ) : expedientes.length === 0 ? (
            <div className="px-6 py-10 text-center text-on-background/40 text-[14px]">Sin expedientes aún.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-black/5">
                    {['Nombre','Email','País','Tipo visado','Estado','Fecha'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expedientes.map((exp, i) => (
                    <tr
                      key={exp.id}
                      onClick={() => openPanel(exp)}
                      className={`border-b border-black/4 cursor-pointer hover:bg-surface-container-low transition-colors
                        ${i % 2 === 0 ? '' : 'bg-surface-container-lowest/40'}`}
                    >
                      <td className="px-5 py-3.5 font-medium text-on-background">{exp.nombre}</td>
                      <td className="px-5 py-3.5 text-on-background/60">{exp.email}</td>
                      <td className="px-5 py-3.5 text-on-background/60">{exp.pais || '—'}</td>
                      <td className="px-5 py-3.5 text-on-background/60">{exp.tipoVisado || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${ESTADO_BADGE[exp.estado] || 'bg-gray-100 text-gray-500'}`}>
                          {exp.estado}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-on-background/40">
                        {new Date(exp.createdAt).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-7 py-5 border-b border-black/5">
              <h2 className="text-[18px] font-semibold text-on-background">Nuevo expediente</h2>
              <button onClick={() => setShowModal(false)} className="text-on-background/40 hover:text-on-background transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-7 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nombre *</label>
                  <input required value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} className={inputCls} placeholder="Nombre completo" />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={inputCls} placeholder="email@ejemplo.com" />
                </div>
              </div>
              <div>
                <label className={labelCls}>País de origen</label>
                <input value={form.pais} onChange={e => setForm(f => ({...f, pais: e.target.value}))} className={inputCls} placeholder="Argentina, Colombia..." />
              </div>
              <div>
                <label className={labelCls}>Tipo de visado</label>
                <select value={form.tipoVisado} onChange={e => setForm(f => ({...f, tipoVisado: e.target.value}))} className={inputCls}>
                  {TIPOS_VISADO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Estado inicial</label>
                <select value={form.estado} onChange={e => setForm(f => ({...f, estado: e.target.value}))} className={inputCls}>
                  {ESTADOS_EXP.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Notas</label>
                <textarea rows={3} value={form.notas} onChange={e => setForm(f => ({...f, notas: e.target.value}))} className={`${inputCls} resize-none`} placeholder="Observaciones iniciales..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-black/10 font-semibold py-3 text-[14.5px] text-on-background/60 hover:bg-surface-container-low transition">
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 rounded-xl bg-on-background text-white font-semibold py-3 text-[14.5px] hover:opacity-90 transition disabled:opacity-50">
                  {creating ? 'Creando...' : 'Crear expediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Side panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-[420px] bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
              <h2 className="text-[17px] font-semibold text-on-background">Editar expediente</h2>
              <button onClick={() => setSelected(null)} className="text-on-background/40 hover:text-on-background transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5">
              {[
                { label: 'Nombre', value: selected.nombre },
                { label: 'Email', value: selected.email },
                { label: 'País', value: selected.pais || '—' },
                { label: 'Tipo de visado', value: selected.tipoVisado || '—' },
                { label: 'Fecha', value: new Date(selected.createdAt).toLocaleString('es-ES') },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-1">{label}</div>
                  <div className="text-[14.5px] text-on-background font-medium">{value}</div>
                </div>
              ))}

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-2 block">Estado</label>
                <select value={editEstado} onChange={e => setEditEstado(e.target.value)}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-[14.5px] text-on-background
                             bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition">
                  {ESTADOS_EXP.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-2 block">Notas internas</label>
                <textarea value={editNotas} onChange={e => setEditNotas(e.target.value)} rows={5}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-[14.5px] text-on-background
                             bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition"
                  placeholder="Notas sobre este expediente..." />
              </div>
            </div>

            <div className="px-6 py-5 border-t border-black/5">
              <button onClick={handleSave} disabled={saving}
                className="w-full rounded-xl bg-on-background text-white font-semibold py-3.5 text-[15px]
                           hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
