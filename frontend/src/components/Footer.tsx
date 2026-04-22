import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

const Footer = () => (
  <footer className="bg-surface-container-low pt-20 pb-10 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
        <div className="max-w-xs">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <img src="/logo-light.png" alt="Quick Emigrate" className="h-8 w-auto" />
            <span className="text-xl font-bold tracking-tight text-on-background">Quick Emigrate</span>
          </Link>
          <p className="text-on-background/60 font-medium">
            La guía definitiva para tu emigración a España. Claridad, orden y éxito en tus trámites de visado.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-8">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-on-background">Servicios</h4>
            <div className="flex flex-col gap-2 text-on-background/60 font-medium">
              <a href="/#servicios" className="hover:text-primary-container transition-colors">Diagnóstico</a>
              <a href="/#servicios" className="hover:text-primary-container transition-colors">Estudios</a>
              <a href="/#servicios" className="hover:text-primary-container transition-colors">No Lucrativo</a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-on-background">Compañía</h4>
            <div className="flex flex-col gap-2 text-on-background/60 font-medium">
              <Link to="/nosotros" className="hover:text-primary-container transition-colors">Sobre nosotros</Link>
              <Link to="/blog" className="hover:text-primary-container transition-colors">Blog</Link>
              <a href="/#contacto" className="hover:text-primary-container transition-colors">Contacto</a>
              <a href="#" className="hover:text-primary-container transition-colors">Login</a>
            </div>
          </div>

          <div className="space-y-4 col-span-2 md:col-span-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-on-background">Legal</h4>
            <div className="flex flex-col gap-2 text-on-background/60 font-medium text-sm">
              <a href="#" className="hover:text-primary-container transition-colors">Términos de Servicio</a>
              <a href="#" className="hover:text-primary-container transition-colors">Privacidad</a>
              <a href="#" className="hover:text-primary-container transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-on-background/5 text-on-background/40 text-xs font-bold uppercase tracking-widest">
        <div>© 2026 Quick Emigrate. Todos los derechos reservados.</div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-on-background transition-colors flex items-center gap-1">
            LinkedIn <ExternalLink size={12} />
          </a>
          <a href="#" className="hover:text-on-background transition-colors flex items-center gap-1">
            Instagram <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
