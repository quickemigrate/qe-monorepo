import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const KEY = 'qe_cookie_consent';

type Consent = { accepted: boolean; date: string };

export function getCookieConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true);
  }, []);

  const decide = (accepted: boolean) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ accepted, date: new Date().toISOString() }));
    } catch {
      // localStorage disabled — banner will show again next visit
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-[420px] z-[60]
                 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-[14.5px] font-semibold text-white mb-1.5">Tu privacidad nos importa</h2>
          <p className="text-[12.5px] text-white/55 leading-[1.55]">
            Usamos cookies técnicas para que el login y los pagos funcionen, y analítica anonimizada para
            mejorar el servicio. No vendemos tus datos.{' '}
            <Link to="/legal/cookies" className="text-[#25D366] hover:opacity-80 underline underline-offset-2">
              Más información
            </Link>
            .
          </p>
        </div>
        <button
          onClick={() => decide(false)}
          aria-label="Rechazar"
          className="text-white/30 hover:text-white shrink-0 -mt-1 -mr-1 p-1"
        >
          <X size={15} />
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => decide(false)}
          className="flex-1 rounded-xl border border-white/15 text-white/70 font-semibold py-2.5 text-[13px]
                     hover:bg-white/5 transition"
        >
          Solo esenciales
        </button>
        <button
          onClick={() => decide(true)}
          className="flex-1 rounded-xl bg-[#25D366] text-[#062810] font-bold py-2.5 text-[13px]
                     hover:bg-[#2adc6c] transition"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
