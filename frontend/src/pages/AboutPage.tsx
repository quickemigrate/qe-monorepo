import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Target, Shield, Heart, Check, ArrowRight } from 'lucide-react';
import { AuroraBackground } from '../components/ui/aurora-background';

/* ─── Hero ─────────────────────────────────────────────── */
const AboutHero = () => (
  <AuroraBackground className="min-h-[28rem] pt-16 pb-10">
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold mb-5
                 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/25"
    >
      <span className="relative flex w-1.5 h-1.5">
        <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-[#25D366] opacity-70" />
        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[#25D366]" />
      </span>
      Nuestra historia
    </motion.div>
    <motion.h1
      initial={{ opacity: 0.5, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8, ease: "easeInOut" }}
      className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-center text-[46px] md:text-[72px] font-bold tracking-[-0.035em] leading-[1.05] text-transparent mb-4"
    >
      Nacimos de una<br />
      <span className="text-[#25D366]">injusticia real.</span>
    </motion.h1>
    <motion.p
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.55 }}
      className="text-[17px] text-white/55 leading-[1.55] text-center max-w-[580px]"
    >
      Vimos de cerca cómo el talento latinoamericano choca contra muros burocráticos en España.
      Quick Emigrate existe para cambiar eso.
    </motion.p>
  </AuroraBackground>
);

