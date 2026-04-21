import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

export default function ClientLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/cliente');
    } catch {
      setError('Email o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-[24px] border border-black/5 p-8 shadow-sm tonal-lift">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center font-black text-on-background text-lg">
              Q
            </div>
            <span className="text-lg font-bold tracking-tight text-on-background">Quick Emigrate</span>
          </div>

          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-on-background mb-1">
            Accede a tu expediente
          </h1>
          <p className="text-[14px] text-on-background/50 mb-8">
            Introduce tu email y contraseña para ver el estado de tu proceso
          </p>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13.5px] text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full rounded-xl bg-primary-container text-on-background font-bold py-3.5 text-[15px]
                         hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 shadow-sm"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-on-background/40">
            ¿Problemas para acceder?{' '}
            <Link to="/#contacto" className="text-on-background/70 font-semibold hover:text-on-background transition-colors underline underline-offset-2">
              Contáctanos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
