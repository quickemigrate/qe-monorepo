import { motion } from "motion/react"
import { Link } from "react-router-dom"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import GlobePulse from "../landing/GlobePulse"

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: 0.4 + i * 0.15,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  }),
}

interface HeroGeometricProps {
  badge?: string
  title1?: string
  title2?: string
  description?: string
  precioTexto?: string
}

function HeroGeometric({
  badge,
  title1 = "De tu país a España,",
  title2 = "sin perderte en el camino.",
  description = "Sabemos que dejar tu país da miedo. Te decimos exacto qué visado pedir, qué papeles juntar y cuánto tarda — en menos de 5 minutos.",
  precioTexto = "39€/mes",
}: HeroGeometricProps) {
  const badgeText = badge ?? `Early Access · Plan Pro · Solo ${precioTexto}`
  return (
    <div
      className="relative w-full overflow-hidden bg-[#0A0A0A] flex items-center"
      style={{
        minHeight: 'min(100dvh, 920px)',
        paddingLeft: 'clamp(20px, 3.5vw, 48px)',
        paddingRight: 'clamp(20px, 3.5vw, 48px)',
        paddingTop: 'clamp(96px, 12vh, 140px)',
        paddingBottom: 'clamp(56px, 8vh, 96px)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(110% 70% at 85% 20%, rgba(37,211,102,0.10) 0%, rgba(37,211,102,0) 55%), radial-gradient(80% 55% at 10% 95%, rgba(37,211,102,0.05) 0%, rgba(37,211,102,0) 60%), #0A0A0A',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />

      <div
        className="relative z-10 w-full mx-auto grid grid-cols-1 md:grid-cols-2 items-center"
        style={{
          maxWidth: 'min(1280px, 92vw)',
          gap: 'clamp(32px, 5vw, 64px)',
        }}
      >
        <div className="flex flex-col items-start gap-5 md:gap-6 text-left">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.04] border border-white/[0.1] backdrop-blur-sm whitespace-nowrap text-[12px] md:text-sm"
          >
            <Circle className="h-2 w-2 fill-[#25D366] animate-pulse flex-shrink-0" />
            <span className="text-white/70 tracking-wide leading-none">
              {badgeText}
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="font-bold tracking-tight leading-[1.05]"
            style={{ fontSize: 'clamp(34px, 6.2vw, 80px)' }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
              {title1}
            </span>
            <br />
            <span
              className={cn(
                "bg-clip-text text-transparent bg-gradient-to-r",
                "from-[#25D366] via-white/90 to-[#25D366]/70",
              )}
            >
              {title2}
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-white/70 leading-relaxed font-light tracking-wide"
            style={{ fontSize: 'clamp(15px, 1.4vw, 20px)', maxWidth: 'min(560px, 100%)' }}
          >
            {description}
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-start gap-3 mt-2"
          >
            <Link to="/cliente/suscripcion-pro" className="ea-btn-primary">
              Empezar con Plan Pro — {precioTexto}
              <span className="ea-arrow" aria-hidden="true">→</span>
            </Link>
            <span className="text-[12.5px] md:text-sm text-white/50 tracking-wide">
              Diagnóstico incluido · Sin permanencia · Cancela cuando quieras
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          className="relative order-first md:order-last"
        >
          <div className="absolute inset-0 -m-8 md:-m-12 rounded-full bg-[#25D366]/8 blur-3xl" />
          <GlobePulse
            className="relative w-full mx-auto"
            style={{ maxWidth: 'min(620px, 80vw)' }}
          />
        </motion.div>
      </div>
    </div>
  )
}

export { HeroGeometric }
