import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, DollarSign, Users, Inbox, RefreshCw, ArrowRight, TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface MetricsData {
  diagnosticos: { total: number; esteMes: number; ingresosTotales: number; ingresosMes: number };
  usuarios:    { total: number; porPlan: { starter: number; pro: number; premium: number } };
  leads:       { total: number; pendientes: number };
  topPaises:   { pais: string; count: number }[];
  ultimosDiagnosticos: any[];
  ultimosLeads:        any[];
}

type Semaforo = 'green' | 'yellow' | 'red';

function semaforo(value: number, [low, high]: [number, number]): Semaforo {
  if (value >= high) return 'green';
  if (value >= low)  return 'yellow';
  return 'red';
}

function semaforoInverso(value: number, [low, high]: [number, number]): Semaforo {
  if (value <= low)  return 'green';
  if (value <= high) return 'yellow';
  return 'red';
}

const SEMAFORO_CLASSES: Record<Semaforo, { border: string; iconBg: string; iconColor: string; dot: string }> = {
  green:  { border: 'border-t-emerald-500', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', dot: 'bg-emerald-500' },
  yellow: { border: 'border-t-amber-500',   iconBg: 'bg-amber-500/15',   iconColor: 'text-amber-400',   dot: 'bg-amber-500'   },
  red:    { border: 'border-t-red-500',      iconBg: 'bg-red-500/15',     iconColor: 'text-red-400',     dot: 'bg-red-500'     },
};

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'ayer';
  return `hace ${days}d`;
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-[#25D366]/15 flex items-center justify-center shrink-0">
      <span className="text-[13px] font-bold text-[#25D366]">{(name || '?')[0].toUpperCase()}</span>
    </div>
  );
}

type SeriesMetric = 'diagnosticos' | 'leads' | 'ingresos';
type SeriesPeriod = '7d' | '30d' | '90d';
interface SeriesPoint { date: string; value: number }

const METRIC_LABELS: Record<SeriesMetric, string> = {
  diagnosticos: 'Diagnósticos',
  leads: 'Leads',
  ingresos: 'Ingresos (€)',
};

