import { useEffect, useState } from 'react';
import { Bell, BellOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNotificaciones } from '../../hooks/useNotificaciones';

const PAISES = [
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador',
  'El Salvador', 'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá',
  'Paraguay', 'Perú', 'República Dominicana', 'Uruguay', 'Venezuela',
];

const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1.5';

export default function NotificacionesPanel() {
  const { estado, error, suscripcion, loading, activar, desactivar } = useNotificaciones();
  const [paisesSel, setPaisesSel] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (suscripcion?.paises) setPaisesSel(suscripcion.paises);
  }, [suscripcion]);

  const togglePais = (p: string) => {
    setPaisesSel(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleActivar = async () => {
    setFeedback(null);
    if (paisesSel.length === 0) {
      setFeedback({ tipo: 'error', msg: 'Selecciona al menos un país.' });
      return;
    }
    setWorking(true);
    const ok = await activar(paisesSel);
    setWorking(false);
    setFeedback(ok
      ? { tipo: 'success', msg: 'Notificaciones activadas. Te avisaremos de cambios normativos relevantes.' }
      : { tipo: 'error', msg: error || 'No se pudieron activar. Verifica permisos del navegador.' }
    );
  };

  const handleDesactivar = async () => {
    setFeedback(null);
    setWorking(true);
    const ok = await desactivar();
    setWorking(false);
    setFeedback(ok
      ? { tipo: 'success', msg: 'Notificaciones desactivadas.' }
      : { tipo: 'error', msg: 'No se pudieron desactivar. Inténtalo de nuevo.' }
    );
  };

  if (loading) {
    return (
      <div className="qe-card rounded-2xl p-5 md:p-6">
        <div className="text-[14px] text-white/40">Cargando preferencias de notificaciones...</div>
      </div>
    );
  }

  if (estado === 'unsupported') {
    return (
      <div className="qe-card rounded-2xl p-5 md:p-6">
        <h2 className="text-[15px] font-semibold text-white mb-1 flex items-center gap-2">
          <BellOff size={15} className="text-white/50" />
          Notificaciones
        </h2>
        <p className="text-[12.5px] text-white/40">
          Tu navegador no soporta notificaciones push. Prueba en Chrome/Firefox/Edge en escritorio.
        </p>
      </div>
    );
  }

  const activo = suscripcion?.activo;

  return (
    <div className="qe-card rounded-2xl p-5 md:p-6">
      <h2 className="text-[15px] font-semibold text-white mb-1 flex items-center gap-2">
        <Bell size={15} className="text-white/50" />
        Notificaciones de normativa
      </h2>
      <p className="text-[12.5px] text-white/40 mb-4 leading-[1.55]">
        Recibe avisos cuando cambie la normativa de inmigración del/los países que te interesan.
        Sin spam, solo cambios relevantes.
      </p>

      {feedback && (
        <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13px] font-medium border mb-4
          ${feedback.tipo === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
          {feedback.tipo === 'success' ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {estado === 'denied' && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-4 text-[12.5px] text-amber-300">
          Has bloqueado las notificaciones en este navegador. Habilítalas desde la configuración del sitio
          (icono al lado de la URL) para recibir avisos.
        </div>
      )}

      <div className="mb-5">
        <p className={labelCls}>Países de interés</p>
        <div className="flex flex-wrap gap-2">
          {PAISES.map(p => {
            const active = paisesSel.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePais(p)}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition border
                  ${active
                    ? 'bg-[#25D366] border-[#25D366] text-[#062810]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/25 hover:text-white'
                  }`}
              >
                {active ? '✓ ' : ''}{p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={handleActivar}
          disabled={working || estado === 'denied'}
          className="flex-1 rounded-xl bg-[#25D366] text-[#062810] font-semibold py-3 text-[13.5px]
                     hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50"
        >
          {working
            ? 'Procesando...'
            : activo
              ? 'Actualizar países'
              : 'Activar notificaciones'}
        </button>
        {activo && (
          <button
            onClick={handleDesactivar}
            disabled={working}
            className="rounded-xl border border-white/15 text-white/70 font-semibold py-3 px-4 text-[13.5px]
                       hover:bg-white/5 transition disabled:opacity-50"
          >
            Desactivar
          </button>
        )}
      </div>

      {!import.meta.env.VITE_FIREBASE_VAPID_KEY && (
        <p className="mt-3 text-[11px] text-amber-300/70">
          Configuración pendiente: añade <code className="bg-white/8 px-1 rounded">VITE_FIREBASE_VAPID_KEY</code> en
          el entorno de Vercel para que las notificaciones funcionen.
        </p>
      )}
    </div>
  );
}
