import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const TIMEOUT_MS = 10000;

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'complete' | 'incomplete' | 'error'>('loading');

  const check = async () => {
    setStatus('loading');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) { setStatus('incomplete'); return; }
      const res = await fetch(`${API}/api/usuarios/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.data?.perfilCompleto ? 'complete' : 'incomplete');
      } else if (res.status === 404) {
        setStatus('incomplete');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      clearTimeout(timer);
    }
  };

  useEffect(() => { check(); }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-white/40 text-[14px]">Cargando...</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-6">
        <div className="text-center max-w-[380px]">
          <div className="text-[16px] font-semibold text-white mb-2">No se pudo verificar tu cuenta</div>
          <p className="text-[13.5px] text-white/50 mb-5">Comprueba tu conexión y reintenta. Si persiste, contacta hola@quickemigrate.com.</p>
          <button onClick={check}
            className="rounded-full bg-[#25D366] text-[#062810] font-bold px-5 py-2.5 text-[13.5px] hover:bg-[#2adc6c] transition">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (status === 'incomplete') {
    return <Navigate to="/cliente/onboarding" replace />;
  }

  return <>{children}</>;
}
