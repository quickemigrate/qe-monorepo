import { useEffect, useState } from 'react';
import { Clock, CheckCircle2, FileText, AlertCircle, Loader2, Mail } from 'lucide-react';
import ClientLayout from '../../components/client/ClientLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Expediente {
  id: string;
  nombre: string;
  email: string;
  pais: string;
  tipoVisado: string;
  estado: string;
  notas?: string;
  createdAt: string;
}

const ESTADOS = [
  { key: 'nuevo',                    label: 'Nuevo',                    color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
  { key: 'en proceso',               label: 'En proceso',               color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  { key: 'documentación pendiente',  label: 'Documentación pendiente',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  { key: 'presentado',               label: 'Presentado',               color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { key: 'aprobado',                 label: 'Aprobado',                 color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { key: 'denegado',                 label: 'Denegado',                 color: 'bg-red-100 text-red-600',       dot: 'bg-red-500' },
];

const ESTADO_BADGE: Record<string, string> = {
  'nuevo':                    'bg-gray-100 text-gray-600',
  'en proceso':               'bg-blue-100 text-blue-700',
  'documentación pendiente':  'bg-yellow-100 text-yellow-700',
  'presentado':               'bg-purple-100 text-purple-700',
  'aprobado':                 'bg-emerald-100 text-emerald-700',
  'denegado':                 'bg-red-100 text-red-600',
};

export default function ClientDashboard() {
  const { user, getToken } = useAuth();
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const nombre = user?.email?.split('@')[0] || 'cliente';

  useEffect(() => {
    const fetchExpediente = async () => {
      const token = await getToken();
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${API}/api/client/expediente`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setExpediente(data.expediente || null);
        } else if (res.status === 404) {
          setExpediente(null);
        } else {
          setFetchError(true);
        }
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchExpediente();
  }, []);

  const currentStateIndex = expediente
    ? ESTADOS.findIndex(e => e.key === expediente.estado)
    : -1;

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background">
            Hola, {nombre}
          </h1>
          <p className="text-[14px] text-on-background/50 mt-1">Bienvenido a tu área privada.</p>
        </div>

        {/* Estado del expediente */}
        <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
          <h2 className="text-[16px] font-semibold text-on-background mb-4">Estado de tu expediente</h2>

          {loading ? (
            <div className="flex items-center gap-2 text-on-background/40 text-[14px]">
              <Loader2 size={16} className="animate-spin" />
              Cargando...
            </div>
          ) : fetchError ? (
            <div className="flex items-center gap-2 text-red-500 text-[14px]">
              <AlertCircle size={16} />
              Error al cargar tu expediente. Inténtalo de nuevo más tarde.
            </div>
          ) : !expediente ? (
            <div className="flex items-start gap-3 text-on-background/60 text-[14px]">
              <Clock size={20} className="text-on-background/30 mt-0.5 shrink-0" />
              <p>Tu expediente está siendo preparado. Te contactaremos pronto.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <span className={`inline-flex px-3 py-1 rounded-full text-[13px] font-semibold ${ESTADO_BADGE[expediente.estado] || 'bg-gray-100 text-gray-500'}`}>
                  {expediente.estado}
                </span>
                <span className="text-[13px] text-on-background/50">{expediente.tipoVisado}</span>
                {expediente.pais && <span className="text-[13px] text-on-background/40">{expediente.pais}</span>}
                <span className="text-[12px] text-on-background/30 ml-auto">
                  Desde {new Date(expediente.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        {expediente && (
          <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
            <h2 className="text-[16px] font-semibold text-on-background mb-5">Progreso de tu proceso</h2>
            <div className="space-y-0">
              {ESTADOS.map((estado, i) => {
                const isCurrent = i === currentStateIndex;
                const isPast = i < currentStateIndex;
                const isDenied = expediente.estado === 'denegado';

                if (estado.key === 'denegado' && !isDenied) return null;

                return (
                  <div key={estado.key} className="flex items-start gap-3 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isCurrent
                          ? `border-current ${estado.dot.replace('bg-', 'border-')} ${estado.dot}`
                          : isPast
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-black/15 bg-white'
                      }`}>
                        {isPast && <CheckCircle2 size={14} className="text-white" />}
                        {isCurrent && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {i < ESTADOS.filter(e => e.key !== 'denegado' || isDenied).length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 ${isPast ? 'bg-emerald-200' : 'bg-black/8'}`} />
                      )}
                    </div>
                    <div className={`pb-6 ${i === ESTADOS.length - 1 ? 'pb-0' : ''}`}>
                      <span className={`text-[14px] font-medium ${
                        isCurrent ? 'text-on-background' : isPast ? 'text-on-background/60' : 'text-on-background/35'
                      }`}>
                        {estado.label}
                      </span>
                      {isCurrent && (
                        <p className="text-[12px] text-on-background/40 mt-0.5">Estado actual</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Documentos */}
        <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={18} className="text-on-background/30" />
            <h2 className="text-[16px] font-semibold text-on-background">Documentos</h2>
          </div>
          <p className="text-[13.5px] text-on-background/40 ml-9">
            Próximamente podrás subir tus documentos aquí.
          </p>
        </div>

        {/* Ayuda */}
        <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
          <h2 className="text-[16px] font-semibold text-on-background mb-1">¿Necesitas ayuda?</h2>
          <p className="text-[13.5px] text-on-background/50 mb-4">
            Nuestro equipo está disponible para resolver cualquier duda sobre tu proceso.
          </p>
          <a
            href="mailto:hola@quickemigrate.com"
            className="inline-flex items-center gap-2 bg-primary-container text-on-background font-bold
                       px-5 py-2.5 rounded-full text-[14px] hover:scale-105 transition-transform active:scale-95 shadow-sm"
          >
            <Mail size={15} />
            Contactar con el equipo
          </a>
        </div>
      </div>
    </ClientLayout>
  );
}
