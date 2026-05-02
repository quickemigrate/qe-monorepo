import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, Edit2, ShieldCheck, Clock, Mail } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import PerfilWizard, { type PerfilFormState } from '../components/PerfilWizard';
import { usePlanes } from '../hooks/usePlanes';
import { AuroraBackground } from '../components/ui/aurora-background';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

type Estado = 'loading' | 'confirmacion' | 'editar';

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-white/6 last:border-0">
      <span className="text-[12px] text-white/40 font-semibold uppercase tracking-wide min-w-[130px] shrink-0 pt-px">
        {label}
      </span>
      <span className="text-[13.5px] text-white/80">{value || '—'}</span>
    </div>
  );
}

function CheckoutForm({
  diagnosticoId,
  precioTexto,
  onSuccess,
  onError,
}: {
  diagnosticoId: string;
  precioTexto: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
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
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API}/api/diagnostico/confirm-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id, diagnosticoId }),
        });
        if ((await res.json()).success) onSuccess();
        else onError('Error al procesar el pago. Contacta con soporte.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-white/15 bg-[#0A0A0A] p-4 [&_.p-StripeElement]:text-white">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="w-full rounded-full bg-[#25D366] text-[#062810] font-bold py-4 text-[15px]
                   hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50"
      >
        {processing ? 'Procesando...' : `Pagar ${precioTexto}`}
      </button>
    </form>
  );
}