function formatTickDate(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function SeriesChart({ token }: { token: () => Promise<string | null> }) {
  const [metric, setMetric] = useState<SeriesMetric>('diagnosticos');
  const [period, setPeriod] = useState<SeriesPeriod>('30d');
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const t = await token();
        if (!t) return;
        const res = await fetch(`${API}/api/metricas/series?metric=${metric}&period=${period}`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (!res.ok) throw new Error('Error al cargar serie');
        const json = await res.json();
        if (!cancelled) setSeries(json.data?.series || []);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [metric, period, token]);

  const total = series.reduce((s, p) => s + p.value, 0);

  return (
    <div className="qe-card rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-[#25D366]" />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/40">
            Tendencia · {METRIC_LABELS[metric]}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={metric}
            onChange={e => setMetric(e.target.value as SeriesMetric)}
            className="rounded-lg bg-[#0A0A0A] border border-white/15 px-3 py-1.5 text-[12.5px] text-white focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
          >
            <option value="diagnosticos">Diagnósticos</option>
            <option value="leads">Leads</option>
            <option value="ingresos">Ingresos</option>
          </select>
          <div className="inline-flex rounded-lg bg-[#0A0A0A] border border-white/15 p-0.5">
            {(['7d', '30d', '90d'] as SeriesPeriod[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors ${
                  period === p ? 'bg-[#25D366] text-[#062810]' : 'text-white/50 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[28px] font-semibold text-white mb-1">
        {metric === 'ingresos' ? `${total}€` : total}
      </div>
      <div className="text-[12px] text-white/40 mb-4">Total últimos {period}</div>

      {loading ? (
        <Skeleton className="h-[220px] rounded-xl" />
      ) : error ? (
        <div className="h-[220px] grid place-items-center text-[13px] text-red-400">{error}</div>
      ) : (
        <div className="h-[220px] -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="seriesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#25D366" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#25D366" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatTickDate}
                stroke="rgba(255,255,255,0.3)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: '#111111',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                itemStyle={{ color: '#25D366' }}
                labelFormatter={(l: string) => new Date(l + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                formatter={(v: number) => [metric === 'ingresos' ? `${v}€` : v, METRIC_LABELS[metric]]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#25D366"
                strokeWidth={2}
                fill="url(#seriesFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [data, setData]           = useState<MetricsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');

  const fetchMetrics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Sin token');
      const res = await fetch(`${API}/api/metricas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar métricas');
      const json = await res.json();
      setData(json.data);
    } catch (e: any) {
      setError(e.message || 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchMetrics();
    const id = setInterval(() => fetchMetrics(true), 60000);
    return () => clearInterval(id);
  }, [fetchMetrics]);

  const d = data;
  const maxPais   = d?.topPaises[0]?.count || 1;
  const totalPlan = (d?.usuarios.porPlan.starter || 0) + (d?.usuarios.porPlan.pro || 0) + (d?.usuarios.porPlan.premium || 0) || 1;

  // Semáforos por KPI
  const sDiag     = semaforo(d?.diagnosticos.esteMes || 0, [1, 5]);
  const sIngresos = semaforo(d?.diagnosticos.ingresosMes || 0, [59, 295]);
  const sUsuarios = semaforo(d?.usuarios.total || 0, [5, 20]);
  const sLeads    = semaforoInverso(d?.leads.pendientes || 0, [2, 7]);

  const kpiCards = [
    {
      label: 'Diagnósticos',
      value: d?.diagnosticos.total ?? '—',
      sub: `+${d?.diagnosticos.esteMes ?? 0} este mes`,
      icon: FileText,
      color: sDiag,
    },
    {
      label: 'Ingresos estimados',
      value: d ? `${d.diagnosticos.ingresosTotales}€` : '—',
      sub: `+${d?.diagnosticos.ingresosMes ?? 0}€ este mes`,
      icon: DollarSign,
      color: sIngresos,
    },
    {
      label: 'Usuarios',
      value: d?.usuarios.total ?? '—',
      sub: `${d?.usuarios.porPlan.pro ?? 0} pro · ${d?.usuarios.porPlan.premium ?? 0} premium`,
      icon: Users,
      color: sUsuarios,
    },
    {
      label: 'Leads pendientes',
      value: d?.leads.pendientes ?? '—',
      sub: `de ${d?.leads.total ?? 0} totales`,
      icon: Inbox,
      color: sLeads,
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-[-0.025em] text-white">Dashboard</h1>
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl qe-card
                       text-[13px] font-semibold text-white/60 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-950/40 border border-red-900/60 px-4 py-3 text-[13.5px] text-red-400">
            {error}
          </div>
        )}

        {/* ── SECCIÓN 1: KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading
            ? [1,2,3,4].map(i => <Skeleton key={i} />)
            : kpiCards.map(({ label, value, sub, icon: Icon, color }) => {
                const cls = SEMAFORO_CLASSES[color];
                return (
                  <div
                    key={label}
                    className={`qe-card border-t-2 ${cls.border} rounded-2xl p-6`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                        {label}
                      </span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cls.iconBg}`}>
                        <Icon size={15} className={cls.iconColor} />
                      </div>
                    </div>
                    <div className="text-[38px] font-semibold leading-none text-white mb-2">{value}</div>
                    <div className="flex items-center gap-1.5 text-[12px] text-white/40">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cls.dot}`} />
                      {sub}
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* ── SECCIÓN 1.5: Tendencia temporal ── */}
        <div className="mb-6">
          <SeriesChart token={getToken} />
        </div>

        {/* ── SECCIÓN 2: Top países + Usuarios por plan ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {loading
            ? [1,2].map(i => <Skeleton key={i} className="h-[240px] rounded-2xl" />)
            : (
              <>
                {/* Top países */}
                <div className="qe-card rounded-2xl p-6">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-5">
                    Top países — diagnósticos
                  </h2>
                  {!d?.topPaises.length
                    ? <p className="text-[13px] text-white/30">Sin datos aún</p>
                    : (
                      <div className="space-y-4">
                        {d.topPaises.map(({ pais, count }, i) => (
                          <div key={pais}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[13.5px] text-white/80 flex items-center gap-2">
                                <span className="text-[11px] text-white/30 w-4">{i + 1}.</span>
                                {pais}
                              </span>
                              <span className="text-[13px] font-semibold text-white/60">{count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#25D366]"
                                style={{ width: `${(count / maxPais) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>

                {/* Usuarios por plan */}
                <div className="qe-card rounded-2xl p-6">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-5">
                    Usuarios por plan
                  </h2>
                  <div className="space-y-5">
                    {[
                      { label: 'Starter', key: 'starter', bar: 'bg-white/40',    text: 'text-white/60' },
                      { label: 'Pro',     key: 'pro',     bar: 'bg-blue-400',    text: 'text-blue-400'  },
                      { label: 'Premium', key: 'premium', bar: 'bg-amber-400',   text: 'text-amber-400' },
                    ].map(({ label, key, bar, text }) => {
                      const count = d?.usuarios.porPlan[key as keyof typeof d.usuarios.porPlan] || 0;
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[13px] font-semibold ${text}`}>{label}</span>
                            <span className="text-[13px] text-white/60">{count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${bar}`}
                              style={{ width: `${(count / totalPlan) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )
          }
        </div>

        {/* ── SECCIÓN 3: Actividad reciente ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading
            ? [1,2].map(i => <Skeleton key={i} className="h-[240px] rounded-2xl" />)
            : (
              <>
                {/* Últimos diagnósticos */}
                <div className="qe-card rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-[14px] font-semibold text-white">Últimos diagnósticos</h2>
                    <Link
                      to="/admin/expedientes"
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#25D366] hover:opacity-80 transition"
                    >
                      Ver todos <ArrowRight size={12} />
                    </Link>
                  </div>
                  {!d?.ultimosDiagnosticos.length
                    ? <p className="px-6 py-8 text-[13px] text-white/30 text-center">Sin diagnósticos aún</p>
                    : (
                      <div className="divide-y divide-white/6">
                        {d.ultimosDiagnosticos.map((diag: any) => (
                          <div key={diag.id} className="flex items-center gap-3 px-6 py-3.5">
                            <Avatar name={diag.nombre || diag.email} />
                            <div className="flex-1 min-w-0">
                              <div className="text-[13.5px] font-semibold text-white/90 truncate">
                                {diag.nombre || diag.email || 'Anónimo'}
                                {diag.pais && <span className="text-white/40 font-normal"> · {diag.pais}</span>}
                              </div>
                              <div className="text-[12px] text-white/40 truncate">
                                {diag.objetivo || 'Diagnóstico completado'}
                              </div>
                            </div>
                            <span className="text-[11px] text-white/30 shrink-0">
                              {timeAgo(diag.completadoEn || diag.creadoEn)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>

                {/* Últimos leads */}
                <div className="qe-card rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-[14px] font-semibold text-white">Últimos leads</h2>
                    <Link
                      to="/admin/leads"
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#25D366] hover:opacity-80 transition"
                    >
                      Ver todos <ArrowRight size={12} />
                    </Link>
                  </div>
                  {!d?.ultimosLeads.length
                    ? <p className="px-6 py-8 text-[13px] text-white/30 text-center">Sin leads aún</p>
                    : (
                      <div className="divide-y divide-white/6">
                        {d.ultimosLeads.map((lead: any) => {
                          const ESTADO: Record<string, string> = {
                            nuevo:      'bg-emerald-500/15 text-emerald-400',
                            contactado: 'bg-amber-500/15 text-amber-400',
                            convertido: 'bg-blue-500/15 text-blue-400',
                            descartado: 'bg-white/8 text-white/30',
                          };
                          return (
                            <div key={lead.id} className="flex items-center gap-3 px-6 py-3.5">
                              <Avatar name={lead.nombre || lead.email} />
                              <div className="flex-1 min-w-0">
                                <div className="text-[13.5px] font-semibold text-white/90 truncate">
                                  {lead.nombre || 'Sin nombre'}
                                  {lead.pais && <span className="text-white/40 font-normal"> · {lead.pais}</span>}
                                </div>
                                <span className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${ESTADO[lead.estado] || 'bg-white/8 text-white/30'}`}>
                                  {lead.estado || 'nuevo'}
                                </span>
                              </div>
                              <span className="text-[11px] text-white/30 shrink-0">
                                {timeAgo(lead.creadoEn || lead.createdAt)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                </div>
              </>
            )
          }
        </div>

      </div>
    </AdminLayout>
  );
}
