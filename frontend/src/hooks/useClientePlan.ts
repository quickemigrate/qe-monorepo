import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

export function useClientePlan() {
  const [plan, setPlan] = useState<'free' | 'starter' | 'pro' | 'premium' | null>(null);
  const [mensajesUsados, setMensajesUsados] = useState(0);
  const [mensajesLimit, setMensajesLimit] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEstado() {
      try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/chat/estado`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setPlan(data.data.plan);
          setMensajesUsados(data.data.mensajesUsados);
          setMensajesLimit(data.data.mensajesLimit);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchEstado();
  }, []);

  return { plan, mensajesUsados, mensajesLimit, loading };
}
