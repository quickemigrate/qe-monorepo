import { useCallback, useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export type EstadoNotif = 'idle' | 'unsupported' | 'denied' | 'granted' | 'pending' | 'error';

interface Suscripcion {
  paises: string[];
  activo: boolean;
}

export function useNotificaciones() {
  const [estado, setEstado] = useState<EstadoNotif>('idle');
  const [error, setError] = useState<string | null>(null);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [loading, setLoading] = useState(true);

  // Estado inicial: permission + suscripción servidor
  useEffect(() => {
    (async () => {
      try {
        const supported = typeof window !== 'undefined' && 'Notification' in window && (await isSupported());
        if (!supported) { setEstado('unsupported'); setLoading(false); return; }
        if (Notification.permission === 'denied') setEstado('denied');
        else if (Notification.permission === 'granted') setEstado('granted');
        else setEstado('idle');

        const token = await getAuth().currentUser?.getIdToken();
        if (token) {
          const res = await fetch(`${API}/api/notificaciones/suscripcion`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setSuscripcion(data.data || null);
          }
        }
      } catch (e: any) {
        setError(e?.message || 'unknown');
        setEstado('error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sendConfigToSW = useCallback(async (registration: ServiceWorkerRegistration) => {
    const tryPost = (sw: ServiceWorker | null) => {
      if (sw) sw.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig });
    };
    tryPost(registration.active);
    tryPost(registration.waiting);
    tryPost(registration.installing);
  }, []);

  const activar = useCallback(async (paises: string[]): Promise<boolean> => {
    setError(null);
    setEstado('pending');
    try {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        setError('VAPID key no configurada (VITE_FIREBASE_VAPID_KEY).');
        setEstado('error');
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setEstado(permission === 'denied' ? 'denied' : 'idle');
        return false;
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
      await sendConfigToSW(registration);

      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const messaging = getMessaging(app);
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
      if (!token) {
        setError('No se pudo obtener el token de notificaciones.');
        setEstado('error');
        return false;
      }

      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) { setError('Sesión no válida.'); setEstado('error'); return false; }

      const res = await fetch(`${API}/api/notificaciones/suscribir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ token, paises }),
      });
      if (!res.ok) { setError('Error guardando suscripción.'); setEstado('error'); return false; }

      setSuscripcion({ paises, activo: true });
      setEstado('granted');
      return true;
    } catch (e: any) {
      setError(e?.message || 'unknown');
      setEstado('error');
      return false;
    }
  }, [sendConfigToSW]);

  const desactivar = useCallback(async (): Promise<boolean> => {
    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      if (!idToken) return false;
      const res = await fetch(`${API}/api/notificaciones/suscripcion`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) return false;
      setSuscripcion(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { estado, error, suscripcion, loading, activar, desactivar };
}
