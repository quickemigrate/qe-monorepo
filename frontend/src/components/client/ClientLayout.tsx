import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/cliente/login');
  };

  return (
    <div className="min-h-screen bg-surface-container-low">
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/cliente" className="flex items-center gap-2 group">
            <img src="/logo-light.png" alt="Quick Emigrate" className="h-8 w-auto" />
            <span className="text-base font-bold tracking-tight text-on-background">Quick Emigrate</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-[13px] text-on-background/50 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-on-background/60
                         hover:text-on-background transition-colors"
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
