import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, FileText, Percent, List, Clock, AlertTriangle, Zap } from 'lucide-react';

const INCLUYE = [
  { icon: FileText,      label: 'Vía migratoria recomendada para tu perfil' },
  { icon: Percent,       label: 'Probabilidad de éxito estimada' },
  { icon: List,          label: 'Checklist completa de documentos' },
  { icon: Clock,         label: 'Plazos estimados del proceso' },
  { icon: AlertTriangle, label: 'Riesgos específicos y cómo evitarlos' },
  { icon: Zap,           label: 'Próximos 5 pasos inmediatos' },
];

export default function DiagnosticoExitoPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const email = typeof window !== 'undefined'
    ? localStorage.getItem('diagnostico_email') || ''
    : '';

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[520px]">
        {/* Check animado */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: '#25D366' }}
          >
            <CheckCircle2 size={40} strokeWidth={2.5} style={{ color: '#062810' }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-center mb-8"
        >
          <h1 className="text-[30px] md:text-[36px] font-bold tracking-[-0.025em] text-white mb-4">
            ¡Tu diagnóstico está siendo procesado!
          </h1>
          <p className="text-[15.5px] text-white/60 leading-[1.6]">
            En unos minutos recibirás tu informe por email y podrás descargarlo desde tu área personal.
          </p>
          {email && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#111111]
                            border border-white/10 px-4 py-2 text-[13.5px] font-medium text-white/60">
              📧 {email}
            </div>
          )}
          {!email && sessionId && (
            <p className="mt-3 text-[12px] text-white/30">Referencia: {sessionId.slice(0, 20)}…</p>
          )}
        </motion.div>

        {/* Card de contenido */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#111111] rounded-[20px] border border-white/10 p-6 mb-6"
        >
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/40 mb-4">
            Tu informe incluye
          </p>
          <ul className="space-y-3">
            {INCLUYE.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: '#25D366' }}
                >
                  <Icon size={13} strokeWidth={2.5} style={{ color: '#062810' }} />
                </span>
                <span className="text-[14px] text-white/70">{label}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link
            to="/"
            className="flex-1 text-center rounded-full border border-white/20 font-semibold py-3.5 text-[14.5px]
                       text-white/60 hover:border-white/40 hover:text-white transition-colors"
          >
            Volver al inicio
          </Link>
          <Link
            to="/cliente/inicio"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full font-bold py-3.5 text-[14.5px]
                       hover:scale-[1.02] active:scale-[0.98] transition-transform"
            style={{ background: '#25D366', color: '#062810' }}
          >
            Ver mi diagnóstico
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
