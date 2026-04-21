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
  'nuevo':                    'bg-green-100 text-green-700',
  'en proceso':               'bg-blue-100 text-blue-700',
  'documentación pendiente':  'bg-yellow-100 text-yellow-700',
  'presentado':               'bg-purple-100 text-purple-700',
  'aprobado':                 'bg-emerald-100 text-emerald-700',
  'denegado':                 'bg-red-100 text-red-600',
};

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
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background mb-6">Expedientes</h1>

        <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 mb-6">
          <Info size={15} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[13px] text-blue-700">
            Los expedientes se crean desde la sección <strong>Leads</strong> al convertir un contacto.
          </p>
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
                    {['Nombre', 'Email', 'País', 'Tipo visado', 'Estado', 'Fecha'].map(h => (
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
                <select
                  value={editEstado}
                  onChange={e => setEditEstado(e.target.value)}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-[14.5px] text-on-background
                             bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition"
                >
                  {ESTADOS_EXP.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-2 block">Notas internas</label>
                <textarea
                  value={editNotas}
                  onChange={e => setEditNotas(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-[14.5px] text-on-background
                             bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition"
                  placeholder="Notas sobre este expediente..."
                />
              </div>
            </div>

            <div className="px-6 py-5 border-t border-black/5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-on-background text-white font-semibold py-3.5 text-[15px]
                           hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
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
