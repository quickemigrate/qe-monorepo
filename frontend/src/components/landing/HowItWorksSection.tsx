import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { animate, stagger } from 'animejs';

interface Props { precioTexto: string }

export default function HowItWorksSection({ precioTexto }: Props) {
  useEffect(() => {
    const el = document.getElementById('ea-timeline');
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      animate('#ea-timeline .ea-step', {
        opacity: [0, 1], translateX: [-30, 0],
        duration: 800, ease: 'outExpo', delay: stagger(140),
      });
    }, { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="ea-section" id="como">
      <div className="ea-wrap">
        <div className="ea-sec-head">
          <h2><span style={{ color: 'var(--green)' }}>Tres pasos.</span> Menos de 10 minutos.</h2>
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
  );
}
