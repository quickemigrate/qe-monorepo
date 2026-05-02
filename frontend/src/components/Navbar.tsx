import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Menu } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Sobre nosotros', to: '/nosotros' },
  { label: 'Blog', to: '/blog' },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDiagnostico = () => {
    if (user) {
      navigate('/diagnostico');
    } else {
      navigate('/cliente/login', { state: { redirect: '/diagnostico' } });
    }
  };

  const registerTo = { pathname: '/cliente/login' };
  const registerState = { mode: 'register' };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-250 ${
        isScrolled
          ? 'bg-[#0A0A0A]/72 backdrop-blur-[12px] border-b border-white/7 py-3.5'
          : 'bg-transparent py-[18px]'
      }`}
    >
      <div className="w-full px-6 md:px-8 grid grid-cols-3 items-center">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-[9px]">
          <img src="/logo-dark.png" alt="Quick Emigrate" className="h-[26px] w-auto" />
          <span className="text-[17px] font-extrabold tracking-[-0.02em] text-white">Quick Emigrate</span>
        </Link>

        {/* Desktop center nav */}
        <div className="hidden md:flex items-center justify-center gap-8">
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`text-[14px] font-medium transition-colors ${
                isActive(to) ? 'text-white' : 'text-white/55 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right / Mobile toggle */}
        <div className="flex items-center justify-end gap-4">
          <Link
            to="/cliente/login"
            className="hidden md:block text-[13.5px] font-medium text-white/50 hover:text-white transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            to={registerTo}
            state={registerState}
            className="hidden md:block px-[18px] py-[10px] rounded-full border border-[#25D366]/45 text-[#25D366]
                       text-[14px] font-medium bg-transparent
                       hover:bg-[#25D366]/8 hover:border-[#25D366] hover:-translate-y-px
                       transition-all duration-200"
          >
            Registrarse
          </Link>
          <button
            className="md:hidden text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menú"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-[12px]
                       border-t border-white/7 px-6 py-6 md:hidden"
          >
            <div className="flex flex-col gap-5">
              {NAV_LINKS.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-[17px] font-medium transition-colors ${
                    isActive(to) ? 'text-white' : 'text-white/60'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <hr className="border-white/10" />
              <Link to="/cliente/login" className="text-[16px] font-medium text-white/60">
                Iniciar sesión
              </Link>
              <Link
                to={registerTo}
                state={registerState}
                className="border border-[#25D366]/45 text-[#25D366] px-6 py-4 rounded-full
                           font-medium text-center text-[15px] hover:bg-[#25D366]/8 transition-colors"
              >
                Registrarse
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
