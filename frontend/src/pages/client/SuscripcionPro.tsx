import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { MessageCircle, FolderOpen, FileText, Check, Loader2, AlertCircle, X, Sparkles } from 'lucide-react';
import ClientLayout from '../../components/client/ClientLayout';
import StripeCheckoutForm from '../../components/StripeCheckoutForm';
import { useAuth } from '../../context/AuthContext';
import { useClientePlan } from '../../hooks/useClientePlan';
import { usePlanes } from '../../hooks/usePlanes';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const PRO_FEATURES = [
  { icon: MessageCircle, text: 'Asistente IA Mia (50 mensajes/mes)' },
  { icon: FolderOpen,    text: 'Sube hasta 5 documentos a tu expediente' },
  { icon: FileText,      text: 'Diagnóstico IA incluido' },
  { icon: Sparkles,      text: 'IA responde sobre tus documentos personales' },
];

export default function SuscripcionPro() {
  const { getToken } = useAuth();
  const { plan, loading: loadingPlan } = useClientePlan();
  const { planes } = usePlanes();
  const navigate = useNavigate();

  const proPlan = planes.find(p => p.id === 'pro');
  const precioDisplay = proPlan?.precioTexto ?? '39€/mes';
  const precioNum = proPlan?.precio ?? 39;

  const [clientSecret, setClientSecret] = useState('');
  const [precioTexto, setPrecioTexto] = useState('');
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loadingPlan && (plan === 'pro' || plan === 'premium')) {
      navigate('/cliente/plan', { replace: true });
    }
  }, [plan, loadingPlan]);

  const initPayment = async () => {
    setError('');
    setLoadingIntent(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/suscripcion/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Error al iniciar el pago.'); return; }
      setClientSecret(data.clientSecret);
      setPrecioTexto(data.precioTexto);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoadingIntent(false);
    }
  };

  const handleConfirm = async (paymentIntentId: string) => {
    const token = await getToken();
    const res = await fetch(`${API}/api/suscripcion/confirm-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentIntentId }),
    });
    return res.json();
  };

  if (loadingPlan) {
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

        {error && (
          <div className="flex items-center gap-2.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13px] text-red-400">
            <AlertCircle size={15} />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Features card */}
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

        {/* Price + payment */}
        <div className="qe-card rounded-2xl p-6">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[40px] font-bold text-white leading-none">{precioNum}€</span>
            <span className="text-[14px] text-white/40">/mes</span>
          </div>
          <p className="text-[12.5px] text-white/30 mb-6">Pago único mensual. Cancela cuando quieras contactando con soporte.</p>

          {!clientSecret ? (
            <button
              onClick={initPayment}
              disabled={loadingIntent}
              className="w-full rounded-full bg-[#25D366] text-[#062810] font-bold py-4 text-[15px]
                         hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingIntent && <Loader2 size={16} className="animate-spin" />}
              {loadingIntent ? 'Cargando...' : `Suscribirse — ${precioDisplay}`}
            </button>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
              <StripeCheckoutForm
                precioTexto={precioTexto || precioDisplay}
                submitLabel={`Activar Plan Pro — ${precioTexto || precioDisplay}`}
                onConfirm={handleConfirm}
                onSuccess={() => navigate('/cliente/inicio')}
                onError={(msg) => setError(msg)}
              />
            </Elements>
          )}
        </div>

        <p className="mt-4 text-[12px] text-white/25 text-center">
          Pago seguro con Stripe · SSL cifrado
        </p>
      </div>
    </ClientLayout>
  );
}
