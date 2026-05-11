import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> | null {
  if (!STRIPE_KEY) return null;
  if (!stripePromise) stripePromise = loadStripe(STRIPE_KEY);
  return stripePromise;
}

export default function StripeCheckoutEmbedded({ clientSecret }: { clientSecret: string }) {
  const stripe = getStripe();
  if (!stripe) {
    return (
      <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13px] text-red-400">
        Stripe no está configurado. Falta VITE_STRIPE_PUBLISHABLE_KEY.
      </div>
    );
  }
  return (
    <div className="rounded-2xl overflow-hidden bg-white">
      <EmbeddedCheckoutProvider stripe={stripe} options={{ clientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
