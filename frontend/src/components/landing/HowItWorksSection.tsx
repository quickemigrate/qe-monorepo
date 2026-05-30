import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { animate, stagger } from 'animejs';

interface Props { precioTexto: string }

export default function HowItWorksSection({ precioTexto }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleDiagnostico = () => user ? navigate('/cliente/suscripcion-pro') : navigate('/cliente/login', { state: { redirect: '/cliente/suscripcion-pro' } });

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
    <section className="ea-section" id="como" style={{ background: '#13110E' }}>
      <div className="ea-wrap">
        <div className="ea-sec-head">
          <h2><span style={{ color: 'var(--green)' }}>Tres pasos.</span> Menos de 10 minutos.</h2>
        </div>
        <ol className="ea-timeline" id="ea-timeline">
          <li className="ea-step">
            <span className="ea-dot"></span>
            <div className="ea-num">Paso 1</div>
            <h3>Cuéntanos tu situación</h3>
            <p>Nos hablas de ti: país, objetivo, plazo y situación. Rápido, sin formularios eternos.</p>
          </li>
          <li className="ea-step">
            <span className="ea-dot"></span>
            <div className="ea-num">Paso 2</div>
            <h3>Estudiamos tu caso</h3>
            <p>Lo comparamos con la ley española de extranjería vigente a día de hoy. Mismo cuidado que con un caso real.</p>
          </li>
          <li className="ea-step">
            <span className="ea-dot"></span>
            <div className="ea-num">Paso 3</div>
            <h3>Recibes tu informe</h3>
            <p>Tu PDF personalizado, Milo resolviendo dudas y un sitio donde guardar tus papeles.</p>
          </li>
        </ol>
        <div className="ea-sec-cta">
          <button onClick={handleDiagnostico} className="ea-btn-primary">
            Empezar con Plan Pro — {precioTexto}
            <span className="ea-arrow" aria-hidden="true">→</span>
          </button>
          <div className="ea-sec-cta-note">Diagnóstico incluido · Sin permanencia · Acceso inmediato</div>
        </div>
      </div>
    </section>
  );
}
