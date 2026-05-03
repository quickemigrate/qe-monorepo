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
            <h3>Recibes tu diagnóstico y accedes al área de cliente</h3>
            <p>Informe PDF personalizado, asistente IA para resolver dudas y gestión de tus documentos del proceso.</p>
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
