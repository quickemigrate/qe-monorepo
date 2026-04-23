import { useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import ClientLayout from '../../components/client/ClientLayout';
import { useAuth } from '../../context/AuthContext';

const inputCls = `w-full rounded-xl border border-black/10 px-4 py-3 text-[14.5px] text-on-background
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition`;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-1.5';

export default function Perfil() {
  const { user } = useAuth();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: 'success' | 'error'; msg: string } | null>(null);

  const handleCambiarPassword = async () => {
    setResultado(null);

    if (!actual || !nueva || !confirmar) {
      setResultado({ tipo: 'error', msg: 'Rellena todos los campos.' });
      return;
    }
    if (nueva.length < 6) {
      setResultado({ tipo: 'error', msg: 'La nueva contraseña debe tener mínimo 6 caracteres.' });
      return;
    }
    if (nueva !== confirmar) {
      setResultado({ tipo: 'error', msg: 'Las contraseñas no coinciden.' });
      return;
    }

    setGuardando(true);
    try {
      if (!user?.email) throw new Error('No hay usuario autenticado');
      const credential = EmailAuthProvider.credential(user.email, actual);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, nueva);
      setResultado({ tipo: 'success', msg: 'Contraseña actualizada correctamente.' });
      setActual('');
      setNueva('');
      setConfirmar('');
    } catch (err: any) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'La contraseña actual es incorrecta.'
        : 'Error al actualizar. Inténtalo de nuevo.';
      setResultado({ tipo: 'error', msg });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ClientLayout>
      <div className="p-8 max-w-[600px]">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background mb-8">
          Mi Perfil
        </h1>

        {/* Datos de cuenta */}
        <div className="bg-white rounded-2xl border border-black/5 p-6 mb-6">
          <h2 className="text-[15px] font-semibold text-on-background mb-4">Datos de cuenta</h2>
          <div className="space-y-4">
            <div>
              <div className={labelCls}>Nombre</div>
              <div className="px-4 py-3 rounded-xl bg-surface-container-low text-[14.5px] text-on-background/70">
                {user?.displayName || user?.email?.split('@')[0] || '—'}
              </div>
            </div>
            <div>
              <div className={labelCls}>Email</div>
              <div className="px-4 py-3 rounded-xl bg-surface-container-low text-[14.5px] text-on-background/70">
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          <h2 className="text-[15px] font-semibold text-on-background mb-4">Cambiar contraseña</h2>

          <div className="space-y-4">
            {resultado && (
              <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13.5px] font-medium border
                ${resultado.tipo === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                {resultado.tipo === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {resultado.msg}
              </div>
            )}

            <div>
              <label className={labelCls}>Contraseña actual</label>
              <input
                type="password"
                value={actual}
                onChange={e => setActual(e.target.value)}
                className={inputCls}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className={labelCls}>Nueva contraseña</label>
              <input
                type="password"
                value={nueva}
                onChange={e => setNueva(e.target.value)}
                className={inputCls}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className={labelCls}>Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                className={inputCls}
                placeholder="Repite la nueva contraseña"
              />
            </div>

            <div className="pt-1">
              <button
                onClick={handleCambiarPassword}
                disabled={guardando}
                className="w-full rounded-xl bg-on-background text-white font-semibold py-3.5 text-[15px]
                           hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
              >
                {guardando ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
