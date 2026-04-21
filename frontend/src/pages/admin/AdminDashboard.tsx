import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Lead {
  id: string;
  nombre: string;
  email: string;
  pais: string;
  interes: string;
  estado: string;
  createdAt: string;
}

interface Expediente {
  id: string;
  estado: string;
}

const ESTADO_BADGE: Record<string, string> = {
  nuevo:       'bg-green-100 text-green-700',
  contactado:  'bg-yellow-100 text-yellow-700',
  convertido:  'bg-blue-100 text-blue-700',
  descartado:  'bg-gray-100 text-gray-500',
};

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-6 tonal-lift">
      <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-on-background/40 mb-2">{label}</div>
      <div className="text-[38px] font-semibold tracking-[-0.03em] text-on-background leading-none">{value}</div>
      {sub && <div className="mt-1.5 text-[13px] text-on-background/45">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [leadsRes, expRes] = await Promise.all([
        fetch(`${API}/api/leads`, { headers }),
        fetch(`${API}/api/expedientes`, { headers }),
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || []);
      }
      if (expRes.ok) {
        const data = await expRes.json();
        setExpedientes(data.expedientes || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [getToken]);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const leadsThisWeek = leads.filter(l => new Date(l.createdAt).getTime() > sevenDaysAgo).length;
  const conversion = leads.length > 0 ? Math.round((expedientes.length / leads.length) * 100) : 0;
  const recentLeads = [...leads].slice(0, 5);

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background mb-8">Dashboard</h1>

        {loading ? (
          <div className="text-on-background/40 font-medium">Cargando datos...</div>
        ) : (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <MetricCard label="Leads totales" value={leads.length} />
              <MetricCard
                label="Expedientes activos"
                value={expedientes.filter(e => !['aprobado','denegado'].includes(e.estado)).length}
                sub={`${expedientes.length} en total`}
              />
              <MetricCard label="Esta semana" value={leadsThisWeek} sub="nuevos leads" />
              <MetricCard label="Tasa de conversión" value={`${conversion}%`} sub="leads → expedientes" />
            </div>

            {/* Recent leads */}
            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5">
                <h2 className="text-[15px] font-semibold text-on-background">Últimos leads recibidos</h2>
              </div>
              {recentLeads.length === 0 ? (
                <div className="px-6 py-10 text-center text-on-background/40 text-[14px]">Sin leads aún.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13.5px]">
                    <thead>
                      <tr className="border-b border-black/5">
                        {['Nombre','Email','País','Interés','Estado','Fecha'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentLeads.map((lead, i) => (
                        <tr key={lead.id} className={`border-b border-black/4 ${i % 2 === 0 ? '' : 'bg-surface-container-lowest/50'}`}>
                          <td className="px-5 py-3.5 font-medium text-on-background">{lead.nombre}</td>
                          <td className="px-5 py-3.5 text-on-background/60">{lead.email}</td>
                          <td className="px-5 py-3.5 text-on-background/60">{lead.pais || '—'}</td>
                          <td className="px-5 py-3.5 text-on-background/60">{lead.interes || '—'}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${ESTADO_BADGE[lead.estado] || 'bg-gray-100 text-gray-500'}`}>
                              {lead.estado}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-on-background/40">
                            {new Date(lead.createdAt).toLocaleDateString('es-ES')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
