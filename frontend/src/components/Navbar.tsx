import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Menu } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass py-3 shadow-sm' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center font-black text-on-background">Q</div>
          <span className="text-xl font-bold tracking-tight text-on-background">Quick Emigrate</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          <a href="#soluciones" className="text-sm font-semibold text-on-background/70 hover:text-on-background transition-colors">Soluciones</a>
          <a href="#servicios" className="text-sm font-semibold text-on-background/70 hover:text-on-background transition-colors">Servicios</a>
          <a href="#contacto" className="text-sm font-semibold text-on-background/70 hover:text-on-background transition-colors">Contacto</a>
          <div className="h-4 w-px bg-on-background/10"></div>
          <a href="#" className="text-sm font-semibold text-on-background/40 cursor-not-allowed">
            Área cliente <span className="text-xs">(próximamente)</span>
          </a>
          <a href="#servicios" className="bg-primary-container text-on-background px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform active:scale-95 shadow-sm">
            Reservar diagnóstico
          </a>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-on-background" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
            <div className="flex flex-col gap-6">
              <a href="#soluciones" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-background">Soluciones</a>
              <a href="#servicios" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-background">Servicios</a>
              <a href="#contacto" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-background">Contacto</a>
              <hr className="border-on-background/5" />
              <a href="#" className="text-lg font-medium text-on-background/40 cursor-not-allowed">
                Área cliente <span className="text-sm">(próximamente)</span>
              </a>
              <a href="#servicios" onClick={() => setMobileMenuOpen(false)} className="bg-primary-container text-on-background px-6 py-4 rounded-full font-bold text-center">
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
