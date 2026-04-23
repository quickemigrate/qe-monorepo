import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, CreditCard, MessageCircle, FolderOpen, FileText } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useClientePlan } from '../../hooks/useClientePlan';

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-white/10 text-white/60',
  pro:     'bg-blue-500/20 text-blue-300',
  premium: 'bg-amber-500/20 text-amber-300',
};

const PLAN_LABEL: Record<string, string> = {
  starter: 'Plan Starter',
  pro:     'Plan Pro',
  premium: 'Plan Premium',
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
    { icon: User,          label: 'Mi Perfil',      path: '/cliente/perfil',     visible: true },
    { icon: CreditCard,    label: 'Mi Plan',         path: '/cliente/plan',       visible: true },
    { icon: MessageCircle, label: 'Asistente IA',    path: '/cliente/chat',       visible: isPro },
    { icon: FolderOpen,    label: 'Mis Documentos',  path: '/cliente/documentos', visible: isPro },
    { icon: FileText,      label: 'Mi Expediente',   path: '/cliente/expediente', visible: isPremium },
  ];

  const nombre = user?.displayName || user?.email?.split('@')[0] || 'Cliente';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-[220px] bg-on-background flex flex-col z-40">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/8">
          <Link to="/cliente/perfil" className="flex items-center gap-2.5">
            <img src="/logo-dark.png" alt="Quick Emigrate" className="h-8 w-auto" />
            <span className="text-white font-bold tracking-tight text-[15px]">Quick Emigrate</span>
          </Link>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-white/8">
          <div className="text-[13px] text-white font-semibold truncate">{nombre}</div>
          <div className="text-[11.5px] text-white/40 truncate mt-0.5">{user?.email}</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.filter(i => i.visible).map(({ icon: Icon, label, path }) => {
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

          {/* Items bloqueados para starter */}
          {!loadingPlan && !isPro && (
            <>
              {[
                { icon: MessageCircle, label: 'Asistente IA' },
                { icon: FolderOpen,    label: 'Mis Documentos' },
              ].map(({ icon: Icon, label }) => (
                <Link
                  key={label}
                  to="/cliente/plan"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
                             text-white/20 cursor-pointer hover:bg-white/4 transition-colors group"
                  title="Requiere plan Pro o Premium"
                >
                  <Icon size={17} />
                  <span>{label}</span>
                  <span className="ml-auto text-[10px] bg-white/8 text-white/30 px-1.5 py-0.5 rounded-md group-hover:text-white/50 transition-colors">Pro</span>
                </Link>
              ))}
            </>
          )}
          {!loadingPlan && !isPremium && plan !== null && (
            <Link
              to="/cliente/plan"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
                         text-white/20 cursor-pointer hover:bg-white/4 transition-colors group"
              title="Requiere plan Premium"
            >
              <FileText size={17} />
              <span>Mi Expediente</span>
              <span className="ml-auto text-[10px] bg-white/8 text-white/30 px-1.5 py-0.5 rounded-md group-hover:text-white/50 transition-colors">Premium</span>
            </Link>
          )}
        </nav>

        {/* Plan badge + logout */}
        <div className="px-3 py-4 border-t border-white/8 space-y-2">
          {!loadingPlan && plan && (
            <div className="px-3 py-2">
              <span className={`inline-flex px-2.5 py-1 rounded-lg text-[12px] font-semibold ${PLAN_BADGE[plan]}`}>
                {PLAN_LABEL[plan]}
              </span>
            </div>
          )}
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
