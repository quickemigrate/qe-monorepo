import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, FolderOpen, FileText, User, ArrowRight, Loader2, Download,
  ChevronLeft, ChevronRight, Percent, List, Clock, AlertTriangle,
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ClientLayout from '../../components/client/ClientLayout';
import { useClientePlan } from '../../hooks/useClientePlan';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-600',
  pro:     'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
};
const PLAN_LABEL: Record<string, string> = {
  starter: 'Plan Starter',
  pro:     'Plan Pro',
  premium: 'Plan Premium',
};

const BENEFICIOS = [
  { icon: FileText,      label: 'Informe PDF personalizado' },
  { icon: List,          label: 'Checklist de documentos' },
  { icon: Clock,         label: 'Plazos reales estimados' },
  { icon: AlertTriangle, label: 'Alertas legales y riesgos' },
  { icon: Percent,       label: 'Probabilidad de éxito' },
];

interface CardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  to: string;
  accent?: boolean;
}

function QuickCard({ icon: Icon, title, description, to, accent }: CardProps) {
  return (
    <Link
      to={to}
      className={`group flex flex-col gap-3 p-5 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5
        ${accent ? 'bg-on-background border-white/8 text-white' : 'bg-white border-black/5 text-on-background'}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
        ${accent ? 'bg-white/10' : 'bg-surface-container-low'}`}>
        <Icon size={19} className={accent ? 'text-[#25D366]' : 'text-on-background/50'} />
      </div>
      <div>
        <div className={`text-[14.5px] font-semibold mb-0.5 ${accent ? 'text-white' : 'text-on-background'}`}>
          {title}
        </div>
        <div className={`text-[13px] leading-[1.5] ${accent ? 'text-white/50' : 'text-on-background/50'}`}>
          {description}
        </div>
      </div>
      <div className={`flex items-center gap-1 text-[12px] font-semibold mt-auto
        ${accent ? 'text-[#25D366]' : 'text-on-background/40 group-hover:text-on-background transition-colors'}`}>
        Ir ahora <ArrowRight size={13} />
      </div>
    </Link>
  );
}

