import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const inputCls = `w-full rounded-xl border border-black/10 px-4 py-3 text-[14.5px] text-on-background
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition`;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-1.5';

export default function Config() {
  const { getToken } = useAuth();
  const [limitePro, setLimitePro] = useState(50);
  const [limitePremium, setLimitePremium] = useState(200);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<'success' | 'error' | null>(null);

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
      <div className="p-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background mb-8">
          Configuración
        </h1>

        <div className="bg-white rounded-2xl border border-black/5 p-6 max-w-[500px]">
          <h2 className="text-[16px] font-semibold text-on-background mb-5">
            Límites del Chat IA
          </h2>

          {loading ? (
            <div className="text-[14px] text-on-background/40">Cargando configuración...</div>
          ) : (
            <div className="space-y-4">
              {resultado === 'success' && (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-[13.5px] text-emerald-700 font-medium">
                  <CheckCircle2 size={16} />
                  Configuración guardada correctamente.
                </div>
              )}
              {resultado === 'error' && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13.5px] text-red-600 font-medium">
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
                  className="w-full rounded-xl bg-on-background text-white font-semibold py-3.5 text-[15px]
                             hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar configuración'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
