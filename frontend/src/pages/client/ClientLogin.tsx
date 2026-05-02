import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const inputCls = `w-full rounded-xl border border-white/15 bg-[#0A0A0A] px-4 py-3
                  text-[15px] text-white placeholder-white/25
                  focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-transparent transition`;
const labelCls = 'block text-[12px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1.5';

export default function ClientLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const mensaje = (location.state as any)?.mensaje as string | undefined;
  const redirectTo = (location.state as any)?.redirect as string | undefined;
  const initialMode = (location.state as any)?.mode === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [transitioning, setTransitioning] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleMode = () => {
    setTransitioning(true);
    setError('');
    setTimeout(() => {
      setMode(m => m === 'login' ? 'register' : 'login');
      setTransitioning(false);
    }, 200);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      try {
        const res = await fetch(`${API}/api/usuarios/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.data?.perfilCompleto) {
            navigate('/cliente/onboarding');
            return;
          }
        }
      } catch {
        // Silently fall through to inicio; OnboardingGuard will redirect if needed
      }
      navigate(redirectTo || '/cliente/inicio');
    } catch {
      setError('Email o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await fetch(`${API}/api/usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre: email.split('@')[0] }),
      });
      navigate(redirectTo || '/cliente/onboarding');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado. Inicia sesión.');
      } else {
        setError('Error al crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div
          className={`bg-[#111111] rounded-[24px] border border-white/10 p-8
                       transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="flex items-center gap-2.5 mb-8">
            <img src="/logo-dark.png" alt="Quick Emigrate" className="h-10 w-auto" />
            <span className="text-lg font-bold tracking-tight text-white">Quick Emigrate</span>
          </div>

          {mensaje && (
            <div className="mb-5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 px-4 py-3 text-[13.5px] text-emerald-400 font-medium text-center">
              {mensaje}
            </div>
          )}

          {mode === 'login' ? (
            <>
              <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-white mb-1">
                Accede a tu área privada
              </h1>
              <p className="text-[14px] text-white/50 mb-8">
                Introduce tu email y contraseña para continuar
              </p>

              {error && (
                <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13.5px] text-red-400 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required className={inputCls} placeholder="tu@email.com" />
                </div>
                <div>
                  <label className={labelCls}>Contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required className={inputCls} placeholder="••••••••" />
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full rounded-xl bg-[#25D366] text-[#062810] font-bold py-3.5 text-[15px]
                             hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50">
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <p className="mt-6 text-center text-[13px] text-white/40">
                ¿No tienes cuenta?{' '}
                <button onClick={toggleMode}
                  className="text-white/70 font-semibold hover:text-white transition-colors underline underline-offset-2">
                  Regístrate gratis
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-white mb-1">
                Crea tu cuenta
              </h1>
              <p className="text-[14px] text-white/50 mb-8">
                Empieza tu proceso de emigración a España
              </p>

              {error && (
                <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13.5px] text-red-400 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required className={inputCls} placeholder="tu@email.com" />
                </div>
                <div>
                  <label className={labelCls}>Contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required className={inputCls} placeholder="Mínimo 6 caracteres" />
                </div>
                <div>
                  <label className={labelCls}>Confirmar contraseña</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    required className={inputCls} placeholder="Repite la contraseña" />
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full rounded-xl bg-[#25D366] text-[#062810] font-bold py-3.5 text-[15px]
                             hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50">
                  {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>

              <p className="mt-6 text-center text-[13px] text-white/40">
                ¿Ya tienes cuenta?{' '}
                <button onClick={toggleMode}
                  className="text-white/70 font-semibold hover:text-white transition-colors underline underline-offset-2">
                  Inicia sesión
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
