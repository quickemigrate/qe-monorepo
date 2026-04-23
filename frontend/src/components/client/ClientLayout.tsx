import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, MessageCircle, FolderOpen, FileText, Settings } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useClientePlan } from '../../hooks/useClientePlan';

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-white/10 text-white/50',
  pro:     'bg-blue-500/20 text-blue-300',
  premium: 'bg-amber-500/20 text-amber-300',
};

const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter',
  pro:     'Pro',
  premium: 'Premium',
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, loading: loadingPlan } = useClientePlan();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/cliente/login');
  };

  const isPro = plan === 'pro' || plan === 'premium';
  const isPremium = plan === 'premium';

  const navItems = [
    { icon: Home,          label: 'Inicio',          path: '/cliente/inicio',     show: true },
    { icon: MessageCircle, label: 'Asistente IA',    path: '/cliente/chat',       show: isPro },
    { icon: FolderOpen,    label: 'Mis Documentos',  path: '/cliente/documentos', show: isPro },
    { icon: FileText,      label: 'Mi Expediente',   path: '/cliente/expediente', show: isPremium },
  ].filter(i => i.show || loadingPlan);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-[220px] bg-on-background flex flex-col z-40">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/8">
          <Link to="/cliente/inicio" className="flex items-center gap-2.5">
            <img src="/logo-dark.png" alt="Quick Emigrate" className="h-8 w-auto" />
            <span className="text-white font-bold tracking-tight text-[15px]">Quick Emigrate</span>
          </Link>
        </div>

        {/* Nav principal */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {!loadingPlan && navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors
                  ${active
                    ? 'bg-white/12 text-white border-l-2 border-[#25D366] pl-[10px]'
                    : 'text-white/50 hover:text-white hover:bg-white/6'
                  }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
          {loadingPlan && (
            <div className="px-3 py-2.5 space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-9 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}
        </nav>

        {/* Parte inferior: plan badge + settings + logout */}
        <div className="px-3 py-4 border-t border-white/8">
          {/* Settings (Mi Perfil) con badge del plan */}
          <Link
            to="/cliente/perfil"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors mb-1
              ${location.pathname === '/cliente/perfil'
                ? 'bg-white/12 text-white border-l-2 border-[#25D366] pl-[10px]'
                : 'text-white/50 hover:text-white hover:bg-white/6'
              }`}
          >
            <Settings size={17} />
            <span>Mi Perfil</span>
            {!loadingPlan && plan && (
              <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-md ${PLAN_BADGE[plan]}`}>
                {PLAN_LABEL[plan]}
              </span>
            )}
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
                       text-white/50 hover:text-white hover:bg-white/6 transition-colors"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-[220px] flex-1 min-h-screen bg-surface-container-low">
        {children}
      </main>
    </div>
  );
}
