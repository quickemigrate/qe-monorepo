import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

interface Props {
  precioTexto: string;
  submitLabel?: string;
  onConfirm: (paymentIntentId: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function StripeCheckoutForm({ precioTexto, submitLabel, onConfirm, onSuccess, onError }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (error) { onError(error.message || 'Error al procesar el pago.'); return; }
      if (paymentIntent?.status === 'succeeded') {
        const result = await onConfirm(paymentIntent.id);
        if (result.success) onSuccess();
        else onError(result.error || 'Error al procesar el pago. Contacta con soporte.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-white/15 bg-[#0A0A0A] p-4">
        <PaymentElement options={{ layout: 'tabs', wallets: { applePay: 'auto', googlePay: 'auto' } }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="w-full rounded-full bg-[#25D366] text-[#062810] font-bold py-4 text-[15px]
                   hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {processing && <Loader2 size={16} className="animate-spin" />}
        {processing ? 'Procesando...' : (submitLabel || `Pagar ${precioTexto}`)}
      </button>
    </form>
  );
}
