import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'complete' | 'incomplete'>('loading');

  useEffect(() => {
    const check = async () => {
      try {
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) { setStatus('incomplete'); return; }
        const res = await fetch(`${API}/api/usuarios/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStatus(data.data?.perfilCompleto ? 'complete' : 'incomplete');
        } else {
          setStatus('incomplete');
        }
      } catch {
        setStatus('incomplete');
      }
    };
    check();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="text-on-background/40 text-[14px]">Cargando...</div>
      </div>
    );
  }

  if (status === 'incomplete') {
    return <Navigate to="/cliente/onboarding" replace />;
  }

  return <>{children}</>;
}
