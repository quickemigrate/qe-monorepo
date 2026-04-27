import { useEffect, useRef, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { animate, stagger, createTimeline } from 'animejs';
import { usePlanes } from '../hooks/usePlanes';
import '../styles/early-access.css';

const FULL_TITLE = 'Tu ruta para emigrar a España, clara desde el primer día.';

export default function EarlyAccessLanding() {
  const { planes } = usePlanes();
  const navRef = useRef<HTMLElement>(null);

  const starter = planes.find(p => p.id === 'starter');
  const precioTexto = starter?.precioTexto ?? '19€';
  const precioViejo = '59€';

  useEffect(() => {
    // NAV scroll
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 50) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Hero title — split into word spans (already in DOM via JSX)
    const tl = createTimeline({ defaults: { ease: 'outExpo' } });
    tl.add('#ea-badge', {
      opacity: [0, 1],
      translateY: [-10, 0],
      duration: 700,
    }, 0)
    .add('#ea-hero-title .ea-word', {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      delay: stagger(60),
    }, 100)
    .add('#ea-subtitle', {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 700,
    }, 400)
    .add('#ea-cta-wrap', {
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: 700,
    }, 600);

    // Pulse dot loop
    animate('#ea-pulse', {
      scale: [
        { to: 1.4, duration: 800, ease: 'inOutSine' },
        { to: 1,   duration: 800, ease: 'inOutSine' },
      ],
      opacity: [
        { to: 0.4, duration: 800, ease: 'inOutSine' },
        { to: 1,   duration: 800, ease: 'inOutSine' },
      ],
      loop: true,
    });

    // IO helper
    const observers: IntersectionObserver[] = [];
    function observe(
      els: Element[],
      fn: (el: Element) => void,
      opts: IntersectionObserverInit = { threshold: 0.18 },
    ) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); }
        });
      }, opts);
      els.forEach(el => io.observe(el));
      observers.push(io);
    }

    // Cards reveal
    const cardsWrap = document.getElementById('ea-cards');
    if (cardsWrap) {
      observe([cardsWrap], () => {
        animate('#ea-cards .ea-card', {
          opacity: [0, 1],
          translateY: [40, 0],
          duration: 800,
          ease: 'outExpo',
          delay: stagger(120),
        });
      });
    }

    // Timeline steps reveal
    const timeline = document.getElementById('ea-timeline');
    if (timeline) {
      observe([timeline], () => {
        animate('#ea-timeline .ea-step', {
          opacity: [0, 1],
          translateX: [-30, 0],
          duration: 800,
          ease: 'outExpo',
          delay: stagger(140),
        });
      });
    }

    // Price card reveal
    const priceCard = document.getElementById('ea-price-card');
    if (priceCard) {
      observe([priceCard], (el) => {
        animate(el as HTMLElement, {
          opacity: [0, 1],
          scale: [0.97, 1],
          duration: 900,
          ease: 'outExpo',
        });
      });
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      observers.forEach(io => io.disconnect());
    };
  }, []);

  const titleWords = FULL_TITLE.split(' ').map((w, i) => {
    const clean = w.replace(/[.,]/g, '');
    const isAccent = clean.toLowerCase() === 'clara';
    return (
      <Fragment key={i}>
        <span className={`ea-word${isAccent ? ' ea-accent' : ''}`}>{w}</span>
        {' '}
      </Fragment>
    );
  });

  return (
    <div className="ea-root">
      <nav className="ea-nav" ref={navRef}>
        <Link to="/" className="ea-logo" aria-label="Quick Emigrate">
          <img src="/logo-dark.png" alt="" aria-hidden="true" className="ea-logo-img" />
          Quick Emigrate
        </Link>
        <Link to="/diagnostico" className="ea-nav-cta">Obtener diagnóstico</Link>
      </nav>

      {/* HERO */}
      <section className="ea-hero">
        <div className="ea-hero-inner">
          <div className="ea-badge" id="ea-badge">
            <span className="ea-pulse" id="ea-pulse"></span>
            <span>Early Access<span className="ea-sep"> · </span>{precioTexto}<span className="ea-sep"> · </span>Plazas limitadas</span>
          </div>

          <h1 className="ea-hero-title" id="ea-hero-title">
            {titleWords}
          </h1>

          <p className="ea-subtitle" id="ea-subtitle">
            Nuestros agentes analizan tu perfil y te dicen exactamente qué visado pedir, qué documentos preparar y cuál es tu probabilidad real de éxito.
          </p>

          <div className="ea-cta-wrap" id="ea-cta-wrap">
            <Link to="/diagnostico" className="ea-btn-primary">
              Obtener mi diagnóstico — {precioTexto}
              <span className="ea-arrow" aria-hidden="true">→</span>
            </Link>
            <div className="ea-cta-note">
              Pago único<span>·</span>Sin suscripción<span>·</span>Acceso inmediato
            </div>
          </div>
        </div>
      </section>

      {/* INCLUDES */}
      <section id="incluye">
        <div className="ea-wrap">
          <div className="ea-sec-head">
            <h2>Todo lo que necesitas saber antes de salir.</h2>
            <p>Sin información genérica. Solo lo que aplica a ti.</p>
          </div>
          <div className="ea-cards" id="ea-cards">
            <article className="ea-card">
              <div className="ea-icon" aria-hidden="true">→</div>
              <h3>Vía migratoria exacta</h3>
              <p>El visado exacto para tu perfil. No una lista de 10 opciones, una recomendación concreta basada en tu situación.</p>
            </article>
            <article className="ea-card">
              <div className="ea-icon" aria-hidden="true">✓</div>
              <h3>Checklist de documentos</h3>
              <p>Qué documentos necesitas, en qué orden conseguirlos y cuánto tiempo lleva cada uno. Sin sorpresas de última hora.</p>
            </article>
            <article className="ea-card">
              <div className="ea-icon" aria-hidden="true">%</div>
              <h3>Probabilidad de éxito</h3>
              <p>Un porcentaje real basado en tu perfil. Con los factores que suman y los que restan, para que puedas mejorarlos.</p>
            </article>
          </div>
          <div className="ea-sec-cta">
            <Link to="/diagnostico" className="ea-btn-primary">
              Obtener mi diagnóstico — {precioTexto}
              <span className="ea-arrow" aria-hidden="true">→</span>
            </Link>
            <div className="ea-sec-cta-note">Pago único · Acceso inmediato</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como">
        <div className="ea-wrap">
          <div className="ea-sec-head">
            <h2>Tres pasos. Menos de 10 minutos.</h2>
          </div>
          <ol className="ea-timeline" id="ea-timeline">
            <li className="ea-step">
              <span className="ea-dot"></span>
              <div className="ea-num">Paso 1</div>
              <h3>Cuéntanos tu situación</h3>
              <p>Completas un perfil rápido: país de origen, objetivo, situación económica y plazo.</p>
            </li>
            <li className="ea-step">
              <span className="ea-dot"></span>
              <div className="ea-num">Paso 2</div>
              <h3>Nuestros agentes analizan tu caso</h3>
              <p>Cruzamos tu perfil con la normativa vigente de extranjería española actualizada a 2026.</p>
            </li>
            <li className="ea-step">
              <span className="ea-dot"></span>
              <div className="ea-num">Paso 3</div>
              <h3>Recibes tu diagnóstico</h3>
              <p>Un informe PDF personalizado en tu email con tu ruta migratoria, checklist y próximos pasos.</p>
            </li>
          </ol>
          <div className="ea-sec-cta">
            <Link to="/diagnostico" className="ea-btn-primary">
              Obtener mi diagnóstico — {precioTexto}
              <span className="ea-arrow" aria-hidden="true">→</span>
            </Link>
            <div className="ea-sec-cta-note">Pago único · Acceso inmediato</div>
          </div>
        </div>
      </section>

      {/* PRICE / FINAL CTA */}
      <section id="precio">
        <div className="ea-wrap">
          <div className="ea-price-card" id="ea-price-card">
            <span className="ea-price-label">Early Access</span>
            <div className="ea-price-old"><s>{precioViejo}</s></div>
            <div className="ea-price-now">{precioTexto}</div>
            <div className="ea-price-desc">Pago único. Sin renovaciones. Sin sorpresas.</div>

            <ul className="ea-price-list">
              <li><span className="ea-check">✓</span>Informe PDF personalizado</li>
              <li><span className="ea-check">✓</span>Vía migratoria recomendada</li>
              <li><span className="ea-check">✓</span>Checklist de documentos</li>
              <li><span className="ea-check">✓</span>Probabilidad de éxito estimada</li>
              <li><span className="ea-check">✓</span>Próximos pasos inmediatos</li>
              <li><span className="ea-check">✓</span>Acceso al área de cliente</li>
            </ul>

            <Link to="/diagnostico" className="ea-btn-full">
              Obtener mi diagnóstico ahora
              <span aria-hidden="true">→</span>
            </Link>
            <div className="ea-price-foot">Recibirás tu diagnóstico en menos de 5 minutos tras el pago.</div>
          </div>
        </div>
      </section>

      <footer className="ea-footer">
        © 2026 Quick Emigrate<span className="ea-sep">·</span>quickemigrate.com<span className="ea-sep">·</span>quickemigrate@gmail.com
      </footer>
    </div>
  );
}
