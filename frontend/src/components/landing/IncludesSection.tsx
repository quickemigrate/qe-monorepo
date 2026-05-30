import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ClipboardCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { animate, stagger } from 'animejs';

interface Props { precioTexto: string }

export default function IncludesSection({ precioTexto }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleDiagnostico = () => user ? navigate('/cliente/suscripcion-pro') : navigate('/cliente/login', { state: { redirect: '/cliente/suscripcion-pro' } });

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
          <p>Nada genérico. Solo lo que aplica a tu caso.</p>
        </div>
        <div className="ea-cards" id="ea-cards">
          <article className="ea-card">
            <div className="ea-icon" aria-hidden="true"><MapPin size={20} strokeWidth={2} /></div>
            <h3>Tu visado exacto</h3>
            <p>Te decimos qué visado pedir, sin lista de 10 opciones. Una recomendación concreta para tu situación.</p>
          </article>
          <article className="ea-card">
            <div className="ea-icon" aria-hidden="true"><ClipboardCheck size={20} strokeWidth={2} /></div>
            <h3>Tus papeles, en orden</h3>
            <p>Qué documentos juntar, en qué orden y cuánto tarda cada uno. Sin sorpresas a última hora.</p>
          </article>
          <article className="ea-card">
            <div className="ea-icon" aria-hidden="true"><Sparkles size={20} strokeWidth={2} /></div>
            <h3>Tus opciones reales</h3>
            <p>Un porcentaje honesto basado en tu caso. Te decimos qué suma, qué resta y qué puedes mejorar.</p>
          </article>
        </div>
        <div className="ea-sec-cta">
          <button onClick={handleDiagnostico} className="ea-btn-primary">
            Empezar con Plan Pro — {precioTexto}
            <span className="ea-arrow" aria-hidden="true">→</span>
          </button>
          <div className="ea-sec-cta-note">Diagnóstico incluido · Sin permanencia · Cancela cuando quieras</div>
        </div>
      </div>
    </section>
  );
}
