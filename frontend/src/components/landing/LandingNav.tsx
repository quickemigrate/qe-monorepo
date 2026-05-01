import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function LandingNav() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="ea-nav" ref={navRef}>
      <Link to="/" className="ea-logo" aria-label="Quick Emigrate">
        <img src="/logo-dark.png" alt="" aria-hidden="true" className="ea-logo-img" />
        Quick Emigrate
      </Link>
      <Link to="/diagnostico" className="ea-nav-cta">Obtener diagnóstico</Link>
    </nav>
  );
}
