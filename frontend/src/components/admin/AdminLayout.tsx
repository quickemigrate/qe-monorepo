import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Users, FolderOpen, FileText, BookOpen, Settings, LogOut, Menu, X } from 'lucide-react';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/admin' },
  { icon: Users,           label: 'Leads',         path: '/admin/leads' },
  { icon: FolderOpen,      label: 'Expedientes',   path: '/admin/expedientes' },
  { icon: FileText,        label: 'Blog',          path: '/admin/blog' },
  { icon: BookOpen,        label: 'Conocimiento',  path: '/admin/conocimiento' },
  { icon: Users,           label: 'Usuarios',      path: '/admin/usuarios' },
  { icon: Settings,        label: 'Configuración', path: '/admin/config' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-[#0A0A0A]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — mobile drawer · md rail (68px) · lg full (220px) */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col qe-card-strong
          w-[260px] md:w-[68px] lg:w-[220px]
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ borderRight: '1px solid rgba(255,255,255,0.08)', borderRadius: 0 }}
      >
        {/* Logo + close (mobile) */}
        <div className="px-4 lg:px-5 py-5 lg:py-6 border-b qe-divider flex items-center justify-between md:justify-center lg:justify-between">
          <Link
            to="/admin"
            onClick={closeSidebar}
            className="flex items-center gap-2.5 md:justify-center lg:justify-start"
          >
            <img src="/logo-dark.png" alt="QE" className="h-8 w-auto shrink-0" />
            <span className="text-white font-bold tracking-tight text-[15px] md:hidden lg:inline">
              Quick Emigrate
            </span>
          </Link>
          <button
            onClick={closeSidebar}
            className="md:hidden text-white/40 hover:text-white transition-colors p-1"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={closeSidebar}
                title={label}
                className={`flex items-center rounded-xl text-[14px] font-medium transition-colors
                  md:justify-center md:w-11 md:h-11 md:mx-auto md:px-0
                  lg:justify-start lg:w-auto lg:h-auto lg:mx-0 lg:gap-3 lg:px-3 lg:py-2.5
                  gap-3 px-3 py-2.5
                  ${active
                    ? 'bg-white/12 text-white'
                    : 'text-white/55 hover:text-white hover:bg-white/6'
                  }`}
              >
                <Icon size={17} className="shrink-0" />
                <span className="md:hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-2 lg:px-3 py-4 border-t qe-divider space-y-2">
          {user?.email && (
            <div className="px-3 py-2 hidden lg:block">
              <div className="text-[11px] text-white/30 uppercase tracking-[0.1em] font-semibold mb-0.5">
                Sesión activa
              </div>
              <div className="text-[12.5px] text-white/60 truncate">{user.email}</div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            title="Cerrar sesión"
            className="w-full flex items-center rounded-xl text-[14px] font-medium transition-colors
              md:justify-center md:w-11 md:h-11 md:mx-auto md:px-0
              lg:justify-start lg:w-auto lg:h-auto lg:mx-0 lg:gap-3 lg:px-3 lg:py-2.5
              gap-3 px-3 py-2.5
              text-white/55 hover:text-white hover:bg-white/6"
          >
            <LogOut size={17} className="shrink-0" />
            <span className="md:hidden lg:inline">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-[68px] lg:ml-[220px] transition-[margin] duration-300">
        {/* Mobile header (hidden md+) */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-10 shrink-0 qe-card-strong"
          style={{ borderRadius: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 hover:text-white transition-colors p-1"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <Link to="/admin" className="flex items-center gap-2">
            <img src="/logo-dark.png" alt="QE" className="h-7 w-auto" />
            <span className="text-white font-bold tracking-tight text-[14px]">Quick Emigrate</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden qe-aurora-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
