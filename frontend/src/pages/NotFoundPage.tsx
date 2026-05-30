import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Compass, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[520px]">
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
            <Compass size={40} strokeWidth={2.5} style={{ color: '#062810' }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-center mb-8"
        >
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#25D366] mb-3">
            Error 404
          </p>
          <h1 className="text-[30px] md:text-[36px] font-bold tracking-[-0.025em] text-white mb-4">
            Página no encontrada
          </h1>
          <p className="text-[15.5px] text-white/60 leading-[1.6]">
            La ruta que buscas no existe o fue movida. Vuelve al inicio para seguir explorando.
          </p>
          {pathname && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#111111]
                            border border-white/10 px-4 py-2 text-[13.5px] font-medium text-white/60">
              <span className="text-white/30">Ruta:</span>
              <code className="text-white/70">{pathname}</code>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => window.history.back()}
            className="flex-1 inline-flex items-center justify-center gap-2 text-center rounded-full border border-white/20 font-semibold py-3.5 text-[14.5px]
                       text-white/60 hover:border-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft size={15} />
            Atrás
          </button>
          <Link
            to="/"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full font-bold py-3.5 text-[14.5px]
                       hover:scale-[1.02] active:scale-[0.98] transition-transform"
            style={{ background: '#25D366', color: '#062810' }}
          >
            <Home size={15} />
            Ir al inicio
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
