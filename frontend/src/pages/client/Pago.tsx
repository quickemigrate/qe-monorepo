import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StripeCheckoutEmbedded from '../../components/StripeCheckoutEmbedded';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

type Tipo = 'diagnostico' | 'pro';

const COPY: Record<Tipo, { title: string; subtitle: string }> = {
  diagnostico: {
    title: 'Diagnóstico migratorio',
    subtitle: 'Pago único — informe personalizado en menos de 5 minutos',
  },
  pro: {
    title: 'Plan Pro',
    subtitle: 'Suscripción mensual — cancela cuando quieras',
  },
};

export default function Pago() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [params] = useSearchParams();
  const tipo = (params.get('tipo') as Tipo) || 'diagnostico';

  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tipo !== 'diagnostico' && tipo !== 'pro') {
      setError('Tipo de pago no válido.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API}/api/pagos/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tipo }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.success) {
          setError(data.error || 'No se pudo iniciar el pago.');
        } else {
          setClientSecret(data.clientSecret);
        }
      } catch {
        if (!cancelled) setError('Error de conexión. Inténtalo de nuevo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tipo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, []);

  const close = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/cliente/inicio');
  };

  const copy = COPY[tipo] ?? COPY.diagnostico;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
      <button
        aria-label="Cerrar"
        onClick={close}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative w-full max-w-[820px] qe-card-strong rounded-3xl overflow-hidden shadow-[0_24px_64px_-16px_rgba(0,0,0,0.7)]">
        <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-white/8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366] text-[11px] font-semibold mb-2">
              <ShieldCheck size={11} />
              Pago seguro con Stripe
            </div>
            <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-white leading-tight">
              {copy.title}
            </h2>
            <p className="text-[12.5px] text-white/50 mt-1">{copy.subtitle}</p>
          </div>
          <button
            onClick={close}
            aria-label="Cerrar"
            className="ml-auto p-2 -mr-2 -mt-1 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={22} className="animate-spin text-white/40" />
              <p className="text-[12.5px] text-white/40">Preparando el pago…</p>
            </div>
          )}

          {!loading && error && (
            <div className="py-10 text-center">
              <p className="text-[13px] text-red-400 mb-4">{error}</p>
              <button
                onClick={close}
                className="rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 px-5 py-2 text-[13px] font-semibold transition"
              >
                Volver
              </button>
            </div>
          )}

          {!loading && !error && clientSecret && (
            <StripeCheckoutEmbedded clientSecret={clientSecret} />
          )}
        </div>

        <div className="px-6 py-3 border-t border-white/8 text-center">
          <p className="text-[11px] text-white/30">
            Cifrado SSL · Tus datos nunca se guardan en nuestros servidores
          </p>
        </div>
      </div>
    </div>
  );
}
