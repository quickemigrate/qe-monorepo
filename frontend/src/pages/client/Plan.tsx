import { Check, X, Mail } from 'lucide-react';
import ClientLayout from '../../components/client/ClientLayout';
import { useClientePlan } from '../../hooks/useClientePlan';

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-700',
  pro:     'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
};

const PLAN_LABEL: Record<string, string> = {
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
const No = () => <X size={16} className="text-on-background/20 mx-auto" />;

function Fila({ caracteristica, starter, pro, premium, actual }: FilaProps) {
  return (
    <tr className="border-b border-black/4">
      <td className="px-4 py-3 text-[13.5px] text-on-background/70">{caracteristica}</td>
      {(['starter', 'pro', 'premium'] as const).map(p => (
        <td
          key={p}
          className={`px-4 py-3 text-center text-[13px] ${actual === p ? 'bg-primary-container/8' : ''}`}
        >
          {p === 'starter' ? starter : p === 'pro' ? pro : premium}
        </td>
      ))}
    </tr>
  );
}

export default function Plan() {
  const { plan, mensajesUsados, mensajesLimit, loading } = useClientePlan();

  return (
    <ClientLayout>
      <div className="p-8 max-w-[700px]">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background mb-8">
          Mi Plan
        </h1>

        {/* Plan actual */}
        <div className="bg-white rounded-2xl border border-black/5 p-6 mb-6">
          <h2 className="text-[15px] font-semibold text-on-background mb-4">Plan actual</h2>
          {loading ? (
            <div className="text-[14px] text-on-background/40">Cargando...</div>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`inline-flex px-3 py-1.5 rounded-xl text-[14px] font-semibold ${PLAN_BADGE[plan || 'starter']}`}>
                {PLAN_LABEL[plan || 'starter']}
              </span>
              {(plan === 'pro' || plan === 'premium') && mensajesLimit > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-[13.5px] text-on-background/50">
                    Mensajes IA: <strong className="text-on-background">{mensajesUsados}</strong> / {mensajesLimit}
                  </span>
                  <div className="w-28 h-1.5 rounded-full bg-black/8 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-container transition-all"
                      style={{ width: `${Math.min((mensajesUsados / mensajesLimit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabla comparativa */}
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/5">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 w-[40%]">
                  Característica
                </th>
                {(['starter', 'pro', 'premium'] as const).map(p => (
                  <th
                    key={p}
                    className={`px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em]
                      ${plan === p ? 'text-on-background bg-primary-container/8' : 'text-on-background/40'}`}
                  >
                    {p === 'starter' ? 'Starter' : p === 'pro' ? 'Pro' : 'Premium'}
                    {plan === p && (
                      <span className="ml-1.5 text-[10px] font-bold text-primary-container">(actual)</span>
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
                pro={<span className="text-emerald-600 font-semibold">50 msgs</span>}
                premium={<span className="text-emerald-600 font-semibold">200 msgs</span>}
                actual={plan}
              />
              <Fila caracteristica="Mis Documentos" starter={<No />} pro={<Si />} premium={<Si />} actual={plan} />
              <Fila caracteristica="Mi Expediente" starter={<No />} pro={<No />} premium={<Si />} actual={plan} />
              <Fila caracteristica="Asesor humano" starter={<No />} pro={<No />} premium={<Si />} actual={plan} />
            </tbody>
          </table>
        </div>

        {/* CTA cambio de plan */}
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          <h2 className="text-[15px] font-semibold text-on-background mb-1">¿Quieres cambiar de plan?</h2>
          <p className="text-[13.5px] text-on-background/50 mb-4">
            Contacta con nuestro equipo y te ayudamos a encontrar el plan que mejor se adapta a tu situación.
          </p>
          <a
            href="mailto:hola@quickemigrate.com?subject=Cambio de plan"
            className="inline-flex items-center gap-2 bg-primary-container text-on-background font-bold
                       px-5 py-2.5 rounded-full text-[14px] hover:scale-105 transition-transform active:scale-95 shadow-sm"
          >
            <Mail size={15} />
            Contactar para cambiar de plan
          </a>
        </div>
      </div>
    </ClientLayout>
  );
}
