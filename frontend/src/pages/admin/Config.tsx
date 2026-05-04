import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import type { PlanCMS } from '../../hooks/usePlanes';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const inputCls = `w-full rounded-xl border border-white/15 px-4 py-3 text-[14.5px] text-white
                  bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 transition placeholder-white/25`;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1.5';

const DEFAULT_PLANES: PlanCMS[] = [
  { id: 'free', nombre: 'Free', precio: 0, precioTexto: 'Gratis', tipo: 'free', descripcion: '', features: [], activo: true, orden: 1 },
  { id: 'starter', nombre: 'Starter', precio: 59, precioTexto: '59€', tipo: 'unico', descripcion: '', features: [], activo: true, orden: 2 },
  { id: 'pro', nombre: 'Pro', precio: 39, precioTexto: '39€/mes', tipo: 'mensual', descripcion: '', features: [], activo: true, orden: 3 },
  { id: 'premium', nombre: 'Premium', precio: null, precioTexto: 'A consultar', tipo: 'custom', descripcion: '', features: [], activo: true, orden: 4 },
];

export default function Config() {
  const { getToken } = useAuth();
  const [limitePro, setLimitePro] = useState(50);
  const [limitePremium, setLimitePremium] = useState(200);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<'success' | 'error' | null>(null);

  const [planes, setPlanes] = useState<PlanCMS[]>(DEFAULT_PLANES);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [savingPlanes, setSavingPlanes] = useState(false);
  const [resultadoPlanes, setResultadoPlanes] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API}/api/config/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLimitePro(data.data.limiteMensajesPro ?? 50);
        setLimitePremium(data.data.limiteMensajesPremium ?? 200);
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    fetch(`${API}/api/config/planes`)
      .then(r => r.json())
      .then(({ planes: data }) => { if (data) setPlanes(data); })
      .catch(() => {})
      .finally(() => setLoadingPlanes(false));
  }, []);

  const updatePlan = (idx: number, field: keyof PlanCMS, value: unknown) => {
    setPlanes(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addFeature = (idx: number) => {
    setPlanes(prev => prev.map((p, i) => i === idx ? { ...p, features: [...p.features, ''] } : p));
  };

  const updateFeature = (planIdx: number, featIdx: number, value: string) => {
    setPlanes(prev => prev.map((p, i) => i === planIdx
      ? { ...p, features: p.features.map((f, fi) => fi === featIdx ? value : f) }
      : p
    ));
  };

  const removeFeature = (planIdx: number, featIdx: number) => {
    setPlanes(prev => prev.map((p, i) => i === planIdx
      ? { ...p, features: p.features.filter((_, fi) => fi !== featIdx) }
      : p
    ));
  };

  const handleGuardarPlanes = async () => {
    setSavingPlanes(true);
    setResultadoPlanes(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/config/planes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planes }),
      });
      setResultadoPlanes(res.ok ? 'success' : 'error');
      if (res.ok) localStorage.removeItem('qe_planes_cache');
    } catch {
      setResultadoPlanes('error');
    } finally {
      setSavingPlanes(false);
    }
  };

  const handleGuardar = async () => {
    setSaving(true);
    setResultado(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/config/chat`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          limiteMensajesPro: Number(limitePro),
          limiteMensajesPremium: Number(limitePremium),
        }),
      });
      setResultado(res.ok ? 'success' : 'error');
    } catch {
      setResultado('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl md:text-[28px] font-semibold tracking-[-0.025em] text-white mb-8">Configuración</h1>

        <div className="qe-card rounded-2xl p-6 max-w-[500px]">
          <h2 className="text-[16px] font-semibold text-white mb-5">Límites del Chat IA</h2>

          {loading ? (
            <div className="text-[14px] text-white/40">Cargando configuración...</div>
          ) : (
            <div className="space-y-4">
              {resultado === 'success' && (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-[13.5px] text-emerald-400 font-medium">
                  <CheckCircle2 size={16} />
                  Configuración guardada correctamente.
                </div>
              )}
              {resultado === 'error' && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13.5px] text-red-400 font-medium">
                  <AlertCircle size={16} />
                  Error al guardar. Inténtalo de nuevo.
                </div>
              )}

              <div>
                <label className={labelCls}>Límite mensajes Pro (mensual)</label>
                <input
                  type="number"
                  min={1}
                  value={limitePro}
                  onChange={e => setLimitePro(Number(e.target.value))}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Límite mensajes Premium (mensual)</label>
                <input
                  type="number"
                  min={1}
                  value={limitePremium}
                  onChange={e => setLimitePremium(Number(e.target.value))}
                  className={inputCls}
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGuardar}
                  disabled={saving}
                  className="w-full rounded-xl bg-[#25D366] text-[#062810] font-semibold py-3.5 text-[15px]
                             hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar configuración'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Planes */}
        <div className="mt-8 qe-card rounded-2xl p-6 max-w-[900px]">
          <h2 className="text-[16px] font-semibold text-white mb-5">Gestión de Planes</h2>

          {loadingPlanes ? (
            <div className="text-[14px] text-white/40">Cargando planes...</div>
          ) : (
            <div className="space-y-6">
              {resultadoPlanes === 'success' && (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-[13.5px] text-emerald-400 font-medium">
                  <CheckCircle2 size={16} /> Planes guardados correctamente.
                </div>
              )}
              {resultadoPlanes === 'error' && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13.5px] text-red-400 font-medium">
                  <AlertCircle size={16} /> Error al guardar. Inténtalo de nuevo.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {planes.map((plan, idx) => (
                  <div key={plan.id} className="border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-bold uppercase tracking-widest text-white/40">{plan.id}</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[12px] text-white/50">Activo</span>
                        <input
                          type="checkbox"
                          checked={plan.activo}
                          onChange={e => updatePlan(idx, 'activo', e.target.checked)}
                          className="w-4 h-4 accent-[#25D366]"
                        />
                      </label>
                    </div>

                    <div>
                      <label className={labelCls}>Nombre</label>
                      <input type="text" value={plan.nombre} onChange={e => updatePlan(idx, 'nombre', e.target.value)} className={inputCls} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Precio (€)</label>
                        <input
                          type="number"
                          value={plan.precio ?? ''}
                          onChange={e => updatePlan(idx, 'precio', e.target.value === '' ? null : Number(e.target.value))}
                          className={inputCls}
                          placeholder="null = consultar"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Texto precio</label>
                        <input type="text" value={plan.precioTexto} onChange={e => updatePlan(idx, 'precioTexto', e.target.value)} className={inputCls} />
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Descripción</label>
                      <textarea
                        value={plan.descripcion}
                        onChange={e => updatePlan(idx, 'descripcion', e.target.value)}
                        rows={2}
                        className={`${inputCls} resize-none`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">Features</label>
                        <button
                          onClick={() => addFeature(idx)}
                          className="flex items-center gap-1 text-[11px] text-[#25D366] font-semibold hover:opacity-80"
                        >
                          <Plus size={12} /> Añadir
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {plan.features.map((feat, fi) => (
                          <div key={fi} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={feat}
                              onChange={e => updateFeature(idx, fi, e.target.value)}
                              className={`${inputCls} py-2`}
                            />
                            <button onClick={() => removeFeature(idx, fi)} className="shrink-0 text-red-400 hover:text-red-300">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleGuardarPlanes}
                disabled={savingPlanes}
                className="rounded-xl bg-[#25D366] text-[#062810] font-semibold px-6 py-3.5 text-[15px]
                           hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50"
              >
                {savingPlanes ? 'Guardando...' : 'Guardar planes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