/* ─── Origin Story ──────────────────────────────────────── */
const OriginStory = () => (
  <section className="mx-auto max-w-[1200px] px-6 py-24">
    <div className="grid md:grid-cols-12 gap-10 items-start">
      <motion.div
        className="md:col-span-7"
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#25D366]">
          <span className="w-6 h-px bg-[#25D366]/60" />
          Origin story
        </div>
        <h2 className="mt-4 text-[38px] md:text-[48px] font-bold tracking-[-0.03em] leading-[1.05] text-white">
          Dos historias que no{' '}
          <span className="text-[#25D366]">deberían repetirse.</span>
        </h2>

        <div className="mt-10 space-y-8 text-[16px] leading-[1.7] text-white/70 max-w-[560px]">
          {[
            {
              label: 'Caso 1 · Argentina',
              text: (
                <>
                  Un <span className="text-white font-medium">arquitecto argentino</span> llegó a
                  España con toda su carrera a cuestas. No puede ejercer porque no le convalidan el título.
                  Hoy trabaja en hostelería, mientras su expediente sigue detenido entre ministerios.
                </>
              ),
            },
            {
              label: 'Caso 2 · Nicaragua',
              text: (
                <>
                  Un <span className="text-white font-medium">nicaragüense del entorno del fundador</span>{' '}
                  emigró y trabajó en España sorteando obstáculos que nadie le explicó. Cada trámite fue un
                  descubrimiento tardío, cada plazo una carrera contrarreloj.
                </>
              ),
            },
          ].map((c, i) => (
            <motion.div
              key={i}
              className="relative pl-6"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#25D366]/40 rounded-full" />
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#25D366] mb-2">
                {c.label}
              </div>
              <p>{c.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="md:col-span-5 md:sticky md:top-28"
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
      >
        <div className="relative rounded-[24px] bg-[#111111] border border-white/10 text-white p-8 md:p-10 overflow-hidden">
          <div className="absolute -bottom-20 -right-10 w-[240px] h-[240px] rounded-full blur-[90px] opacity-20 pointer-events-none bg-[#25D366]" />
          <div className="relative">
            <svg className="text-[#25D366]" width="42" height="34" viewBox="0 0 42 34" fill="currentColor">
              <path d="M9 0C4 0 0 4 0 9v16h16V9H6c0-2 2-4 4-4V0H9zm26 0c-5 0-9 4-9 9v16h16V9h-10c0-2 2-4 4-4V0h-1z" />
            </svg>
            <p className="mt-6 text-[24px] md:text-[28px] font-medium tracking-[-0.02em] leading-[1.25]">
              El problema no es la falta de talento. Es la falta de{' '}
              <span className="italic text-[#25D366]">información clara</span>{' '}
              y una ruta ordenada.
            </p>
            <div className="mt-7 pt-6 border-t border-white/10 flex items-center gap-3">
              <img src="/logo-dark.png" alt="Quick Emigrate" className="h-10 w-auto" />
              <div>
                <div className="text-[13px] font-semibold text-white">Equipo Quick Emigrate</div>
                <div className="text-[12px] text-white/50">España, 2026</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

/* ─── Mission (tabs) ────────────────────────────────────── */
const missionTabs = [
  {
    id: 'incertidumbre',
    label: 'Reducir incertidumbre',
    icon: <Target size={16} />,
    badge: 'Claridad',
    title: 'Convertimos burocracia en rutas claras.',
    body: 'Procesos complejos transformados en pasos accionables, con plazos reales y decisiones informadas. Siempre sabrás dónde estás y qué viene después.',
    cta: 'Ver diagnóstico',
    href: '/diagnostico',
  },
  {
    id: 'errores',
    label: 'Anticipar errores',
    icon: <Shield size={16} />,
    badge: 'Prevención',
    title: 'Detectamos problemas antes de que ocurran.',
    body: 'Un expediente sólido empieza por saber dónde fallan los demás. Revisamos tu caso antes de que pises una oficina de extranjería.',
    cta: 'Cómo funciona',
    href: '/#servicios',
  },
  {
    id: 'acompanamiento',
    label: 'Acompañar de verdad',
    icon: <Heart size={16} />,
    badge: 'Personas',
    title: 'No somos un formulario.',
    body: 'Personas reales detrás de cada caso, cada duda y cada cita. Pequeños por diseño para que ningún caso pase desapercibido.',
    cta: 'El equipo',
    href: '/nosotros',
  },
];

const Mission = () => {
  const [active, setActive] = useState(missionTabs[0].id);
  const tab = missionTabs.find(t => t.id === active)!;

  return (
    <section className="bg-[#0F0F0F] border-y border-white/8 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="text-center mb-12">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#25D366]">Nuestra misión</span>
          <h2 className="mt-3 text-[38px] md:text-[52px] font-bold tracking-[-0.03em] leading-[1.05] text-white">
            Tres decisiones que <span className="text-[#25D366]">nos guían</span> cada día.
          </h2>
          <p className="mt-4 text-white/50 text-[16px] max-w-xl mx-auto">
            Todo lo que hacemos pasa por este filtro antes de llegar a ti.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          {missionTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
                active === t.id
                  ? 'bg-[#25D366] text-[#062810]'
                  : 'bg-[#111111] border border-white/10 text-white/60 hover:text-white hover:border-white/25'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl bg-[#111111] border border-white/10 p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center"
        >
          <div className="flex flex-col gap-5">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/20 px-3 py-1 rounded-full w-fit">
              {tab.badge}
            </span>
            <h3 className="text-[30px] md:text-[40px] font-bold tracking-[-0.025em] leading-[1.1] text-white">
              {tab.title}
            </h3>
            <p className="text-white/60 text-[16px] leading-[1.65]">{tab.body}</p>
            <Link
              to={tab.href}
              className="inline-flex items-center gap-2 mt-2 w-fit rounded-full bg-[#25D366] text-[#062810] font-bold px-6 py-3 text-[14.5px] hover:bg-[#2adc6c] transition-colors"
            >
              {tab.cta}
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full max-w-[320px] aspect-square rounded-2xl bg-[#0A0A0A] border border-white/8 flex items-center justify-center">
              <div className="text-[#25D366] opacity-20">
                {missionTabs.find(t => t.id === active)?.icon &&
                  <span style={{ fontSize: 120 }}>{tab.icon}</span>}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Team ──────────────────────────────────────────────── */
const Team = () => {
  const members = [
    {
      initial: 'M',
      name: 'Manu',
      role: 'CEO · Estrategia y negocio',
      bio: 'Lidera la visión comercial y las relaciones con clientes y partners. Se asegura de que Quick Emigrate crezca con propósito.',
      green: true,
      linkedin: 'https://www.linkedin.com/in/manuelgonzalezgordillo/'
    },
    {
      initial: 'P',
      name: 'Pablo',
      role: 'CTO · Tecnología y producto',
      bio: 'Construye la plataforma y los sistemas que hacen posible una experiencia guiada, automatizada y sin errores.',
      green: false,
      linkedin: 'https://www.linkedin.com/in/pablosegundogonzalezgarcia/'
    },
  ];

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-24">
      <div className="text-center mb-14">
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#25D366]">El equipo</span>
        <h2 className="mt-3 text-[38px] md:text-[52px] font-bold tracking-[-0.03em] leading-[1.05] text-white">
          Dos personas, <span className="text-[#25D366]">una promesa.</span>
        </h2>
        <p className="mt-4 text-white/50 text-[16px] max-w-md mx-auto">
          Pequeño por diseño: cada caso pasa por nosotros antes de salir.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {members.map((m, i) => (
          <motion.div
            key={m.name}
            className="relative rounded-2xl bg-[#111111] border border-white/10 p-8 md:p-10 hover:border-[#25D366]/30 transition"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
          >
            <div className="flex items-start gap-5">
              <div
                className={`shrink-0 w-20 h-20 rounded-full grid place-items-center text-[30px] font-bold
                            ${m.green ? 'bg-[#25D366] text-[#062810]' : 'bg-white/10 text-white'}`}
              >
                {m.initial}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <h3 className="text-[26px] font-bold tracking-[-0.02em] text-white">{m.name}</h3>
                  <span className="text-[11px] font-mono text-white/30 uppercase tracking-[0.1em]">Founder</span>
                </div>
                <div className="mt-0.5 text-[13.5px] font-semibold text-[#25D366]">{m.role}</div>
                <p className="mt-4 text-[14.5px] leading-[1.6] text-white/60">{m.bio}</p>
                <div className="mt-5 pt-5 border-t border-white/10 flex items-center gap-3">
                  <a href={m.linkedin} className="text-[12px] text-white/40 hover:text-white transition-colors">LinkedIn</a>
                  <span className="text-white/20">·</span>
                  <a href="#" className="text-[12px] text-white/40 hover:text-white transition-colors">Email</a>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

/* ─── Values ────────────────────────────────────────────── */
const Values = () => {
  const values = [
    { title: 'Honestidad ante todo', body: 'Nunca prometemos lo que no podemos garantizar.' },
    { title: 'Claridad sobre complejidad', body: 'Transformamos burocracia en pasos accionables.' },
    { title: 'Acompañamiento real', body: 'No somos un formulario, somos personas.' },
    { title: 'Mejora continua', body: 'Aprendemos de cada caso para hacerlo mejor.' },
  ];

  return (
    <section className="bg-[#0F0F0F] border-t border-white/8 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#25D366]">Valores</span>
            <h2 className="mt-3 text-[38px] md:text-[48px] font-bold tracking-[-0.03em] leading-[1.05] text-white">
              Lo que <span className="text-[#25D366]">no negociamos.</span>
            </h2>
            <p className="mt-4 text-white/50 text-[16px]">
              Cuatro principios que aplicamos incluso cuando es más fácil no hacerlo.
            </p>
          </div>
          <div className="md:col-span-7 space-y-3">
            {values.map((v, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-5 p-5 rounded-2xl bg-[#111111] border border-white/10 hover:border-[#25D366]/25 transition"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <div className="shrink-0 grid place-items-center w-10 h-10 rounded-full bg-[#25D366]/15 text-[#25D366]">
                  <Check size={18} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <h4 className="text-[17px] font-semibold tracking-[-0.015em] text-white">{v.title}</h4>
                    <span className="text-[11px] font-mono text-white/25">0{i + 1}</span>
                  </div>
                  <p className="mt-1 text-[14.5px] leading-[1.55] text-white/55">{v.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── CTA ───────────────────────────────────────────────── */
const AboutCta = () => (
  <section className="mx-3 md:mx-6 py-24">
    <motion.div
      className="relative overflow-hidden rounded-[28px] bg-[#25D366] text-[#062810] p-10 md:p-14"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <svg className="absolute -right-20 -top-20 opacity-20 pointer-events-none" width="340" height="340" viewBox="0 0 340 340" fill="none">
        <circle cx="170" cy="170" r="80" stroke="#0b2014" strokeWidth="1" />
        <circle cx="170" cy="170" r="120" stroke="#0b2014" strokeWidth="1" />
        <circle cx="170" cy="170" r="160" stroke="#0b2014" strokeWidth="1" />
      </svg>
      <div className="relative grid md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-8">
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#062810]/70">
            <span className="w-6 h-px bg-[#062810]/50" />
            Primera fase activa
          </div>
          <h3 className="mt-4 text-[44px] md:text-[60px] font-bold tracking-[-0.035em] leading-[1.02]">
            ¿Quieres ser parte<br />de los primeros?
          </h3>
          <p className="mt-4 text-[16px] leading-[1.55] text-[#062810]/70 max-w-[540px]">
            Estamos aceptando un número limitado de casos en esta fase inicial. Empecemos por entender el tuyo.
          </p>
        </div>
        <div className="md:col-span-4 md:text-right flex md:justify-end">
          <Link
            to="/diagnostico"
            className="inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] text-white font-bold px-6 py-4 text-[15.5px] hover:bg-black transition-colors"
          >
            Obtener diagnóstico
            <ArrowRight size={16} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </motion.div>
  </section>
);

/* ─── Page ──────────────────────────────────────────────── */
const AboutPage = () => (
  <div className="bg-[#0A0A0A] min-h-screen font-sans pt-[72px]">
    <AboutHero />
    <OriginStory />
    <Mission />
    <Team />
    <Values />
    <AboutCta />
  </div>
);

export default AboutPage;
