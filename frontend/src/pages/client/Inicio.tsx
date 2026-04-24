import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, FolderOpen, FileText, User, ArrowRight, Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
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
        ${accent
          ? 'bg-on-background border-white/8 text-white'
          : 'bg-white border-black/5 text-on-background'
        }`}
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

  // PDF viewer state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfContainerWidth, setPdfContainerWidth] = useState(560);

  const isPro = plan === 'pro' || plan === 'premium';
  const isPremium = plan === 'premium';

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
            const diagRes = await fetch(`${API}/api/diagnostico/${data.data.diagnosticoId}`);
            if (diagRes.ok) {
              const diagData = await diagRes.json();
              setDiagnostico(diagData);
            }
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

  // Load PDF blob when diagnostico is completado
  useEffect(() => {
    if (diagnostico?.estado !== 'completado' || !userData?.diagnosticoId) return;
    const loadPdf = async () => {
      setLoadingPdf(true);
      try {
        const token = await getAuth().currentUser?.getIdToken();
        const res = await fetch(`${API}/api/diagnostico/${userData.diagnosticoId}/pdf`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch {
        // silently ignore — user can still download
      } finally {
        setLoadingPdf(false);
      }
    };
    loadPdf();
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [diagnostico?.estado, userData?.diagnosticoId]);

  // Measure container width once PDF is ready
  useEffect(() => {
    if (pdfUrl && pdfContainerRef.current) {
      setPdfContainerWidth(pdfContainerRef.current.clientWidth);
    }
  }, [pdfUrl]);

  const handleDownload = async () => {
    if (!userData?.diagnosticoId) return;
    setDownloading(true);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      const res = await fetch(`${API}/api/diagnostico/${userData.diagnosticoId}/pdf`, {
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

  return (
    <ClientLayout>
      <div className="p-8 max-w-[700px]">
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

        {/* ── STARTER: sección diagnóstico ── */}
        {!loading && plan === 'starter' && (
          <div className="mb-6 space-y-4">
            {loadingUser ? (
              <div className="bg-white rounded-2xl border border-black/5 p-6 flex items-center gap-3 text-on-background/40">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-[14px]">Cargando tu diagnóstico...</span>
              </div>
            ) : !userData?.diagnosticoId ? (
              /* Sin diagnóstico — CTA */
              <div className="bg-on-background rounded-2xl p-6 text-white">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-3">
                  Paso 1 recomendado
                </div>
                <h2 className="text-[20px] font-semibold mb-2">Obtén tu Diagnóstico Migratorio IA</h2>
                <p className="text-[14px] text-white/60 mb-1 leading-[1.6]">
                  Análisis personalizado de tu caso con recomendaciones legales, checklist de documentos y plazos estimados.
                </p>
                <p className="text-[13px] text-white/40 mb-5">59€ — pago único</p>
                <Link
                  to="/diagnostico"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold
                             px-6 py-3 rounded-full text-[14px] hover:scale-105 transition-transform active:scale-95"
                >
                  Comenzar mi diagnóstico <ArrowRight size={16} />
                </Link>
              </div>
            ) : diagnostico?.estado === 'pendiente_pago' ? (
              <div className="bg-white rounded-2xl border border-black/5 p-5 flex items-center gap-3">
                <span className="inline-flex px-3 py-1 rounded-full text-[12px] font-semibold bg-orange-100 text-orange-700">
                  Pago pendiente
                </span>
                <p className="text-[13.5px] text-on-background/50">El pago no se ha confirmado aún.</p>
              </div>
            ) : diagnostico?.estado === 'procesando' ? (
              <div className="bg-white rounded-2xl border border-black/5 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 size={18} className="animate-spin text-[#25D366]" />
                  <span className="text-[15px] font-semibold text-on-background">Generando tu informe...</span>
                </div>
                <p className="text-[13px] text-on-background/50">
                  Estamos analizando tu perfil con IA. Este proceso puede tardar unos minutos.
                </p>
              </div>
            ) : diagnostico?.estado === 'completado' ? (
              <div className="bg-white rounded-2xl border border-black/5 p-6 space-y-4">
                {/* Header: badge + meta + botón descargar */}
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <span className="inline-flex px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-100 text-emerald-700 mb-2">
                      Diagnóstico completado ✓
                    </span>
                    <div className="flex flex-wrap gap-2 text-[13px] text-on-background/50">
                      {diagnostico.pais && <span>{diagnostico.pais}</span>}
                      {diagnostico.objetivo && <span>· {diagnostico.objetivo}</span>}
                      {diagnostico.creadoEn && (
                        <span>· {new Date(diagnostico.creadoEn).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 bg-on-background text-white font-semibold
                               px-4 py-2.5 rounded-xl text-[13px] hover:opacity-90 transition disabled:opacity-50"
                  >
                    {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Descargar PDF
                  </button>
                </div>

                {/* PDF viewer — solo desktop */}
                <div className="hidden sm:block" ref={pdfContainerRef}>
                  {loadingPdf && (
                    <div className="flex items-center justify-center py-8 text-on-background/40 gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-[13px]">Cargando vista previa...</span>
                    </div>
                  )}
                  {pdfUrl && (
                    <div className="overflow-auto border border-black/5 rounded-xl bg-surface-container-lowest" style={{ maxHeight: '620px' }}>
                      <Document
                        file={pdfUrl}
                        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                        loading={null}
                      >
                        <Page
                          pageNumber={pageNumber}
                          width={pdfContainerWidth || 560}
                          renderAnnotationLayer
                          renderTextLayer
                        />
                      </Document>
                    </div>
                  )}
                  {numPages > 1 && (
                    <div className="flex items-center justify-between mt-3 px-1">
                      <button
                        onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
                        disabled={pageNumber === 1}
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-on-background/50
                                   hover:text-on-background transition disabled:opacity-30"
                      >
                        <ChevronLeft size={15} /> Página anterior
                      </button>
                      <span className="text-[13px] text-on-background/40">
                        Página {pageNumber} de {numPages}
                      </span>
                      <button
                        onClick={() => setPageNumber(p => Math.min(p + 1, numPages))}
                        disabled={pageNumber === numPages}
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-on-background/50
                                   hover:text-on-background transition disabled:opacity-30"
                      >
                        Página siguiente <ChevronRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Upgrade CTA */}
            <div className="bg-white rounded-2xl border border-black/5 p-5">
              <h3 className="text-[15px] font-semibold text-on-background mb-2">¿Quieres más ayuda con tu proceso?</h3>
              <ul className="text-[13.5px] text-on-background/60 space-y-1 mb-4">
                <li>✅ Chat con IA especializada en inmigración</li>
                <li>✅ Gestión y seguimiento de documentos</li>
                <li>✅ Seguimiento personalizado de tu caso</li>
              </ul>
              <Link
                to="/cliente/plan"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-container hover:opacity-80 transition"
              >
                Ver planes <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* ── PRO / PREMIUM: barra de mensajes ── */}
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

        {/* ── Accesos rápidos (siempre) ── */}
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-3">
          Acceso rápido
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickCard
            icon={User}
            title="Mi Perfil"
            description="Gestiona tu cuenta y datos personales"
            to="/cliente/perfil"
          />

          {isPro && (
            <QuickCard
              icon={MessageCircle}
              title="Asistente IA"
              description="Resuelve tus dudas sobre el proceso"
              to="/cliente/chat"
              accent
            />
          )}

          {isPro && (
            <QuickCard
              icon={FolderOpen}
              title="Mis Documentos"
              description="Sube y gestiona tu documentación"
              to="/cliente/documentos"
            />
          )}

          {isPremium && (
            <QuickCard
              icon={FileText}
              title="Mi Expediente"
              description="Sigue el estado de tu proceso migratorio"
              to="/cliente/expediente"
            />
          )}

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
    </ClientLayout>
  );
}
