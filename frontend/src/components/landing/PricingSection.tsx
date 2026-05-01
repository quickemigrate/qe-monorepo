import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { animate } from 'animejs';

interface Props { precioTexto: string; precioViejo: string }

export default function PricingSection({ precioTexto, precioViejo }: Props) {
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
  );
}
