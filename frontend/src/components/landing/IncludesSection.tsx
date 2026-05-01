import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { animate, stagger } from 'animejs';

interface Props { precioTexto: string }

export default function IncludesSection({ precioTexto }: Props) {
  useEffect(() => {
    const el = document.getElementById('ea-cards');
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      animate('#ea-cards .ea-card', {
        opacity: [0, 1], translateY: [40, 0],
        duration: 800, ease: 'outExpo', delay: stagger(120),
      });
    }, { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="ea-section" id="incluye">
      <div className="ea-wrap">
        <div className="ea-sec-head">
          <h2>Todo lo que necesitas saber <span style={{ color: 'var(--green)' }}>antes de salir.</span></h2>
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
  );
}
