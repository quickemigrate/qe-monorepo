import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';

const ALLOWED_EMAILS = [
  import.meta.env.VITE_ADMIN_EMAIL_1,
  import.meta.env.VITE_ADMIN_EMAIL_2
];

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkAllowed = async (userEmail: string | null) => {
    if (!ALLOWED_EMAILS.includes(userEmail || '')) {
      await signOut(auth);
      setError('No tienes acceso a este panel');
      return false;
    }
    return true;
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      if (await checkAllowed(user.email)) {
        navigate('/admin');
      }
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      if (await checkAllowed(user.email)) {
        navigate('/admin');
      }
    } catch {
      setError('Error al iniciar sesión con Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Card */}
        <div className="bg-white rounded-[24px] border border-black/5 p-8 shadow-sm tonal-lift">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <img src="/logo-light.png" alt="Quick Emigrate" className="h-10 w-auto" />
            <span className="text-lg font-bold tracking-tight text-on-background">Quick Emigrate</span>
          </div>

          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-on-background mb-1">
            Panel de administración
          </h1>
          <p className="text-[14px] text-on-background/50 mb-8">
            Acceso restringido a Manu y Pablo
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13.5px] text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.1em] text-on-background/50 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-black/10 bg-surface-container-lowest px-4 py-3
                           text-[15px] text-on-background placeholder-on-background/30
                           focus:outline-none focus:ring-2 focus:ring-primary-container/60 focus:border-transparent transition"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.1em] text-on-background/50 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-black/10 bg-surface-container-lowest px-4 py-3
                           text-[15px] text-on-background placeholder-on-background/30
                           focus:outline-none focus:ring-2 focus:ring-primary-container/60 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-on-background text-white font-semibold py-3.5 text-[15px]
                         hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar con email'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-black/8" />
            <span className="text-[12px] text-on-background/30 font-medium">o</span>
            <div className="flex-1 h-px bg-black/8" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full rounded-xl border border-black/10 bg-white font-semibold py-3.5 text-[15px]
                       text-on-background flex items-center justify-center gap-2.5
                       hover:bg-surface-container-lowest active:scale-[0.98] transition disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Entrar con Google
          </button>
        </div>
      </div>
    </div>
  );
}
