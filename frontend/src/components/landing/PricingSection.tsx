import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { animate } from 'animejs';

interface Props { precioTexto: string; precioViejo: string }

export default function PricingSection({ precioTexto, precioViejo }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleDiagnostico = () => user ? navigate('/cliente/suscripcion-pro') : navigate('/cliente/login', { state: { redirect: '/cliente/suscripcion-pro' } });

  useEffect(() => {
    const el = document.getElementById('ea-price-card');
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      animate(el, { opacity: [0, 1], scale: [0.97, 1], duration: 900, ease: 'outExpo' });
    }, { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="ea-section" id="precio">
      <div className="ea-wrap">
        <div className="ea-price-card" id="ea-price-card">
          <span className="ea-price-label">Plan Pro</span>
          <div className="ea-price-old"><s>{precioViejo}</s></div>
          <div className="ea-price-now">{precioTexto}</div>
          <div className="ea-price-desc">Suscripción mensual. Cancela cuando quieras.</div>
          <ul className="ea-price-list">
            <li><span className="ea-check">✓</span>Diagnóstico Migratorio IA incluido</li>
            <li><span className="ea-check">✓</span>Informe PDF personalizado</li>
            <li><span className="ea-check">✓</span>Vía migratoria recomendada</li>
            <li><span className="ea-check">✓</span>Checklist de documentos</li>
            <li><span className="ea-check">✓</span>Asistente IA (50 mensajes/mes)</li>
            <li><span className="ea-check">✓</span>Gestión de documentos</li>
            <li><span className="ea-check">✓</span>Acceso al área de cliente</li>
          </ul>
          <button onClick={handleDiagnostico} className="ea-btn-full">
            Empezar con el Plan Pro
            <span aria-hidden="true">→</span>
          </button>
          <div className="ea-price-foot">Diagnóstico listo en menos de 5 minutos. Sin permanencia.</div>
        </div>
      </div>
    </section>
  );
}
