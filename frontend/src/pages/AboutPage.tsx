import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Target, Shield, Heart, Check, ArrowRight } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 0.68, 0, 1.2] as number[] },
});

/* ─── Hero ─────────────────────────────────────────────── */
const AboutHero = () => (
  <section className="relative isolate overflow-hidden bg-[var(--ink)] text-white rounded-b-[28px]">
    <div
      className="absolute inset-0 opacity-[0.08] pointer-events-none"
      style={{
        backgroundImage:
          'linear-gradient(var(--brand) 1px, transparent 1px), linear-gradient(90deg, var(--brand) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 30% 10%, black 20%, transparent 70%)',
      }}
    />
    <div
      className="absolute -top-40 right-0 w-[520px] h-[520px] rounded-full blur-[120px] opacity-25 pointer-events-none"
      style={{ background: 'radial-gradient(circle, var(--brand), transparent 60%)' }}
    />

    <div className="mx-auto max-w-[1000px] px-6 pt-24 pb-28 md:pt-32 md:pb-36 relative text-center">
      <motion.div {...rise(0.05)}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium
                   bg-[var(--brand)]/12 text-[var(--brand)] border border-[var(--brand)]/25"
      >
        <span className="relative flex w-1.5 h-1.5">
          <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-[var(--brand)] opacity-70" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
        </span>
        Nuestra historia
      </motion.div>

      <motion.h1
        {...rise(0.15)}
        className="mt-7 font-semibold tracking-[-0.035em] leading-[1.0] text-[48px] md:text-[76px]"
      >
        Nacimos de una
        <br />
        <span className="italic font-normal text-white/85" style={{ fontFamily: "'Fraunces', serif" }}>
          injusticia{' '}
        </span>
        real
      </motion.h1>

      <motion.p {...rise(0.25)}
        className="mt-7 text-[17.5px] leading-[1.55] text-white/65 max-w-[640px] mx-auto"
      >
        Vimos de cerca cómo el talento latinoamericano choca contra muros burocráticos en España.
        Quick Emigrate existe para cambiar eso.
      </motion.p>
    </div>
  </section>
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
        <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)]">
          <span className="w-6 h-px bg-[var(--brand-ink)]/60" />
          Origin story
        </div>
        <h2 className="mt-4 text-[38px] md:text-[48px] font-semibold tracking-[-0.03em] leading-[1.05] text-[var(--ink)]">
          Dos historias que no{' '}
          <span className="italic font-normal" style={{ fontFamily: "'Fraunces', serif" }}>
            deberían repetirse
          </span>
          .
        </h2>

        <div className="mt-10 space-y-8 text-[16px] leading-[1.7] text-[var(--ink)]/75 max-w-[560px]">
          {[
            {
              label: 'Caso 1 · Argentina',
              text: (
                <>
                  Un <span className="text-[var(--ink)] font-medium">arquitecto argentino</span> llegó a
                  España con toda su carrera a cuestas. No puede ejercer porque no le convalidan el título.
                  Hoy trabaja en hostelería, mientras su expediente sigue detenido entre ministerios.
                </>
              ),
            },
            {
              label: 'Caso 2 · Nicaragua',
              text: (
                <>
                  Un <span className="text-[var(--ink)] font-medium">nicaragüense del entorno del fundador</span>{' '}
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
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--brand)]/40 rounded-full" />
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-ink)] mb-2">
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
        <div className="relative rounded-[24px] bg-[var(--ink)] text-white p-8 md:p-10 overflow-hidden">
          <div
            className="absolute -bottom-20 -right-10 w-[240px] h-[240px] rounded-full blur-[90px] opacity-30 pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--brand), transparent 60%)' }}
          />
          <div className="relative">
            <svg className="text-[var(--brand)]" width="42" height="34" viewBox="0 0 42 34" fill="currentColor">
              <path d="M9 0C4 0 0 4 0 9v16h16V9H6c0-2 2-4 4-4V0H9zm26 0c-5 0-9 4-9 9v16h16V9h-10c0-2 2-4 4-4V0h-1z" />
            </svg>
            <p className="mt-6 text-[24px] md:text-[28px] font-medium tracking-[-0.02em] leading-[1.25]">
              El problema no es la falta de talento. Es la falta de{' '}
              <span className="italic text-[var(--brand)]" style={{ fontFamily: "'Fraunces', serif" }}>
                información clara
              </span>{' '}
              y una ruta ordenada.
            </p>
            <div className="mt-7 pt-6 border-t border-white/10 flex items-center gap-3">
              <img src="/logo-dark.png" alt="Quick Emigrate" className="h-10 w-auto" />
              <div>
                <div className="text-[13px] font-semibold">Equipo Quick Emigrate</div>
                <div className="text-[12px] text-white/50">Madrid, 2026</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