export default function Inicio() {
  const { plan, mensajesUsados, mensajesLimit, loading } = useClientePlan();

  const [userData, setUserData] = useState<any>(null);
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfContainerWidth, setPdfContainerWidth] = useState(800);

  const isPro = plan === 'pro' || plan === 'premium';
  const isPremium = plan === 'premium';
  const diagnosticoId = userData?.diagnosticoId;
  const diagnosticoEstado = diagnostico?.estado;

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch(`${API}/api/usuarios/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserData(data.data);
          if (data.data?.diagnosticoId) {
            const diagRes = await fetch(`${API}/api/diagnostico/${data.data.diagnosticoId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (diagRes.ok) setDiagnostico(await diagRes.json());
          }
        }
      } catch {
        // silently ignore
      } finally {
        setLoadingUser(false);
      }
    };
    load();
  }, []);

  // Polling while procesando — se detiene automáticamente al completar
  useEffect(() => {
    if (diagnosticoEstado !== 'procesando' || !diagnosticoId) return;
    const interval = setInterval(async () => {
      try {
        const token = await getAuth().currentUser?.getIdToken();
        const res = await fetch(`${API}/api/diagnostico/${diagnosticoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.estado === 'completado') {
          setDiagnostico(data);
          clearInterval(interval);
        }
      } catch (e) {
        console.error(e);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [diagnosticoEstado, diagnosticoId]);

  // Load PDF blob when completado
  useEffect(() => {
    if (diagnosticoEstado !== 'completado' || !diagnosticoId) return;
    const loadPdf = async () => {
      setLoadingPdf(true);
      try {
        const token = await getAuth().currentUser?.getIdToken();
        const res = await fetch(`${API}/api/diagnostico/${diagnosticoId}/pdf`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        setPdfUrl(URL.createObjectURL(blob));
      } catch {
        // silently ignore — user can still download
      } finally {
        setLoadingPdf(false);
      }
    };
    loadPdf();
  }, [diagnosticoEstado, diagnosticoId]);

  // Measure PDF container once visible (right column)
  useEffect(() => {
    if (diagnosticoEstado === 'completado' && pdfContainerRef.current) {
      setPdfContainerWidth(pdfContainerRef.current.offsetWidth);
    }
  }, [diagnosticoEstado, pdfUrl]);

  const handleDownload = async () => {
    if (!diagnosticoId) return;
    setDownloading(true);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      const res = await fetch(`${API}/api/diagnostico/${diagnosticoId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagnostico-quickemigrate.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('No se pudo descargar el PDF. Inténtalo de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  const nombre = userData?.nombre || userData?.email?.split('@')[0] || 'Cliente';

  const quickCards = (
    <div>
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-3">
        Acceso rápido
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <QuickCard icon={User} title="Mi Perfil" description="Gestiona tu cuenta y datos personales" to="/cliente/perfil" />
        {isPro && <QuickCard icon={MessageCircle} title="Asistente IA" description="Resuelve tus dudas sobre el proceso" to="/cliente/chat" accent />}
        {isPro && <QuickCard icon={FolderOpen} title="Mis Documentos" description="Sube y gestiona tu documentación" to="/cliente/documentos" />}
        {isPremium && <QuickCard icon={FileText} title="Mi Expediente" description="Sigue el estado de tu proceso migratorio" to="/cliente/expediente" />}
        {!loading && !isPro && (
          <Link
            to="/cliente/plan"
            className="flex flex-col gap-3 p-5 rounded-2xl border border-dashed border-black/10
                       bg-surface-container-low text-on-background/40 hover:border-black/20 transition-all"
          >
            <div className="text-[14px] font-semibold">Desbloquea más funciones</div>
            <div className="text-[13px] leading-[1.5]">
              Con el plan Pro obtienes el Asistente IA y gestión de documentos.
            </div>
            <div className="text-[12px] font-semibold text-primary-container flex items-center gap-1 mt-auto">
              Ver planes <ArrowRight size={13} />
            </div>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <ClientLayout>
      <style>{`
        @keyframes progress-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>

      <div className="w-full h-full p-4 lg:p-6">

        {/* Saludo */}
        <div className="mb-8">
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-on-background">
            Bienvenido/a, {nombre}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-[14px] text-on-background/50">
              {plan === 'starter' ? 'Tu ruta hacia España empieza aquí' : 'Tu área privada de Quick Emigrate'}
            </p>
            {!loading && plan && (
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${PLAN_BADGE[plan]}`}>
                {PLAN_LABEL[plan]}
              </span>
            )}
          </div>
        </div>

        {/* PRO / PREMIUM: barra de mensajes */}
        {!loading && isPro && mensajesLimit > 0 && (
          <div className="bg-white rounded-2xl border border-black/5 p-5 mb-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-[13px] text-on-background/50 mb-1.5">Mensajes del Asistente IA este mes</div>
              <div className="h-1.5 rounded-full bg-black/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-container transition-all"
                  style={{ width: `${Math.min((mensajesUsados / mensajesLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[15px] font-semibold text-on-background">{mensajesUsados}</span>
              <span className="text-[13px] text-on-background/40"> / {mensajesLimit}</span>
            </div>
          </div>
        )}

        {/* STARTER: sección diagnóstico */}
        {!loading && plan === 'starter' && (
          <div className="mb-8">
            {loadingUser ? (
              <div className="bg-white rounded-2xl border border-black/5 p-6 flex items-center gap-3 text-on-background/40">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-[14px]">Cargando tu diagnóstico...</span>
              </div>
            ) : diagnosticoEstado === 'completado' ? (
              /* ── COMPLETADO: flex-row 50% + 50% ── */
              <div className="w-full flex flex-col md:flex-row gap-6" style={{ height: 'calc(100vh - 120px)' }}>

                {/* COLUMNA IZQUIERDA — 50% — cards una debajo de otra */}
                <div className="w-full md:w-1/2 flex flex-col gap-4 overflow-y-auto">

                  {/* Card 1: resumen diagnóstico */}
                  <div className="bg-on-background border border-white/8 rounded-xl p-5">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 mb-3">
                      Diagnóstico completado ✓
                    </span>
                    <div className="space-y-1 mb-4">
                      {diagnostico.pais && (
                        <div className="text-[13px] text-white/60">
                          <span className="text-white/30 text-[11px] uppercase tracking-wide mr-1.5">País</span>
                          {diagnostico.pais}
                        </div>
                      )}
                      {diagnostico.objetivo && (
                        <div className="text-[13px] text-white/60">
                          <span className="text-white/30 text-[11px] uppercase tracking-wide mr-1.5">Objetivo</span>
                          {diagnostico.objetivo}
                        </div>
                      )}
                      {diagnostico.creadoEn && (
                        <div className="text-[13px] text-white/60">
                          <span className="text-white/30 text-[11px] uppercase tracking-wide mr-1.5">Fecha</span>
                          {new Date(diagnostico.creadoEn).toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold
                                 px-4 py-2.5 rounded-lg text-[13px] hover:opacity-90 transition disabled:opacity-50"
                    >
                      {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      Descargar PDF
                    </button>
                  </div>

                  {/* Card 2: upgrade */}
                  <div className="bg-on-background border border-white/8 rounded-xl p-5 flex flex-col">
                    <h3 className="text-[14px] font-semibold text-white mb-3">¿Quieres más ayuda?</h3>
                    <ul className="text-[13px] text-white/50 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-[#25D366] font-bold shrink-0">✓</span>
                        Chat con IA especializada en inmigración
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#25D366] font-bold shrink-0">✓</span>
                        Gestión y seguimiento de documentos
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#25D366] font-bold shrink-0">✓</span>
                        Seguimiento personalizado de tu caso
                      </li>
                    </ul>
                    <Link
                      to="/cliente/plan"
                      className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#25D366] hover:opacity-80 transition"
                    >
                      Ver planes <ArrowRight size={14} />
                    </Link>
                  </div>

                  {quickCards}

                </div>

                {/* COLUMNA DERECHA — 50% — solo el PDF */}
                <div className="hidden md:flex w-1/2 flex-col bg-on-background border border-white/8 rounded-xl overflow-hidden">
                  {loadingPdf && (
                    <div className="flex-1 flex items-center justify-center gap-2 text-white/30">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-[13px]">Cargando vista previa...</span>
                    </div>
                  )}
                  {pdfUrl && (
                    <>
                      <div className="flex-1 overflow-auto" ref={pdfContainerRef}>
                        <Document
                          file={pdfUrl}
                          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                          loading={null}
                        >
                          <Page
                            pageNumber={pageNumber}
                            width={pdfContainerWidth || undefined}
                            renderAnnotationLayer
                            renderTextLayer
                          />
                        </Document>
                      </div>
                      {numPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-white/8 shrink-0">
                          <button
                            onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
                            disabled={pageNumber === 1}
                            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/40
                                       hover:text-white transition disabled:opacity-20"
                          >
                            <ChevronLeft size={15} /> Anterior
                          </button>
                          <span className="text-[13px] text-white/30">
                            {pageNumber} / {numPages}
                          </span>
                          <button
                            onClick={() => setPageNumber(p => Math.min(p + 1, numPages))}
                            disabled={pageNumber === numPages}
                            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/40
                                       hover:text-white transition disabled:opacity-20"
                          >
                            Siguiente <ChevronRight size={15} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>

            ) : (
              /* ── OTROS ESTADOS: grid 2 columnas ── */
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Columna izquierda: estado actual + acceso rápido */}
                {diagnosticoEstado === 'procesando' ? (
                  /* Procesando ocupa 2 columnas en desktop */
                  <div className="md:col-span-2 bg-white rounded-2xl border border-black/5 p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <Loader2 size={22} className="animate-spin text-[#25D366] shrink-0" />
                      <span className="text-[17px] font-semibold text-on-background">
                        Generando tu informe personalizado...
                      </span>
                    </div>
                    <p className="text-[14px] text-on-background/50 mb-6">
                      Este proceso puede tardar 1-2 minutos. La página se actualizará automáticamente.
                    </p>
                    <div className="relative h-2 rounded-full bg-black/6 overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full w-2/5 rounded-full bg-[#25D366]"
                        style={{ animation: 'progress-slide 1.5s ease-in-out infinite' }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Sin diagnóstico o pendiente pago — columna izquierda */
                  <div className="flex flex-col gap-4">
                    {!diagnosticoId ? (
                      <div className="bg-on-background rounded-2xl p-6 text-white flex flex-col">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-3">
                          Paso 1 recomendado
                        </div>
                        <h2 className="text-[20px] font-semibold mb-2">Obtén tu Diagnóstico Migratorio IA</h2>
                        <p className="text-[14px] text-white/60 leading-[1.6] mb-1">
                          Análisis personalizado con recomendaciones legales, checklist y plazos.
                        </p>
                        <p className="text-[13px] text-white/40 mb-6">59€ — pago único</p>
                        <Link
                          to="/diagnostico"
                          className="mt-auto self-start inline-flex items-center gap-2 bg-[#25D366] text-white font-bold
                                     px-6 py-3 rounded-full text-[14px] hover:scale-105 transition-transform active:scale-95"
                        >
                          Comenzar mi diagnóstico <ArrowRight size={16} />
                        </Link>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-black/5 p-5 flex items-center gap-3">
                        <span className="inline-flex px-3 py-1 rounded-full text-[12px] font-semibold bg-orange-100 text-orange-700">
                          Pago pendiente
                        </span>
                        <p className="text-[13.5px] text-on-background/50">El pago no se ha confirmado aún.</p>
                      </div>
                    )}
                    {quickCards}
                  </div>
                )}

                {/* Columna derecha: beneficios o upgrade (solo si no está procesando) */}
                {diagnosticoEstado !== 'procesando' && (
                  !diagnosticoId ? (
                    <div className="bg-white rounded-2xl border border-black/5 p-6">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-4">
                        ¿Qué incluye tu diagnóstico?
                      </div>
                      <ul className="space-y-3">
                        {BENEFICIOS.map(({ icon: Icon, label }) => (
                          <li key={label} className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#E8F8EE]">
                              <Icon size={13} strokeWidth={2.5} className="text-[#25D366]" />
                            </span>
                            <span className="text-[14px] text-on-background/70">{label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-black/5 p-6 flex flex-col">
                      <h3 className="text-[15px] font-semibold text-on-background mb-3">
                        ¿Quieres más ayuda con tu proceso?
                      </h3>
                      <ul className="text-[13.5px] text-on-background/60 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-[#25D366] font-bold shrink-0">✓</span>
                          Chat con IA especializada en inmigración
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#25D366] font-bold shrink-0">✓</span>
                          Gestión y seguimiento de documentos
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#25D366] font-bold shrink-0">✓</span>
                          Seguimiento personalizado de tu caso
                        </li>
                      </ul>
                      <Link
                        to="/cliente/plan"
                        className="mt-auto pt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-container hover:opacity-80 transition"
                      >
                        Ver planes <ArrowRight size={14} />
                      </Link>
                    </div>
                  )
                )}

                {/* Acceso rápido cuando procesando — segunda fila, columna izquierda */}
                {diagnosticoEstado === 'procesando' && (
                  <div className="flex flex-col gap-4">
                    {quickCards}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </ClientLayout>
  );
}
