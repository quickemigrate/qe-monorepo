import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const CACHE_KEY = 'qe_planes_cache';
const CACHE_TTL = 5 * 60 * 1000;

export interface PlanCMS {
  id: string;
  nombre: string;
  precio: number | null;
  precioTexto: string;
  tipo: string;
  descripcion: string;
  features: string[];
  activo: boolean;
  orden: number;
}

export function usePlanes() {
  const [planes, setPlanes] = useState<PlanCMS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setPlanes(data);
          setLoading(false);
          return;
        }
      } catch { /* invalid cache, refetch */ }
    }

    fetch(`${API}/api/config/planes`)
      .then(r => r.json())
      .then(({ planes: data }) => {
        setPlanes(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      })
      .catch(() => setError('Error cargando planes'))
      .finally(() => setLoading(false));
  }, []);

  return { planes, loading, error };
}
