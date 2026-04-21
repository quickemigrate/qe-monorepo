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

  const navLink = 'text-sm font-semibold text-on-background/70 hover:text-on-background transition-colors';
  const activeLink = 'text-sm font-semibold text-on-background transition-colors';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass py-3 shadow-sm' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center font-black text-on-background">
            Q
          </div>
          <span className="text-xl font-bold tracking-tight text-on-background">Quick Emigrate</span>
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
          <div className="h-4 w-px bg-on-background/10" />
          <Link
            to="/cliente/login"
            className={location.pathname.startsWith('/cliente') ? activeLink : navLink}
          >
            Acceder a mi expediente
          </Link>
          <a
            href={isHome ? '#servicios' : '/#servicios'}
            className="bg-primary-container text-on-background px-6 py-2.5 rounded-full font-bold text-sm
                       hover:scale-105 transition-transform active:scale-95 shadow-sm"
          >
            Reservar diagnóstico
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-on-background"
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
            className="absolute top-full left-0 right-0 bg-white border-t border-on-background/5 p-6 md:hidden shadow-xl"
          >
            <div className="flex flex-col gap-5">
              {isHome ? (
                <>
                  <a href="#soluciones" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-background">Soluciones</a>
                  <a href="#servicios" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-background">Servicios</a>
                  <a href="#contacto" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-background">Contacto</a>
                </>
              ) : (
                <Link to="/" className="text-lg font-medium text-on-background">Inicio</Link>
              )}
              <Link to="/nosotros" className="text-lg font-medium text-on-background">Nosotros</Link>
              <Link to="/blog" className="text-lg font-medium text-on-background">Blog</Link>
              <hr className="border-on-background/5" />
              <Link to="/cliente/login" className="text-lg font-medium text-on-background">
                Acceder a mi expediente
              </Link>
              <a
                href={isHome ? '#servicios' : '/#servicios'}
                onClick={() => setMobileMenuOpen(false)}
                className="bg-primary-container text-on-background px-6 py-4 rounded-full font-bold text-center"
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
