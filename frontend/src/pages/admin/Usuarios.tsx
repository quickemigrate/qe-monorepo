import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Usuario {
  id: string;
  email: string;
  nombre?: string;
  plan: 'starter' | 'pro' | 'premium';
  mensajesUsados: number;
  creadoEn: string;
}

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-600',
  pro:     'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
};

const PLANES = ['starter', 'pro', 'premium'] as const;

export default function Usuarios() {
  const { getToken } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [planLocal, setPlanLocal] = useState<Record<string, string>>({});

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

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background mb-8">
          Usuarios
        </h1>

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
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-black/5">
                    {['Email', 'Nombre', 'Plan', 'Mensajes usados', 'Registro', 'Acciones'].map(h => (
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
                      <td className="px-5 py-3.5 text-on-background/60">{u.mensajesUsados || 0}</td>
                      <td className="px-5 py-3.5 text-on-background/40">
                        {u.creadoEn ? new Date(u.creadoEn).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
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
    </AdminLayout>
  );
}
