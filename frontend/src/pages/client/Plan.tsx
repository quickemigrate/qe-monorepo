import { Check, X, Mail, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/client/ClientLayout';
import { useClientePlan } from '../../hooks/useClientePlan';

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

export default function Plan() {
  const { plan, mensajesUsados, mensajesLimit, loading } = useClientePlan();
  const navigate = useNavigate();

  return (
    <ClientLayout>
      <div className="p-8 max-w-[700px]">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-white mb-8">
          Mi Plan
        </h1>

        {/* Plan actual */}
        <div className="bg-[#111111] rounded-2xl border border-white/8 p-6 mb-6">
          <h2 className="text-[15px] font-semibold text-white mb-4">Plan actual</h2>
          {loading ? (
            <div className="text-[14px] text-white/40">Cargando...</div>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`inline-flex px-3 py-1.5 rounded-xl text-[14px] font-semibold ${PLAN_BADGE[plan || 'free']}`}>
                {PLAN_LABEL[plan || 'free']}
              </span>
              {(plan === 'pro' || plan === 'premium') && mensajesLimit > 0 && (
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
              )}
            </div>
          )}
        </div>

        {/* Tabla comparativa */}
        <div className="bg-[#111111] rounded-2xl border border-white/8 overflow-hidden mb-6">
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
                caracteristica="Asistente IA"
                starter={<No />}
                pro={<span className="text-emerald-400 font-semibold">50 msgs</span>}
                premium={<span className="text-emerald-400 font-semibold">200 msgs</span>}
                actual={plan}
              />
              <Fila caracteristica="Mis Documentos" starter={<No />} pro={<Si />} premium={<Si />} actual={plan} />
              <Fila caracteristica="Mi Expediente" starter={<No />} pro={<No />} premium={<Si />} actual={plan} />
              <Fila caracteristica="Asesor humano" starter={<No />} pro={<No />} premium={<Si />} actual={plan} />
            </tbody>
          </table>
        </div>

        {/* CTA cambio de plan */}
        <div className="bg-[#111111] rounded-2xl border border-white/8 p-6">
          {plan === 'starter' ? (
            <>
              <h2 className="text-[15px] font-semibold text-white mb-1">Actualiza al Plan Pro</h2>
              <p className="text-[13.5px] text-white/50 mb-4">
                Desbloquea el asistente IA, sube documentos y obtén respuestas personalizadas a tu caso.
              </p>
              <button
                onClick={() => navigate('/cliente/suscripcion-pro')}
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
              <h2 className="text-[15px] font-semibold text-white mb-1">¿Necesitas cambiar de plan?</h2>
              <p className="text-[13.5px] text-white/50 mb-4">
                Contacta con nuestro equipo y te ayudamos.
              </p>
              <a
                href="mailto:hola@quickemigrate.com?subject=Cambio de plan"
                className="inline-flex items-center gap-2 bg-[#25D366] text-[#062810] font-bold
                           px-5 py-2.5 rounded-full text-[14px] hover:bg-[#2adc6c] transition-colors active:scale-95"
              >
                <Mail size={15} />
                Contactar
              </a>
            </>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
