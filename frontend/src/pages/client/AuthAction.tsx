import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
  checkActionCode,
} from 'firebase/auth';
import { auth } from '../../firebase';

const inputCls = `w-full rounded-xl border border-white/15 bg-[#0A0A0A] px-4 py-3
                  text-[15px] text-white placeholder-white/25
                  focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-transparent transition`;
const labelCls = 'block text-[12px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1.5';

type Status = 'verifying' | 'ready' | 'submitting' | 'success' | 'error';

export default function AuthAction() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const mode = params.get('mode') || '';
  const oobCode = params.get('oobCode') || '';
  const continueUrl = params.get('continueUrl') || '';

  const [status, setStatus] = useState<Status>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!oobCode) { setStatus('error'); setErrorMsg('Enlace no válido.'); return; }

      try {
        if (mode === 'resetPassword') {
          // Non-consuming verify — solo lee, no quema el oobCode
          const e = await verifyPasswordResetCode(auth, oobCode);
          if (canceled) return;
          setEmail(e);
          setStatus('ready');
        } else if (mode === 'verifyEmail') {
          await applyActionCode(auth, oobCode);
          if (canceled) return;
          setStatus('success');
        } else if (mode === 'recoverEmail') {
          const info = await checkActionCode(auth, oobCode);
          await applyActionCode(auth, oobCode);
          if (canceled) return;
          setEmail(info.data.email || '');
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMsg('Acción no soportada.');
        }
      } catch (err: any) {
        if (canceled) return;
        const code = err?.code || '';
        if (code === 'auth/expired-action-code') setErrorMsg('El enlace ha caducado. Solicita uno nuevo.');
        else if (code === 'auth/invalid-action-code') setErrorMsg('Enlace inválido o ya utilizado. Solicita uno nuevo.');
        else if (code === 'auth/user-disabled') setErrorMsg('Esta cuenta está deshabilitada.');
        else if (code === 'auth/user-not-found') setErrorMsg('No existe una cuenta para este enlace.');
        else setErrorMsg('No pudimos verificar el enlace. Solicita uno nuevo.');
        setStatus('error');
      }
    })();
    return () => { canceled = true; };
  }, [mode, oobCode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 6) { setErrorMsg('La contraseña debe tener mínimo 6 caracteres.'); return; }
    if (password !== confirmPwd) { setErrorMsg('Las contraseñas no coinciden.'); return; }

    setStatus('submitting');
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus('success');
      setTimeout(() => {
        if (continueUrl && continueUrl.startsWith('https://quickemigrate.com')) {
          window.location.href = continueUrl;
        } else {
          navigate('/cliente/login', {
            state: { mensaje: 'Contraseña actualizada. Inicia sesión con la nueva.' },
          });
        }
      }, 1200);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/expired-action-code' || code === 'auth/invalid-action-code') {
        setErrorMsg('El enlace ha caducado o ya fue usado. Solicita uno nuevo.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Contraseña demasiado débil.');
      } else {
        setErrorMsg('Error al cambiar la contraseña. Inténtalo de nuevo.');
      }
      setStatus('ready');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-[#111111] rounded-[24px] border border-white/10 p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <img src="/logo-dark.png" alt="Quick Emigrate" className="h-9 w-auto" />
            <span className="text-lg font-bold tracking-tight text-white">Quick Emigrate</span>
          </div>

          {status === 'verifying' && (
            <>
              <h1 className="text-[20px] font-semibold text-white mb-1">Verificando enlace…</h1>
              <p className="text-[13.5px] text-white/50">Un momento.</p>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="text-[20px] font-semibold text-white mb-1">Enlace no válido</h1>
              <p className="text-[13.5px] text-white/55 mb-5">{errorMsg}</p>
              <button
                onClick={() => navigate('/cliente/login')}
                className="w-full rounded-xl bg-[#25D366] text-[#062810] font-bold py-3 text-[14px] hover:bg-[#2adc6c] transition"
              >
                Volver a iniciar sesión
              </button>
            </>
          )}

          {status === 'success' && mode === 'resetPassword' && (
            <>
              <h1 className="text-[20px] font-semibold text-white mb-1">Contraseña actualizada</h1>
              <p className="text-[13.5px] text-white/55">Ya puedes iniciar sesión con la nueva contraseña.</p>
            </>
          )}

          {status === 'success' && mode === 'verifyEmail' && (
            <>
              <h1 className="text-[20px] font-semibold text-white mb-1">Email verificado</h1>
              <p className="text-[13.5px] text-white/55 mb-5">Tu dirección quedó confirmada.</p>
              <button
                onClick={() => navigate('/cliente/inicio')}
                className="w-full rounded-xl bg-[#25D366] text-[#062810] font-bold py-3 text-[14px] hover:bg-[#2adc6c] transition"
              >
                Ir a mi cuenta
              </button>
            </>
          )}

          {status === 'success' && mode === 'recoverEmail' && (
            <>
              <h1 className="text-[20px] font-semibold text-white mb-1">Email restaurado</h1>
              <p className="text-[13.5px] text-white/55">{email ? `${email} es ahora tu email de inicio de sesión.` : 'Email restaurado correctamente.'}</p>
            </>
          )}

          {(status === 'ready' || status === 'submitting') && mode === 'resetPassword' && (
            <>
              <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white mb-1">Nueva contraseña</h1>
              <p className="text-[13.5px] text-white/50 mb-6">
                Para <strong className="text-white">{email}</strong>
              </p>

              {errorMsg && (
                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13px] text-red-400 font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls} htmlFor="reset-pwd">Nueva contraseña</label>
                  <input
                    id="reset-pwd"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className={inputCls}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="reset-pwd2">Confirmar contraseña</label>
                  <input
                    id="reset-pwd2"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    required
                    className={inputCls}
                    placeholder="Repite la contraseña"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full rounded-xl bg-[#25D366] text-[#062810] font-bold py-3.5 text-[15px]
                             hover:bg-[#2adc6c] transition disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Guardando…' : 'Cambiar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
