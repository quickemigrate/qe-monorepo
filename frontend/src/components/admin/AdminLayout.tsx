import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Users, FolderOpen, FileText, BookOpen, Settings, LogOut, Menu, X } from 'lucide-react';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users,           label: 'Leads',     path: '/admin/leads' },
  { icon: FolderOpen,      label: 'Expedientes', path: '/admin/expedientes' },
  { icon: FileText,        label: 'Blog',        path: '/admin/blog' },
  { icon: BookOpen,        label: 'Conocimiento', path: '/admin/conocimiento' },
  { icon: Users,           label: 'Usuarios',     path: '/admin/usuarios' },
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-[220px] bg-on-background flex flex-col z-30
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo + close button (mobile) */}
        <div className="px-5 py-6 border-b border-white/8 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5" onClick={closeSidebar}>
            <img src="/logo-dark.png" alt="Quick Emigrate" className="h-8 w-auto" />
            <span className="text-white font-bold tracking-tight text-[15px]">Quick Emigrate</span>
          </Link>
          <button
            onClick={closeSidebar}
            className="lg:hidden text-white/40 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors
                  ${active
                    ? 'bg-white/12 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/6'
                  }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-white/8 space-y-3">
          {user?.email && (
            <div className="px-3 py-2">
              <div className="text-[11px] text-white/30 uppercase tracking-[0.1em] font-semibold mb-0.5">Sesión activa</div>
              <div className="text-[12.5px] text-white/60 truncate">{user.email}</div>
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
      <div className="lg:ml-[220px] flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-on-background sticky top-0 z-10 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <Menu size={22} />
          </button>
          <Link to="/admin" className="flex items-center gap-2">
            <img src="/logo-dark.png" alt="Quick Emigrate" className="h-7 w-auto" />
            <span className="text-white font-bold tracking-tight text-[14px]">Quick Emigrate</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0A0A0A]">
          {children}
        </main>
      </div>
    </div>
  );
}
