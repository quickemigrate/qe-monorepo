import { useEffect, useState } from 'react';
import { X, Info } from 'lucide-react';
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

const ESTADOS_EXP = ['nuevo', 'en proceso', 'documentación pendiente', 'presentado', 'aprobado', 'denegado'];

const ESTADO_BADGE: Record<string, string> = {
  'nuevo':                    'bg-emerald-500/15 text-emerald-400',
  'en proceso':               'bg-blue-500/15 text-blue-400',
  'documentación pendiente':  'bg-amber-500/15 text-amber-400',
  'presentado':               'bg-purple-500/15 text-purple-400',
  'aprobado':                 'bg-emerald-500/15 text-emerald-400',
  'denegado':                 'bg-red-500/15 text-red-400',
};

const inputCls = `w-full rounded-xl border border-white/15 px-4 py-3 text-[14.5px] text-white
                  bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 transition placeholder-white/25`;

export default function AdminExpedientes() {
  const { getToken } = useAuth();
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-white mb-6">Expedientes</h1>

        <div className="flex items-start gap-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 mb-6">
          <Info size={15} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[13px] text-blue-400">
            Los expedientes se crean desde la sección <strong className="text-blue-300">Leads</strong> al convertir un contacto.
          </p>
        </div>

        <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="px-6 py-10 text-center text-white/40 text-[14px]">Cargando expedientes...</div>
          ) : expedientes.length === 0 ? (
            <div className="px-6 py-10 text-center text-white/40 text-[14px]">Sin expedientes aún.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[600px] text-[13.5px]">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Nombre', 'Email', 'País', 'Tipo visado', 'Estado', 'Fecha'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
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
                      className={`border-b border-white/8 cursor-pointer hover:bg-white/5 transition-colors
                        ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                    >
                      <td className="px-5 py-3.5 font-medium text-white">{exp.nombre}</td>
                      <td className="px-5 py-3.5 text-white/60">{exp.email}</td>
                      <td className="px-5 py-3.5 text-white/60">{exp.pais || '—'}</td>
                      <td className="px-5 py-3.5 text-white/60">{exp.tipoVisado || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${ESTADO_BADGE[exp.estado] || 'bg-white/8 text-white/30'}`}>
                          {exp.estado}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white/40">
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

      {/* Side panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-[420px] bg-[#111111] border-l border-white/10 h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h2 className="text-[17px] font-semibold text-white">Editar expediente</h2>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white transition-colors">
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
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1">{label}</div>
                  <div className="text-[14.5px] text-white font-medium">{value}</div>
                </div>
              ))}

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-2 block">Estado</label>
                <select
                  value={editEstado}
                  onChange={e => setEditEstado(e.target.value)}
                  className={inputCls}
                >
                  {ESTADOS_EXP.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-2 block">Notas internas</label>
                <textarea
                  value={editNotas}
                  onChange={e => setEditNotas(e.target.value)}
                  rows={5}
                  className={`${inputCls} resize-none`}
                  placeholder="Notas sobre este expediente..."
                />
              </div>
            </div>

            <div className="px-6 py-5 border-t border-white/10">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-[#25D366] text-[#062810] font-semibold py-3.5 text-[15px]
                           hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