/* ─── Mission ───────────────────────────────────────────── */
const Mission = () => {
  const items = [
    {
      icon: <Target size={22} />,
      title: 'Reducir incertidumbre',
      body: 'Convertimos procesos complejos en rutas claras, con plazos reales y decisiones informadas.',
    },
    {
      icon: <Shield size={22} />,
      title: 'Anticipar errores',
      body: 'Detectamos los problemas antes de que ocurran. Un expediente sólido empieza por saber dónde fallan los demás.',
    },
    {
      icon: <Heart size={22} />,
      title: 'Acompañar de verdad',
      body: 'No somos un formulario. Personas reales detrás de cada caso, cada duda y cada cita.',
    },
  ];

  return (
    <section className="bg-[var(--surface)] rounded-[28px] mx-3 md:mx-6">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <SectionHeader
          eyebrow="Nuestra misión"
          title={
            <>
              Tres decisiones que{' '}
              <span className="italic font-normal" style={{ fontFamily: "'Fraunces', serif" }}>
                nos guían
              </span>{' '}
              cada día.
            </>
          }
          sub="Todo lo que hacemos pasa por este filtro antes de llegar a ti."
        />
        <div className="mt-14 grid md:grid-cols-3 gap-4">
          {items.map((it, i) => (
            <motion.div
              key={i}
              className="relative rounded-2xl bg-white border border-black/5 p-7 tonal-lift"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="inline-grid place-items-center w-11 h-11 rounded-xl bg-[var(--brand)]/12 text-[var(--brand-ink)]">
                {it.icon}
              </div>
              <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.015em] text-[var(--ink)]">{it.title}</h3>
              <p className="mt-2 text-[14.5px] leading-[1.55] text-[var(--ink)]/65">{it.body}</p>
              <div className="mt-5 text-[12px] font-mono text-[var(--ink)]/30">0{i + 1}</div>
            </motion.div>
          ))}
        </div>
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
      dark: false,
    },
    {
      initial: 'P',
      name: 'Pablo',
      role: 'CTO · Tecnología y producto',
      bio: 'Construye la plataforma y los sistemas que hacen posible una experiencia guiada, automatizada y sin errores.',
      dark: true,
    },
  ];

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-24">
      <SectionHeader
        eyebrow="El equipo"
        title={
          <>
            Dos personas,{' '}
            <span className="italic font-normal" style={{ fontFamily: "'Fraunces', serif" }}>
              una promesa
            </span>
            .
          </>
        }
        sub="Pequeño por diseño: cada caso pasa por nosotros antes de salir."
      />
      <div className="mt-14 grid md:grid-cols-2 gap-5">
        {members.map((m, i) => (
          <motion.div
            key={m.name}
            className="relative rounded-2xl bg-white border border-black/5 p-8 md:p-10 hover:border-black/15 transition tonal-lift"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
          >
            <div className="flex items-start gap-5">
              <div
                className={`shrink-0 w-20 h-20 rounded-full grid place-items-center text-[30px] font-semibold
                            ${m.dark ? 'bg-[var(--ink)] text-white' : 'bg-[var(--brand)] text-[var(--brand-ink)]'}`}
              >
                {m.initial}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <h3 className="text-[26px] font-semibold tracking-[-0.02em] text-[var(--ink)]">{m.name}</h3>
                  <span className="text-[11px] font-mono text-[var(--ink)]/35 uppercase tracking-[0.1em]">Founder</span>
                </div>
                <div className="mt-0.5 text-[13.5px] font-medium text-[var(--brand-ink)]">{m.role}</div>
                <p className="mt-4 text-[14.5px] leading-[1.6] text-[var(--ink)]/65">{m.bio}</p>
                <div className="mt-5 pt-5 border-t border-dashed border-black/10 flex items-center gap-3">
                  <a href="#" className="text-[12px] text-[var(--ink)]/50 hover:text-[var(--ink)] transition-colors">
                    LinkedIn
                  </a>
                  <span className="text-[var(--ink)]/20">·</span>
                  <a href="#" className="text-[12px] text-[var(--ink)]/50 hover:text-[var(--ink)] transition-colors">
                    Email
                  </a>
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
    <section className="bg-[var(--surface)] rounded-[28px] mx-3 md:mx-6 mb-3 md:mb-6">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <SectionHeader
              eyebrow="Valores"
              title={
                <>
                  Lo que{' '}
                  <span className="italic font-normal" style={{ fontFamily: "'Fraunces', serif" }}>
                    no negociamos
                  </span>
                  .
                </>
              }
              sub="Cuatro principios que aplicamos incluso cuando es más fácil no hacerlo."
            />
          </div>
          <div className="md:col-span-7 space-y-3">
            {values.map((v, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-5 p-5 rounded-2xl bg-white border border-black/5"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <div className="shrink-0 grid place-items-center w-10 h-10 rounded-full bg-[var(--brand)]/15 text-[var(--brand-ink)]">
                  <Check size={18} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <h4 className="text-[17px] font-semibold tracking-[-0.015em] text-[var(--ink)]">{v.title}</h4>
                    <span className="text-[11px] font-mono text-[var(--ink)]/30">0{i + 1}</span>
                  </div>
                  <p className="mt-1 text-[14.5px] leading-[1.55] text-[var(--ink)]/60">{v.body}</p>
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
  <section className="mx-3 md:mx-6 pb-24">
    <motion.div
      className="relative overflow-hidden rounded-[28px] bg-[var(--brand)] text-[var(--brand-ink)] p-10 md:p-14"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <svg
        className="absolute -right-20 -top-20 opacity-25 pointer-events-none"
        width="340"
        height="340"
        viewBox="0 0 340 340"
        fill="none"
      >
        <circle cx="170" cy="170" r="80" stroke="#0b2014" strokeWidth="1" />
        <circle cx="170" cy="170" r="120" stroke="#0b2014" strokeWidth="1" />
        <circle cx="170" cy="170" r="160" stroke="#0b2014" strokeWidth="1" />
      </svg>
      <div className="relative grid md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-8">
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)]/70">
            <span className="w-6 h-px bg-[var(--brand-ink)]/50" />
            Primera fase activa
          </div>
          <h3 className="mt-4 text-[44px] md:text-[60px] font-semibold tracking-[-0.035em] leading-[1.02]">
            ¿Quieres ser parte
            <br />
            de los{' '}
            <span className="italic font-normal" style={{ fontFamily: "'Fraunces', serif" }}>
              primeros
            </span>
            ?
          </h3>
          <p className="mt-4 text-[16px] leading-[1.55] text-[var(--brand-ink)]/70 max-w-[540px]">
            Estamos aceptando un número limitado de casos en esta fase inicial. Empecemos por entender el tuyo.
          </p>
        </div>
        <div className="md:col-span-4 md:text-right flex md:justify-end">
          <Link
            to="/#contacto"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] text-white font-semibold px-6 py-4 text-[15.5px] hover:bg-black transition-colors"
          >
            Reservar diagnóstico
            <ArrowRight size={16} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </motion.div>
  </section>
);

/* ─── Page ──────────────────────────────────────────────── */
const AboutPage = () => (
  <div className="bg-surface-container-lowest min-h-screen font-sans pt-[72px]">
    <AboutHero />
    <OriginStory />
    <Mission />
    <Team />
    <Values />
    <AboutCta />
  </div>
);

export default AboutPage;
