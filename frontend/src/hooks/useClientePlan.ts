import { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';

export function useClientePlan() {
  const [plan, setPlan] = useState<'free' | 'starter' | 'pro' | 'premium' | null>(null);
  const [mensajesUsados, setMensajesUsados] = useState(0);
  const [mensajesLimit, setMensajesLimit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstado = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setError('no-auth'); return; }
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/chat/estado`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError('http-' + res.status); return; }
      const data = await res.json();
      if (data.success) {
        setPlan(data.data.plan);
        setMensajesUsados(data.data.mensajesUsados);
        setMensajesLimit(data.data.mensajesLimit);
      } else {
        setError(data.error || 'unknown');
      }
    } catch (e) {
      console.error(e);
      setError('network');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEstado(); }, [fetchEstado]);

  return { plan, mensajesUsados, mensajesLimit, loading, error, refetch: fetchEstado };
}
