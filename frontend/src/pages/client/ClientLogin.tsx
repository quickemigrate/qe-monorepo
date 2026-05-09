import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';

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

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    if (!isValidEmail(resetEmail)) {
      setResetMsg({ tipo: 'error', texto: 'Email no válido.' });
      return;
    }
    setResetSending(true);
    try {
      const res = await fetch(`${API}/api/usuarios/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      if (res.status === 429) {
        setResetMsg({ tipo: 'error', texto: 'Demasiados intentos. Espera 1 hora antes de reintentar.' });
        return;
      }
      // Respuesta genérica para no revelar si email existe
      setResetMsg({
        tipo: 'success',
        texto: 'Si esa cuenta existe, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja y la carpeta de spam. El enlace caduca en 1 hora.',
      });
    } catch {
      setResetMsg({ tipo: 'error', texto: 'Error de conexión. Inténtalo de nuevo.' });
    } finally {
      setResetSending(false);
    }
  };

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
    if (!isValidEmail(email)) { setError('Email no válido. Revisa el formato.'); return; }
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

  const handleGoogle = async () => {
    setError('');
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;
      if (!user.email) throw new Error('Cuenta Google sin email');

      const token = await user.getIdToken();

      // Crea/upsert doc Firestore
      await fetch(`${API}/api/usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          nombre: user.displayName || user.email.split('@')[0],
        }),
      });

      // Lee perfil para decidir destino
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
      } catch { /* fallback a inicio */ }

      navigate(redirectTo || '/cliente/inicio');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // user closed → no error
      } else if (code === 'auth/account-exists-with-different-credential') {
        setError('Esta cuenta ya está registrada con email/contraseña. Inicia sesión por ahí.');
      } else {
        setError('No se pudo iniciar sesión con Google. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError('Email no válido. Revisa el formato.');
      return;
    }
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
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Email verification (no bloqueante)
      sendEmailVerification(cred.user).catch(() => { /* silent */ });
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

              <button
                type="button"
                onClick={handleGoogle}
                disabled={isLoading}
                className="w-full mb-4 rounded-xl bg-white text-[#1f1f1f] font-semibold py-3 text-[14px]
                           hover:bg-white/90 active:scale-[0.98] transition disabled:opacity-50
                           flex items-center justify-center gap-2.5 border border-white/15"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                Continuar con Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[11px] uppercase tracking-[0.1em] text-white/30">o</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={labelCls} htmlFor="login-email">Email</label>
                  <input id="login-email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254}
                    value={email} onChange={e => setEmail(e.target.value)}
                    required className={inputCls} placeholder="tu@email.com" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="login-password">Contraseña</label>
                  <input id="login-password" name="password" type="password" autoComplete="current-password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    required className={inputCls} placeholder="••••••••" />
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full rounded-xl bg-[#25D366] text-[#062810] font-bold py-3.5 text-[15px]
                             hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50">
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => { setResetOpen(true); setResetEmail(email); setResetMsg(null); }}
                  className="text-[12.5px] text-white/50 hover:text-white transition-colors underline underline-offset-2"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <p className="mt-5 text-center text-[13px] text-white/40">
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

              <button
                type="button"
                onClick={handleGoogle}
                disabled={isLoading}
                className="w-full mb-4 rounded-xl bg-white text-[#1f1f1f] font-semibold py-3 text-[14px]
                           hover:bg-white/90 active:scale-[0.98] transition disabled:opacity-50
                           flex items-center justify-center gap-2.5 border border-white/15"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                Registrarse con Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[11px] uppercase tracking-[0.1em] text-white/30">o</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className={labelCls} htmlFor="reg-email">Email</label>
                  <input id="reg-email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254}
                    value={email} onChange={e => setEmail(e.target.value)}
                    required className={inputCls} placeholder="tu@email.com" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="reg-password">Contraseña</label>
                  <input id="reg-password" name="new-password" type="password" autoComplete="new-password" minLength={6}
                    value={password} onChange={e => setPassword(e.target.value)}
                    required className={inputCls} placeholder="Mínimo 6 caracteres" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="reg-confirm">Confirmar contraseña</label>
                  <input id="reg-confirm" name="confirm-password" type="password" autoComplete="new-password" minLength={6}
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
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

      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#111111] p-6">
            <h3 className="text-[17px] font-semibold text-white mb-1">Restablecer contraseña</h3>
            <p className="text-[13px] text-white/55 mb-5 leading-[1.55]">
              Introduce tu email y te enviaremos un enlace para crear una contraseña nueva.
            </p>

            {resetMsg && (
              <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13px] font-medium border mb-4
                ${resetMsg.tipo === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                <span>{resetMsg.texto}</span>
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className={labelCls} htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  maxLength={254}
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  className={inputCls}
                  placeholder="tu@email.com"
                />
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => { setResetOpen(false); setResetMsg(null); }}
                  className="flex-1 rounded-xl border border-white/15 text-white/70 font-semibold py-3 text-[14px] hover:bg-white/5 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetSending}
                  className="flex-1 rounded-xl bg-[#25D366] text-[#062810] font-bold py-3 text-[14px] hover:bg-[#2adc6c] transition disabled:opacity-50"
                >
                  {resetSending ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
