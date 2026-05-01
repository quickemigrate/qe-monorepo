import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Menu } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLink = 'text-sm font-semibold text-white/60 hover:text-white transition-colors';
  const activeLink = 'text-sm font-semibold text-white transition-colors';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo-dark.png" alt="Quick Emigrate" className="h-8 w-auto" />
          <span className="text-xl font-bold tracking-tight text-white">Quick Emigrate</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {isHome ? (
            <>
              <a href="#soluciones" className={navLink}>Soluciones</a>
              <a href="#servicios" className={navLink}>Servicios</a>
              <a href="#contacto" className={navLink}>Contacto</a>
            </>
          ) : (
            <Link to="/" className={navLink}>Inicio</Link>
          )}
          <Link
            to="/nosotros"
            className={location.pathname === '/nosotros' ? activeLink : navLink}
          >
            Nosotros
          </Link>
          <Link
            to="/blog"
            className={location.pathname.startsWith('/blog') ? activeLink : navLink}
          >
            Blog
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <Link
            to="/cliente/login"
            className={location.pathname.startsWith('/cliente') ? activeLink : navLink}
          >
            Acceder a mi expediente
          </Link>
          <a
            href={isHome ? '#servicios' : '/#servicios'}
            className="bg-[#25D366] text-[#062810] px-6 py-2.5 rounded-full font-bold text-sm
                       hover:bg-[#2adc6c] hover:scale-105 transition-all active:scale-95"
          >
            Reservar diagnóstico
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menú"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-[#0F0F0F] border-t border-white/10 p-6 md:hidden shadow-xl"
          >
            <div className="flex flex-col gap-5">
              {isHome ? (
                <>
                  <a href="#soluciones" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-white">Soluciones</a>
                  <a href="#servicios" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-white">Servicios</a>
                  <a href="#contacto" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-white">Contacto</a>
                </>
              ) : (
                <Link to="/" className="text-lg font-medium text-white">Inicio</Link>
              )}
              <Link to="/nosotros" className="text-lg font-medium text-white">Nosotros</Link>
              <Link to="/blog" className="text-lg font-medium text-white">Blog</Link>
              <hr className="border-white/10" />
              <Link to="/cliente/login" className="text-lg font-medium text-white">
                Acceder a mi expediente
              </Link>
              <a
                href={isHome ? '#servicios' : '/#servicios'}
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#25D366] text-[#062810] px-6 py-4 rounded-full font-bold text-center hover:bg-[#2adc6c] transition-colors"
              >
                Reservar diagnóstico
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
