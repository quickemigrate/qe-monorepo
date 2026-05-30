import { useEffect, useState } from 'react';
import { Check, X, Mail, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import ClientLayout from '../../components/client/ClientLayout';
import { useClientePlan } from '../../hooks/useClientePlan';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const PLAN_BADGE: Record<string, string> = {
  free:    'bg-white/10 text-white/50',
  starter: 'bg-white/10 text-white/60',
  pro:     'bg-blue-500/15 text-blue-300',
  premium: 'bg-amber-500/15 text-amber-300',
};

const PLAN_LABEL: Record<string, string> = {
  free:    'Free',
  starter: 'Starter',
  pro:     'Pro',
  premium: 'Premium',
};

interface FilaProps {
  caracteristica: string;
  starter: React.ReactNode;
  pro: React.ReactNode;
  premium: React.ReactNode;
  actual: string | null;
}

const Si = () => <Check size={16} className="text-emerald-500 mx-auto" />;
const No = () => <X size={16} className="text-white/20 mx-auto" />;

function Fila({ caracteristica, starter, pro, premium, actual }: FilaProps) {
  return (
    <tr className="border-b border-white/6">
      <td className="px-4 py-3 text-[13.5px] text-white/70">{caracteristica}</td>
      {(['starter', 'pro', 'premium'] as const).map(p => (
        <td
          key={p}
          className={`px-4 py-3 text-center text-[13px] ${actual === p ? 'bg-[#25D366]/8' : ''}`}
        >
          {p === 'starter' ? starter : p === 'pro' ? pro : premium}
        </td>
      ))}
    </tr>
  );
}

interface SubInfo {
  stripeSubscriptionId?: string;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionCurrentPeriodEnd?: string | null;
  subscriptionStatus?: string;
}

export default function Plan() {
  const { plan, mensajesUsados, mensajesLimit, loading } = useClientePlan();
  const navigate = useNavigate();
  const location = useLocation();

  const [subInfo, setSubInfo] = useState<SubInfo>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelRazon, setCancelRazon] = useState('');

  const fetchPerfil = async () => {
    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch(`${API}/api/usuarios/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setSubInfo({
        stripeSubscriptionId: data.data?.stripeSubscriptionId,
        subscriptionCancelAtPeriodEnd: data.data?.subscriptionCancelAtPeriodEnd,
        subscriptionCurrentPeriodEnd: data.data?.subscriptionCurrentPeriodEnd,
        subscriptionStatus: data.data?.subscriptionStatus,
      });
    } catch { /* silently */ }
  };

  useEffect(() => { fetchPerfil(); }, []);

  const handleCancelar = async () => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      const res = await fetch(`${API}/api/suscripcion/cancelar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ razon: cancelRazon.trim().substring(0, 500) }),
      });
      const data = await res.json();
      if (!data.success) {
        setActionMsg({ tipo: 'error', texto: data.error || 'Error al cancelar.' });
      } else {
        setActionMsg({
          tipo: 'success',
          texto: data.immediate
            ? 'Plan cancelado. Tu cuenta pasó a Free. Te enviamos un email con la confirmación.'
            : 'Cancelación programada. Te enviamos un email con la confirmación. Mantienes el acceso hasta el fin del periodo actual.',
        });
        setConfirmCancelOpen(false);
        setCancelRazon('');
        await fetchPerfil();
      }
    } catch {
      setActionMsg({ tipo: 'error', texto: 'Error de conexión. Inténtalo de nuevo.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReanudar = async () => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      const res = await fetch(`${API}/api/suscripcion/reanudar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        setActionMsg({ tipo: 'error', texto: data.error || 'Error al reanudar.' });
      } else {
        setActionMsg({ tipo: 'success', texto: 'Suscripción reanudada. Se renovará automáticamente.' });
        await fetchPerfil();
      }
    } catch {
      setActionMsg({ tipo: 'error', texto: 'Error de conexión.' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatFecha = (iso?: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const diasHasta = (iso?: string | null): number | null => {
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    if (Number.isNaN(ms)) return null;
    return Math.max(0, Math.ceil(ms / 86400000));
  };

  return (
    <ClientLayout>
      <div className="p-8 max-w-[700px]">
        <h1 className="text-2xl md:text-[28px] font-semibold tracking-[-0.025em] text-white mb-8">
          Mi Plan
        </h1>

        {/* Plan actual */}
        <div className="qe-card rounded-2xl p-6 mb-6">
          <h2 className="text-[15px] font-semibold text-white mb-4">Plan actual</h2>
          {loading ? (
            <div className="text-[14px] text-white/40">Cargando...</div>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`inline-flex px-3 py-1.5 rounded-xl text-[14px] font-semibold ${PLAN_BADGE[plan || 'free']}`}>
                {PLAN_LABEL[plan || 'free']}
              </span>
              {(plan === 'pro' || plan === 'premium') && mensajesLimit > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-[13.5px] text-white/50">
                      Mensajes IA: <strong className="text-white">{mensajesUsados}</strong> / {mensajesLimit}
                    </span>
                    <div className="w-28 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#25D366] transition-all"
                        style={{ width: `${Math.min((mensajesUsados / mensajesLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[11.5px] text-white/35">Resetea el día 1 de cada mes</span>
                </div>
              )}
            </div>
          )}

          {/* Subscription info + cancel/reanudar */}
          {plan === 'pro' && (
            <div className="mt-5 pt-5 border-t border-white/8 space-y-3">
              {actionMsg && (
                <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13px] font-medium border
                  ${actionMsg.tipo === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                  {actionMsg.tipo === 'success' ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
                  <span>{actionMsg.texto}</span>
                </div>
              )}

              {subInfo.subscriptionCancelAtPeriodEnd ? (
                <>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-[13px] text-amber-300">
                    Tu suscripción está cancelada. Mantienes acceso hasta{' '}
                    <strong>{formatFecha(subInfo.subscriptionCurrentPeriodEnd)}</strong>.
                  </div>
                  <button
                    onClick={handleReanudar}
                    disabled={actionLoading}
                    className="rounded-xl bg-[#25D366] text-[#062810] font-semibold px-4 py-2.5 text-[13.5px]
                               hover:bg-[#2adc6c] transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Procesando...' : 'Reanudar suscripción'}
                  </button>
                </>
              ) : (
                <>
                  {subInfo.stripeSubscriptionId ? (() => {
                    const dias = diasHasta(subInfo.subscriptionCurrentPeriodEnd);
                    return (
                      <div className="text-[13px] text-white/50">
                        Próximo cobro:{' '}
                        <strong className="text-white">{formatFecha(subInfo.subscriptionCurrentPeriodEnd)}</strong>
                        {dias !== null && (
                          <span className="text-white/40"> · en {dias} {dias === 1 ? 'día' : 'días'}</span>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="text-[13px] text-white/50">Plan Pro activo.</div>
                  )}
                  <button
                    onClick={() => { setConfirmCancelOpen(true); setActionMsg(null); setCancelRazon(''); }}
                    className="text-[13px] font-medium text-white/50 hover:text-red-300 transition underline underline-offset-2"
                  >
                    Cancelar suscripción
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tabla comparativa */}
        <div className="qe-card rounded-2xl overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 w-[40%]">
                  Característica
                </th>
                {(['starter', 'pro', 'premium'] as const).map(p => (
                  <th
                    key={p}
                    className={`px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em]
                      ${plan === p ? 'text-white bg-[#25D366]/8' : 'text-white/40'}`}
                  >
                    {p === 'starter' ? 'Starter' : p === 'pro' ? 'Pro' : 'Premium'}
                    {plan === p && (
                      <span className="ml-1.5 text-[10px] font-bold text-[#25D366]">(actual)</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Fila caracteristica="Diagnóstico IA" starter={<Si />} pro={<Si />} premium={<Si />} actual={plan} />
              <Fila caracteristica="PDF personalizado" starter={<Si />} pro={<Si />} premium={<Si />} actual={plan} />
              <Fila
                caracteristica="Milo, tu asistente (resetea día 1 cada mes)"
                starter={<No />}
                pro={<span className="text-emerald-400 font-semibold">50 msgs/mes</span>}
                premium={<span className="text-emerald-400 font-semibold">200 msgs/mes</span>}
                actual={plan}
              />
              <Fila caracteristica="Mis Documentos" starter={<No />} pro={<Si />} premium={<Si />} actual={plan} />
              <Fila caracteristica="Mi Expediente" starter={<No />} pro={<No />} premium={<Si />} actual={plan} />
              <Fila caracteristica="Asesor humano" starter={<No />} pro={<No />} premium={<Si />} actual={plan} />
            </tbody>
          </table>
        </div>

        {/* CTA cambio de plan */}
        <div className="qe-card rounded-2xl p-6">
          {(plan === 'free' || plan === 'starter' || !plan) ? (
            <>
              <h2 className="text-[15px] font-semibold text-white mb-1">Actualiza al Plan Pro</h2>
              <p className="text-[13.5px] text-white/50 mb-4">
                Desbloquea el asistente IA, sube documentos y obtén respuestas personalizadas a tu caso.
              </p>
              <button
                onClick={() => navigate('/cliente/pago?tipo=pro', { state: { backgroundLocation: location } })}
                className="inline-flex items-center gap-2 bg-[#25D366] text-[#062810] font-bold
                           px-5 py-2.5 rounded-full text-[14px] hover:bg-[#2adc6c] transition-colors active:scale-95"
              >
                <Sparkles size={15} />
                Actualizar a Pro — 39€/mes
              </button>
            </>
          ) : plan === 'pro' ? (
            <>
              <h2 className="text-[15px] font-semibold text-white mb-1">Actualiza al Plan Premium</h2>
              <p className="text-[13.5px] text-white/50 mb-4">
                Accede a asesor humano, expediente completo y hasta 200 mensajes IA al mes.
              </p>
              <a
                href="mailto:hola@quickemigrate.com?subject=Cambio a Plan Premium"
                className="inline-flex items-center gap-2 bg-[#25D366] text-[#062810] font-bold
                           px-5 py-2.5 rounded-full text-[14px] hover:bg-[#2adc6c] transition-colors active:scale-95"
              >
                <Mail size={15} />
                Contactar para Premium
              </a>
            </>
          ) : (
            <>
              <h2 className="text-[15px] font-semibold text-white mb-1">Ya tienes el plan más alto</h2>
              <p className="text-[13.5px] text-white/50">Premium es nuestro plan superior. Si necesitas algo extra, contacta con soporte.</p>
            </>
          )}
        </div>
      </div>

      {confirmCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-[440px] rounded-2xl border border-white/10 bg-[#111111] p-6">
            <h3 className="text-[17px] font-semibold text-white mb-1">¿Cancelar suscripción Pro?</h3>
            <p className="text-[13.5px] text-white/55 mb-4 leading-[1.6]">
              {subInfo.stripeSubscriptionId ? (
                <>
                  Mantienes el acceso completo hasta{' '}
                  <strong className="text-white">{formatFecha(subInfo.subscriptionCurrentPeriodEnd)}</strong>.
                  Después pasarás a Free. Puedes reanudar en cualquier momento antes de esa fecha.
                </>
              ) : (
                <>Tu plan pasará a Free de inmediato. Te enviaremos un email de confirmación.</>
              )}
            </p>

            <div className="mb-5">
              <label htmlFor="cancel-razon" className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1.5">
                ¿Por qué cancelas? <span className="normal-case font-normal">(opcional, nos ayuda a mejorar)</span>
              </label>
              <textarea
                id="cancel-razon"
                value={cancelRazon}
                onChange={e => setCancelRazon(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ej: ya resolví mi caso, demasiado caro, falta una función..."
                className="w-full rounded-xl border border-white/15 bg-[#0A0A0A] px-3.5 py-2.5
                           text-[13.5px] text-white placeholder:text-white/25 resize-none
                           focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-transparent transition"
              />
              <div className="text-right text-[11px] text-white/30 mt-1">{cancelRazon.length}/500</div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmCancelOpen(false)}
                disabled={actionLoading}
                className="flex-1 rounded-xl border border-white/15 text-white/70 font-semibold py-3 text-[13.5px] hover:bg-white/5 transition disabled:opacity-50"
              >
                Mantener Pro
              </button>
              <button
                onClick={handleCancelar}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 font-semibold py-3 text-[13.5px] hover:bg-red-500/25 transition disabled:opacity-50"
              >
                {actionLoading ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
