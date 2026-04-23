import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Users, FolderOpen, FileText, BookOpen, LogOut } from 'lucide-react';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users,           label: 'Leads',     path: '/admin/leads' },
  { icon: FolderOpen,      label: 'Expedientes', path: '/admin/expedientes' },
  { icon: FileText,        label: 'Blog',        path: '/admin/blog' },
  { icon: BookOpen,        label: 'Conocimiento', path: '/admin/conocimiento' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-[220px] bg-on-background flex flex-col z-40">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/8">
          <Link to="/admin" className="flex items-center gap-2.5">
            <img src="/logo-dark.png" alt="Quick Emigrate" className="h-8 w-auto" />
            <span className="text-white font-bold tracking-tight text-[15px]">Quick Emigrate</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
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
      <main className="ml-[220px] flex-1 min-h-screen bg-surface-container-low">
        {children}
      </main>
    </div>
  );
}
