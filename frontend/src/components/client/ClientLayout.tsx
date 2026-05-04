import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, MessageCircle, FolderOpen, FileText, Settings, Menu, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useClientePlan } from '../../hooks/useClientePlan';
import { usePreferencias, TEMAS } from '../../hooks/usePreferencias';
import CommandPalette from './CommandPalette';

const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter', pro: 'Pro', premium: 'Premium',
};

const COLLAPSED_KEY = 'qe_sidebar_collapsed';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, loading: loadingPlan } = useClientePlan();
  const { tema } = usePreferencias();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === 'true');
  const [paletteOpen, setPaletteOpen] = useState(false);

  // md breakpoint forces collapsed sidebar (rail 68px)
  const [mdScreen, setMdScreen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const apply = (m: { matches: boolean }) => setMdScreen(m.matches);
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const collapsed = mdScreen || userCollapsed;

  const toggleCollapse = () => {
    setUserCollapsed(prev => {
      localStorage.setItem(COLLAPSED_KEY, String(!prev));
      return !prev;
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
  const textFull  = t.isDark ? 'text-white'    : 'text-slate-800';
  const textMuted = t.isDark ? 'text-white/55' : 'text-slate-500';
  const hoverText = t.isDark ? 'hover:text-white'    : 'hover:text-slate-900';
  const hoverBg   = t.isDark ? 'hover:bg-white/6'    : 'hover:bg-black/5';
  const overlayBg = t.isDark ? 'bg-black/60' : 'bg-black/30';

  // Sidebar uses theme color but layered with glass blur
  const sidebarStyle: React.CSSProperties = t.isDark
    ? {
        background: 'rgba(20,20,20,0.55)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        borderRight: `1px solid ${t.sidebarBorder}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 40px -16px rgba(0,0,0,0.55)',
      }
    : {
        background: 'rgba(248,250,252,0.7)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        borderRight: `1px solid ${t.sidebarBorder}`,
      };

  // Width classes: mobile drawer 260, tablet rail 68 (forced), lg respects user pref
  const sidebarW = `w-[260px] md:w-[68px] ${userCollapsed ? 'lg:w-[68px]' : 'lg:w-[220px]'}`;
  const mainML   = `md:ml-[68px] ${userCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[220px]'}`;

  const navItemBase = `flex items-center rounded-xl text-[14px] font-medium transition-colors ${textMuted} ${hoverText} ${hoverBg}`;
  const navItemCls  = collapsed ? `${navItemBase} justify-center w-10 h-10 mx-auto` : `${navItemBase} gap-3 px-3 py-2.5`;

  const planBadgeStyle = t.isDark
    ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
    : { background: 'rgba(0,0,0,0.06)', color: 'rgba(15,23,42,0.5)' };

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden" style={{ backgroundColor: t.main }}>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Mobile overlay (md+ no overlay porque rail visible) */}
      {sidebarOpen && (
        <div className={`fixed inset-0 z-20 backdrop-blur-sm md:hidden ${overlayBg}`} onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full ${sidebarW} flex flex-col z-30
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={sidebarStyle}
      >
        {/* Logo */}
        <div
          className={`flex items-center py-5 lg:py-6 ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}
          style={{ borderBottom: `1px solid ${t.sidebarBorder}` }}
        >
          {!collapsed && (
            <Link to="/cliente/inicio" className="flex items-center gap-2.5" onClick={closeSidebar}>
              <img src={t.logo} alt="Quick Emigrate" className="h-8 w-auto" />
              <span className={`font-bold tracking-tight text-[15px] ${textFull}`}>Quick Emigrate</span>
            </Link>
          )}
          {collapsed && (
            <Link to="/cliente/inicio" onClick={closeSidebar}>
              <img src={t.logo} alt="QE" className="h-8 w-auto" />
            </Link>
          )}
          {/* Close button — mobile drawer only */}
          <button
            onClick={closeSidebar}
            className={`md:hidden transition-colors p-1 ${textMuted} ${hoverText} ${collapsed ? 'absolute top-3 right-3' : ''}`}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
          {/* ⌘K button */}
          {!collapsed ? (
            <button
              onClick={() => setPaletteOpen(true)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-2 transition-colors
                text-[13px] ${textMuted} ${hoverBg} border`}
              style={{ borderColor: t.sidebarBorder }}
            >
              <span className="flex-1 text-left">Buscar...</span>
              <kbd className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${t.isDark ? 'bg-white/10 text-white/40' : 'bg-black/8 text-black/40'}`}>⌘K</kbd>
            </button>
          ) : (
            <button
              onClick={() => setPaletteOpen(true)}
              title="Buscar (⌘K)"
              className={`${navItemCls} mb-2`}
            >
              <span className="text-[14px] font-mono">⌘</span>
            </button>
          )}

          {!loadingPlan && navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={closeSidebar}
                title={collapsed ? label : undefined}
                className={active
                  ? `flex items-center rounded-xl text-[14px] font-medium transition-colors ${textFull} ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}`
                  : navItemCls
                }
                style={active ? {
                  backgroundColor: t.activeItemBg,
                  ...(collapsed ? {} : { borderLeft: `2px solid ${t.accent}`, paddingLeft: '10px' }),
                } : {}}
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}

          {loadingPlan && (
            <div className={`py-2.5 space-y-2 ${collapsed ? 'px-1' : 'px-3'}`}>
              {[1, 2].map(i => (
                <div
                  key={i}
                  className={`rounded-xl animate-pulse ${collapsed ? 'w-10 h-10 mx-auto' : 'h-9'}`}
                  style={{ backgroundColor: t.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                />
              ))}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div
          className={`py-4 ${collapsed ? 'px-2 space-y-1' : 'px-3'}`}
          style={{ borderTop: `1px solid ${t.sidebarBorder}` }}
        >
          <Link
            to="/cliente/perfil"
            onClick={closeSidebar}
            title={collapsed ? 'Mi Perfil' : undefined}
            className={location.pathname === '/cliente/perfil'
              ? `flex items-center rounded-xl text-[14px] font-medium mb-1 transition-colors ${textFull} ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}`
              : `${navItemCls} mb-1`
            }
            style={location.pathname === '/cliente/perfil' ? {
              backgroundColor: t.activeItemBg,
              ...(collapsed ? {} : { borderLeft: `2px solid ${t.accent}`, paddingLeft: '10px' }),
            } : {}}
          >
            <Settings size={17} className="shrink-0" />
            {!collapsed && (
              <>
                <span>Mi Perfil</span>
                {!loadingPlan && plan && (
                  <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-md" style={planBadgeStyle}>
                    {PLAN_LABEL[plan]}
                  </span>
                )}
              </>
            )}
          </Link>

          <button
            onClick={handleSignOut}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={`w-full transition-colors ${textMuted} ${hoverText} ${hoverBg}
              ${collapsed ? 'flex justify-center items-center w-10 h-10 mx-auto rounded-xl' : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium'}`}
          >
            <LogOut size={17} className="shrink-0" />
            {!collapsed && 'Cerrar sesión'}
          </button>

          {/* Collapse toggle — desktop (lg+) only — md siempre forzado */}
          <button
            onClick={toggleCollapse}
            title={userCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            className={`hidden lg:flex w-full transition-colors mt-2 ${textMuted} ${hoverText} ${hoverBg}
              ${userCollapsed ? 'justify-center items-center w-10 h-10 mx-auto rounded-xl' : 'items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium'}`}
          >
            {userCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            {!userCollapsed && 'Colapsar'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`${mainML} flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300`}>
        {/* Mobile header — md+ no se muestra */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-10 shrink-0"
          style={{
            background: t.isDark ? 'rgba(20,20,20,0.55)' : 'rgba(248,250,252,0.7)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            borderBottom: `1px solid ${t.sidebarBorder}`,
          }}
        >
          <button onClick={() => setSidebarOpen(true)} className={`transition-colors p-1 ${textMuted} ${hoverText}`} aria-label="Abrir menú">
            <Menu size={22} />
          </button>
          <Link to="/cliente/inicio" className="flex items-center gap-2">
            <img src={t.logo} alt="Quick Emigrate" className="h-7 w-auto" />
            <span className={`font-bold tracking-tight text-[14px] ${textFull}`}>Quick Emigrate</span>
          </Link>
          <button
            onClick={() => setPaletteOpen(true)}
            className={`ml-auto text-[12px] font-mono transition-colors ${textMuted} ${hoverText}`}
            aria-label="Buscar"
          >
            ⌘K
          </button>
        </header>

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden ${t.isDark ? 'qe-aurora-bg' : 'qe-aurora-bg qe-aurora-bg-light'}`}
          style={{ backgroundColor: t.main }}
        >
          <div className="w-full h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