export default function DiagnosticoPage() {
  const { planes } = usePlanes();
  const starterPrecioTexto = planes.find(p => p.id === 'starter')?.precioTexto ?? '59€';
  const navigate = useNavigate();

  const [estado, setEstado] = useState<Estado>('loading');
  const [userEmail, setUserEmail] = useState('');
  const [perfilData, setPerfilData] = useState<PerfilFormState | null>(null);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [diagnosticoId, setDiagnosticoId] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      if (!user) {
        navigate('/cliente/login', {
          state: { mensaje: 'Necesitas una cuenta para hacer tu diagnóstico' },
        });
        return;
      }

      setUserEmail(user.email || '');

      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API}/api/usuarios/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const ud = data.data;
          setPerfilData({
            nombre: ud?.nombre || user.displayName || '',
            pais: ud?.perfil?.pais || '',
            edad: ud?.perfil?.edad || '',
            sector: ud?.perfil?.sector || '',
            estudios: ud?.perfil?.estudios || '',
            experiencia: ud?.perfil?.experiencia || '',
            situacion: ud?.perfil?.situacion || '',
            medios: ud?.perfil?.medios || '',
            objetivo: ud?.perfil?.objetivo || '',
            plazo: ud?.perfil?.plazo || '',
            familiaresEnEspana: ud?.perfil?.familiaresEnEspana || '',
            otrosIdiomas: ud?.perfil?.otrosIdiomas || '',
            cualesIdiomas: ud?.perfil?.cualesIdiomas || '',
          });
        }
      } catch {
        // Profile fetch failed — user can still see empty confirmation
      }

      setEstado('confirmacion');
    });
    return () => unsubscribe();
  }, []);

  const p = perfilData;

  // ── Cargando ────────────────────────────────────────────────
  if (estado === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center pt-20">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  // ── Editar perfil ────────────────────────────────────────────
  if (estado === 'editar') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-20 px-4">
        <div className="max-w-[560px] mx-auto py-10">
          <button
            onClick={() => setEstado('confirmacion')}
            className="mb-6 text-[13px] font-semibold text-white/50 hover:text-white transition flex items-center gap-1.5"
          >
            ← Volver sin guardar
          </button>
          <div className="mb-6">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-white">
              Editar mis datos
            </h2>
            <p className="text-[14px] text-white/50 mt-1">
              Los cambios se guardarán en tu perfil y se usarán en el diagnóstico.
            </p>
          </div>
          <PerfilWizard
            initialData={p || undefined}
            showProgress={false}
            submitLabel="Guardar y confirmar"
            onComplete={(data) => {
              setPerfilData(data);
              setEstado('confirmacion');
            }}
          />
        </div>
      </div>
    );
  }

  // ── Confirmación ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans">
      {/* Hero */}
      <AuroraBackground className="min-h-[28rem] pt-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold mb-5"
          style={{ background: '#25D366', color: '#062810' }}
        >
          {starterPrecioTexto} — pago único
        </motion.div>
        <motion.h1
          initial={{ opacity: 0.5, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeInOut" }}
          className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-center text-[34px] md:text-[52px] font-bold tracking-[-0.03em] leading-[1.1] text-transparent mb-3"
        >
          Tu diagnóstico personalizado
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="text-[16px] text-white/50 leading-[1.5] text-center max-w-md"
        >
          Basado en tu perfil. Revisa que todo es correcto antes de pagar.
        </motion.p>
      </AuroraBackground>

      {/* Contenido */}
      <section className="mx-auto max-w-[600px] px-6 py-10 space-y-4">

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13.5px] text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Card: Sobre ti */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-3">
            Sobre ti
          </div>
          <InfoRow label="Nombre" value={p?.nombre} />
          <InfoRow label="País" value={p?.pais} />
          <InfoRow label="Edad" value={p?.edad} />
          <InfoRow label="Sector" value={p?.sector} />
        </div>

        {/* Card: Tu situación */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-3">
            Tu situación
          </div>
          <InfoRow label="Estudios" value={p?.estudios} />
          <InfoRow label="Experiencia" value={p?.experiencia} />
          <InfoRow label="Situación" value={p?.situacion} />
          <InfoRow label="Medios económicos" value={p?.medios} />
        </div>

        {/* Card: Tu objetivo */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-3">
            Tu objetivo
          </div>
          <InfoRow label="Objetivo" value={p?.objetivo} />
          <InfoRow label="Plazo" value={p?.plazo} />
          <InfoRow label="Familia en España" value={p?.familiaresEnEspana} />
          <InfoRow
            label="Otros idiomas"
            value={p?.otrosIdiomas === 'Sí' && p?.cualesIdiomas
              ? `Sí — ${p.cualesIdiomas}`
              : p?.otrosIdiomas || undefined}
          />
        </div>

        {/* Card: Precio */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 text-center">
          <div className="text-[16px] font-semibold text-white mb-1">Diagnóstico Migratorio Personalizado</div>
          <div className="text-[13px] text-white/40 mb-4 space-y-0.5">
            <div>Informe PDF personalizado</div>
            <div>+ Checklist de documentos</div>
            <div>+ Plazos estimados</div>
          </div>
          <div className="text-[56px] font-bold leading-none" style={{ color: '#25D366' }}>{starterPrecioTexto}</div>
          <div className="text-[13px] text-white/40 mt-1">pago único</div>
        </div>

        {/* Botón editar */}
        <button
          onClick={() => setEstado('editar')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full border border-white/20
                     text-[15px] font-semibold text-white/70 bg-transparent hover:border-white/40 hover:text-white transition"
        >
          <Edit2 size={15} />
          Editar mis datos
        </button>

        {/* Stripe */}
        {!clientSecret ? (
          <button
            onClick={async () => {
              setError('');
              setLoadingPayment(true);
              try {
                const auth = getAuth();
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch(`${API}/api/diagnostico/create-payment-intent`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!data.success) { setError(data.error || 'Error al iniciar el pago.'); return; }
                setClientSecret(data.clientSecret);
                setDiagnosticoId(data.diagnosticoId);
              } catch {
                setError('Error al iniciar el pago. Inténtalo de nuevo.');
              } finally {
                setLoadingPayment(false);
              }
            }}
            disabled={loadingPayment}
            className="w-full rounded-full bg-[#25D366] text-[#062810] font-bold py-4 text-[15px]
                       hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50"
          >
            {loadingPayment ? 'Cargando...' : `Pagar ${starterPrecioTexto}`}
          </button>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
            <CheckoutForm
              diagnosticoId={diagnosticoId}
              precioTexto={starterPrecioTexto}
              onSuccess={() => navigate('/diagnostico/exito')}
              onError={(msg) => setError(msg)}
            />
          </Elements>
        )}

        {/* Garantías */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { icon: ShieldCheck, label: 'Pago seguro con Stripe' },
            { icon: Clock,       label: 'Informe en menos de 5 minutos' },
            { icon: Mail,        label: `Enviado a ${userEmail || 'tu email'}` },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 bg-[#111111] rounded-xl border border-white/10 px-4 py-3">
              <Icon size={16} className="text-[#25D366] shrink-0" />
              <span className="text-[12.5px] font-medium text-white/60">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
