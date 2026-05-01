import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer className="ea-footer">
      <div className="ea-footer-links">
        <Link to="/nosotros" className="ea-footer-link">Sobre nosotros</Link>
        <Link to="/blog" className="ea-footer-link">Blog</Link>
      </div>
      © 2026 Quick Emigrate<span className="ea-sep">·</span>quickemigrate.com<span className="ea-sep">·</span>contacto@quickemigrate.com
    </footer>
  );
}
