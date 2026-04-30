import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, MessageCircle, FolderOpen, FileText, Settings, Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useClientePlan } from '../../hooks/useClientePlan';
import { usePreferencias, TEMAS } from '../../hooks/usePreferencias';

const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter', pro: 'Pro', premium: 'Premium',
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, loading: loadingPlan } = useClientePlan();
  const { tema } = usePreferencias();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/cliente/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const isPro = plan === 'pro' || plan === 'premium';
  const isPremium = plan === 'premium';

  const navItems = [
    { icon: Home,          label: 'Inicio',         path: '/cliente/inicio',     show: true },
    { icon: MessageCircle, label: 'Asistente IA',   path: '/cliente/chat',       show: isPro },
    { icon: FolderOpen,    label: 'Mis Documentos', path: '/cliente/documentos', show: isPro },
    { icon: FileText,      label: 'Mi Expediente',  path: '/cliente/expediente', show: isPremium },
  ].filter(i => i.show || loadingPlan);

  const t = TEMAS[tema.id];
  const textFull    = t.isDark ? 'text-white'    : 'text-slate-800';
  const textMuted   = t.isDark ? 'text-white/50' : 'text-slate-500';
  const hoverText   = t.isDark ? 'hover:text-white'    : 'hover:text-slate-900';
  const hoverBg     = t.isDark ? 'hover:bg-white/6'    : 'hover:bg-black/5';
  const overlayBg   = t.isDark ? 'bg-black/60' : 'bg-black/30';

  const navItemCls = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${textMuted} ${hoverText} ${hoverBg}`;

  const planBadgeStyle = t.isDark
    ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
    : { background: 'rgba(0,0,0,0.06)', color: 'rgba(15,23,42,0.5)' };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: t.main }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className={`fixed inset-0 z-20 lg:hidden ${overlayBg}`}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[220px] flex flex-col z-30
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ backgroundColor: t.sidebar }}
      >
        {/* Logo */}
        <div
          className="px-5 py-6 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${t.sidebarBorder}` }}
        >
          <Link to="/cliente/inicio" className="flex items-center gap-2.5" onClick={closeSidebar}>
            <img src={t.logo} alt="Quick Emigrate" className="h-8 w-auto" />
            <span className={`font-bold tracking-tight text-[15px] ${textFull}`}>
              Quick Emigrate
            </span>
          </Link>
          <button onClick={closeSidebar} className={`lg:hidden transition-colors p-1 ${textMuted} ${hoverText}`}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {!loadingPlan && navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={closeSidebar}
                className={active
                  ? `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium ${textFull}`
                  : navItemCls
                }
                style={active ? {
                  backgroundColor: t.activeItemBg,
                  borderLeft: `2px solid ${t.accent}`,
                  paddingLeft: '10px',
                } : {}}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
          {loadingPlan && (
            <div className="px-3 py-2.5 space-y-2">
              {[1, 2].map(i => (
                <div
                  key={i}
                  className="h-9 rounded-xl animate-pulse"
                  style={{ backgroundColor: t.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                />
              ))}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div
          className="px-3 py-4"
          style={{ borderTop: `1px solid ${t.sidebarBorder}` }}
        >
          <Link
            to="/cliente/perfil"
            onClick={closeSidebar}
            className={location.pathname === '/cliente/perfil'
              ? `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium mb-1 ${textFull}`
              : `${navItemCls} mb-1`
            }
            style={location.pathname === '/cliente/perfil' ? {
              backgroundColor: t.activeItemBg,
              borderLeft: `2px solid ${t.accent}`,
              paddingLeft: '10px',
            } : {}}
          >
            <Settings size={17} />
            <span>Mi Perfil</span>
            {!loadingPlan && plan && (
              <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-md" style={planBadgeStyle}>
                {PLAN_LABEL[plan]}
              </span>
            )}
          </Link>

          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${textMuted} ${hoverText} ${hoverBg}`}
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:ml-[220px] flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-10 shrink-0"
          style={{ backgroundColor: t.sidebar }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className={`transition-colors p-1 ${textMuted} ${hoverText}`}
          >
            <Menu size={22} />
          </button>
          <Link to="/cliente/inicio" className="flex items-center gap-2">
            <img src={t.logo} alt="Quick Emigrate" className="h-7 w-auto" />
            <span className={`font-bold tracking-tight text-[14px] ${textFull}`}>
              Quick Emigrate
            </span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ backgroundColor: t.main }}>
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
