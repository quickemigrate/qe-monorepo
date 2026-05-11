import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, FolderOpen, FileText, Check, Loader2, Sparkles } from 'lucide-react';
import ClientLayout from '../../components/client/ClientLayout';
import { useClientePlan } from '../../hooks/useClientePlan';
import { usePlanes } from '../../hooks/usePlanes';

const PRO_FEATURES = [
  { icon: MessageCircle, text: 'Asistente IA Mia (50 mensajes/mes)' },
  { icon: FolderOpen,    text: 'Sube hasta 5 documentos a tu expediente' },
  { icon: FileText,      text: 'Diagnóstico IA incluido' },
  { icon: Sparkles,      text: 'IA responde sobre tus documentos personales' },
];

export default function SuscripcionPro() {
  const { plan, loading: loadingPlan } = useClientePlan();
  const { planes } = usePlanes();
  const navigate = useNavigate();
  const location = useLocation();

  const proPlan = planes.find(p => p.id === 'pro');
  const precioDisplay = proPlan?.precioTexto ?? '39€/mes';
  const precioNum = proPlan?.precio ?? 39;

  useEffect(() => {
    if (!loadingPlan && (plan === 'pro' || plan === 'premium')) {
      navigate('/cliente/plan', { replace: true });
    }
  }, [plan, loadingPlan]);

  if (loadingPlan || plan === 'pro' || plan === 'premium') {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={20} className="animate-spin text-white/30" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="p-4 lg:p-8 max-w-[560px]">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25D366]/10 text-[#25D366] text-[12px] font-semibold mb-3">
            <Sparkles size={12} />
            Plan Pro
          </div>
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-[-0.025em] text-white">
            Actualizar a Pro
          </h1>
          <p className="text-[14px] text-white/50 mt-1">
            Accede al asistente IA, documentos y más.
          </p>
        </div>

        <div className="qe-card rounded-2xl p-6 mb-4">
          <h2 className="text-[13px] font-semibold text-white/50 uppercase tracking-[0.08em] mb-4">
            Incluido en Pro
          </h2>
          <ul className="space-y-3">
            {PRO_FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-[#25D366]" />
                </div>
                <span className="text-[13.5px] text-white/80">{text}</span>
                <Check size={14} className="text-[#25D366] ml-auto shrink-0" />
              </li>
            ))}
          </ul>
        </div>

        <div className="qe-card rounded-2xl p-6">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[40px] font-bold text-white leading-none">{precioNum}€</span>
            <span className="text-[14px] text-white/40">/mes</span>
          </div>
          <p className="text-[12.5px] text-white/30 mb-6">Pago único mensual. Cancela cuando quieras contactando con soporte.</p>

          <button
            onClick={() => navigate('/cliente/pago?tipo=pro', { state: { backgroundLocation: location } })}
            className="w-full rounded-full bg-[#25D366] text-[#062810] font-bold py-4 text-[15px]
                       hover:bg-[#2adc6c] active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            Suscribirse — {precioDisplay}
          </button>
        </div>

        <p className="mt-4 text-[12px] text-white/25 text-center">
          Pago seguro con Stripe · SSL cifrado
        </p>
      </div>
    </ClientLayout>
  );
}
