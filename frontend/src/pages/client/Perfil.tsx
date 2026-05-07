import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
  signOut,
} from 'firebase/auth';
import { CheckCircle2, AlertCircle, Mail, Download, Trash2, Check } from 'lucide-react';
import ClientLayout from '../../components/client/ClientLayout';
import NotificacionesPanel from '../../components/client/NotificacionesPanel';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase';
import {
  usePreferencias, TEMAS,
  type TemaId, type Tono, type Detalle, type IdiomaIA,
} from '../../hooks/usePreferencias';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const inputCls = `qe-input w-full rounded-xl px-4 py-3 text-[14.5px] text-white
                  transition placeholder:text-white/30`;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1.5';

function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[13.5px] font-semibold transition-all border
        ${active
          ? 'bg-white text-[#0A0A0A] border-white scale-[1.03] shadow-sm'
          : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
        }`}
    >
      {label}
    </button>
  );
}

const TONOS: { id: Tono; label: string; desc: string }[] = [
  { id: 'formal',   label: '🎓 Formal',   desc: 'Vocabulario técnico, estilo profesional' },
  { id: 'neutro',   label: '⚖️ Neutro',   desc: 'Equilibrado, claro y preciso' },
  { id: 'cercano',  label: '👋 Cercano',  desc: 'Amigable, como hablar con un amigo' },
];

const DETALLES: { id: Detalle; label: string; desc: string }[] = [
  { id: 'breve',     label: '⚡ Breve',     desc: 'Respuestas cortas, lo esencial' },
  { id: 'estandar',  label: '📋 Estándar',  desc: 'Balance entre brevedad y contexto' },
  { id: 'detallado', label: '📖 Detallado', desc: 'Explicaciones completas y exhaustivas' },
];

const IDIOMAS: { id: IdiomaIA; label: string }[] = [
  { id: 'espanol',   label: '🇪🇸 Español' },
  { id: 'ingles',    label: '🇬🇧 English' },
  { id: 'portugues', label: '🇧🇷 Português' },
];

export default function Perfil() {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const { prefs, tema, setTema, setIA } = usePreferencias();
  const [pendingTema, setPendingTema] = useState<TemaId>(prefs.tema);

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: 'success' | 'error'; msg: string } | null>(null);

  // Cambio email
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [passEmail, setPassEmail] = useState('');
  const [cambiandoEmail, setCambiandoEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ tipo: 'success' | 'error'; msg: string } | null>(null);

  // Export
  const [exportando, setExportando] = useState(false);

  // Borrar cuenta
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [passDelete, setPassDelete] = useState('');
  const [textoConfirma, setTextoConfirma] = useState('');
  const [borrando, setBorrando] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleCambiarEmail = async () => {
    setEmailResult(null);
    if (!nuevoEmail || !passEmail) {
      setEmailResult({ tipo: 'error', msg: 'Rellena ambos campos.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(nuevoEmail.trim())) {
      setEmailResult({ tipo: 'error', msg: 'Email no válido.' });
      return;
    }
    if (nuevoEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setEmailResult({ tipo: 'error', msg: 'Es tu email actual.' });
      return;
    }
    setCambiandoEmail(true);
    try {
      if (!user?.email) throw new Error('No autenticado');
      const credential = EmailAuthProvider.credential(user.email, passEmail);
      await reauthenticateWithCredential(user, credential);
      await verifyBeforeUpdateEmail(user, nuevoEmail.trim());
      setEmailResult({
        tipo: 'success',
        msg: `Te enviamos un enlace a ${nuevoEmail.trim()}. Verifícalo para completar el cambio. Tu email actual sigue activo hasta entonces.`,
      });
      setNuevoEmail('');
      setPassEmail('');
    } catch (err: any) {
      const code = err.code as string | undefined;
      let msg = 'Error al cambiar el email. Inténtalo de nuevo.';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') msg = 'La contraseña es incorrecta.';
      else if (code === 'auth/email-already-in-use') msg = 'Ese email ya está registrado.';
      else if (code === 'auth/operation-not-allowed') msg = 'Verifica primero tu email actual desde el enlace que te enviamos al registrarte.';
      setEmailResult({ tipo: 'error', msg });
    } finally {
      setCambiandoEmail(false);
    }
  };

  const handleExportar = async () => {
    setExportando(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/usuarios/exportar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('export-failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quickemigrate-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('No se pudo exportar tus datos. Inténtalo más tarde o contacta hola@quickemigrate.com.');
    } finally {
      setExportando(false);
    }
  };

  const handleEliminarCuenta = async () => {
    setDeleteError('');
    if (textoConfirma.trim().toUpperCase() !== 'BORRAR') {
      setDeleteError('Escribe "BORRAR" para confirmar.');
      return;
    }
    if (!passDelete) {
      setDeleteError('Introduce tu contraseña.');
      return;
    }
    setBorrando(true);
    try {
      if (!user?.email) throw new Error('No autenticado');
      const credential = EmailAuthProvider.credential(user.email, passDelete);
      await reauthenticateWithCredential(user, credential);
      const token = await getToken();
      const res = await fetch(`${API}/api/usuarios/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('backend-failed');
      await signOut(auth);
      navigate('/', { replace: true });
    } catch (err: any) {
      const code = err.code as string | undefined;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setDeleteError('Contraseña incorrecta.');
      } else {
        setDeleteError('Error al borrar la cuenta. Contacta hola@quickemigrate.com.');
      }
    } finally {
      setBorrando(false);
    }
  };

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
      setActual(''); setNueva(''); setConfirmar('');
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
      <div className="p-4 md:p-6 lg:p-8 max-w-[1280px] mx-auto">
        <h1 className="text-2xl md:text-[28px] font-semibold tracking-[-0.025em] text-white mb-5 md:mb-6">
          Mi Perfil
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 items-start">
        {/* Datos de cuenta */}
        <div className="qe-card rounded-2xl p-5 md:p-6">
          <h2 className="text-[15px] font-semibold text-white mb-4">Datos de cuenta</h2>
          <div className="space-y-4">
            <div>
              <div className={labelCls}>Nombre</div>
              <div className="px-4 py-3 rounded-xl bg-white/8 text-[14.5px] text-white/70">
                {user?.displayName || user?.email?.split('@')[0] || '—'}
              </div>
            </div>
            <div>
              <div className={labelCls}>Email</div>
              <div className="px-4 py-3 rounded-xl bg-white/8 text-[14.5px] text-white/70">
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Tema del panel */}
        <div className="qe-card rounded-2xl p-5 md:p-6">
          <h2 className="text-[15px] font-semibold text-white mb-1">Apariencia</h2>
          <p className="text-[12.5px] text-white/40 mb-5">
            Cambia el color del sidebar — el área principal mantiene fondo oscuro
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 md:gap-3 mb-5">
            {(Object.values(TEMAS)).map(t => {
              const isApplied = prefs.tema === t.id;
              const isPending = pendingTema === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setPendingTema(t.id as TemaId)}
                  className={`relative rounded-xl overflow-hidden border transition-all text-left
                    ${isPending
                      ? 'border-[#25D366] ring-2 ring-[#25D366]/40 shadow-lg shadow-[#25D366]/10'
                      : 'border-white/10 hover:border-white/25'
                    }`}
                  style={{ backgroundColor: t.main }}
                >
                  {/* Mini mockup: sidebar barra izq + main area */}
                  <div className="relative h-20 w-full flex">
                    {/* Sidebar */}
                    <div
                      className="w-[34%] h-full flex flex-col items-center justify-start pt-2 gap-1.5 border-r"
                      style={{ background: t.sidebar, borderColor: t.sidebarBorder }}
                    >
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: t.accent }} />
                      <span className="w-5 h-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
                      <span className="w-5 h-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} />
                      <span className="w-5 h-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} />
                    </div>
                    {/* Main area */}
                    <div className="flex-1 h-full p-2 flex flex-col gap-1.5" style={{ background: t.main }}>
                      <span className="block w-3/4 h-1.5 rounded" style={{ backgroundColor: t.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)' }} />
                      <span className="block w-1/2 h-1 rounded" style={{ backgroundColor: t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }} />
                      <div className="mt-auto flex gap-1">
                        <span className="block flex-1 h-3 rounded" style={{ backgroundColor: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
                        <span className="block flex-1 h-3 rounded" style={{ backgroundColor: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
                      </div>
                    </div>
                  </div>
                  {isPending && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#25D366] rounded-full flex items-center justify-center shadow-md z-10">
                      <CheckCircle2 size={12} className="text-[#062810]" strokeWidth={3} />
                    </div>
                  )}
                  <div className="px-3 py-2 flex items-center gap-1.5"
                    style={{
                      borderTop: `1px solid ${t.sidebarBorder}`,
                      background: t.isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)',
                      backdropFilter: 'blur(10px)',
                    }}>
                    <p className={`text-[12.5px] font-semibold flex-1 truncate ${t.isDark ? 'text-white' : 'text-slate-900'}`}>{t.name}</p>
                    {isApplied && !isPending && (
                      <span className="text-[10px] text-emerald-400 font-medium shrink-0 uppercase tracking-wide">activo</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setTema(pendingTema)}
            disabled={pendingTema === prefs.tema}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] text-[#062810]
                       text-[13.5px] font-semibold hover:bg-[#2adc6c] transition disabled:opacity-35
                       disabled:cursor-not-allowed"
          >
            <Check size={15} />
            Aplicar tema
          </button>
        </div>

        {/* Personalización IA */}
        <div className="qe-card rounded-2xl p-5 md:p-6">
          <h2 className="text-[15px] font-semibold text-white mb-1">Asistente IA</h2>
          <p className="text-[13px] text-white/40 mb-6">Ajusta cómo responde Mia a tus preguntas</p>

          {/* Tono */}
          <div className="mb-5">
            <p className={labelCls}>Tono</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {TONOS.map(({ id, label, desc }) => (
                <div key={id} className="flex flex-col items-start gap-0.5">
                  <Chip
                    label={label}
                    active={prefs.ia.tono === id}
                    onClick={() => setIA({ tono: id })}
                  />
                  <span className="text-[11px] text-white/35 px-1">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nivel de detalle */}
          <div className="mb-5">
            <p className={labelCls}>Nivel de detalle</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {DETALLES.map(({ id, label, desc }) => (
                <div key={id} className="flex flex-col items-start gap-0.5">
                  <Chip
                    label={label}
                    active={prefs.ia.detalle === id}
                    onClick={() => setIA({ detalle: id })}
                  />
                  <span className="text-[11px] text-white/35 px-1">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Idioma */}
          <div>
            <p className={labelCls}>Idioma de respuesta</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {IDIOMAS.map(({ id, label }) => (
                <Chip
                  key={id}
                  label={label}
                  active={prefs.ia.idioma === id}
                  onClick={() => setIA({ idioma: id })}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Cambiar email */}
        <div className="qe-card rounded-2xl p-5 md:p-6">
          <h2 className="text-[15px] font-semibold text-white mb-1 flex items-center gap-2">
            <Mail size={15} className="text-white/50" />
            Cambiar email
          </h2>
          <p className="text-[12.5px] text-white/40 mb-4">Te enviaremos un enlace al nuevo email para confirmar el cambio.</p>
          <div className="space-y-4">
            {emailResult && (
              <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13.5px] font-medium border
                ${emailResult.tipo === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                {emailResult.tipo === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                <span>{emailResult.msg}</span>
              </div>
            )}
            <div>
              <label className={labelCls}>Nuevo email</label>
              <input
                type="email" autoComplete="email" maxLength={254}
                value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)}
                className={inputCls} placeholder="nuevo@email.com"
              />
            </div>
            <div>
              <label className={labelCls}>Contraseña actual</label>
              <input
                type="password" autoComplete="current-password"
                value={passEmail} onChange={e => setPassEmail(e.target.value)}
                className={inputCls} placeholder="••••••••"
              />
            </div>
            <button
              onClick={handleCambiarEmail}
              disabled={cambiandoEmail}
              className="w-full rounded-xl bg-[#25D366] text-[#062810] font-semibold py-3.5 text-[15px]
                         hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50"
            >
              {cambiandoEmail ? 'Enviando enlace...' : 'Enviar enlace de verificación'}
            </button>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="qe-card rounded-2xl p-5 md:p-6">
          <h2 className="text-[15px] font-semibold text-white mb-4">Cambiar contraseña</h2>
          <div className="space-y-4">
            {resultado && (
              <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13.5px] font-medium border
                ${resultado.tipo === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                {resultado.tipo === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {resultado.msg}
              </div>
            )}
            <div>
              <label className={labelCls}>Contraseña actual</label>
              <input type="password" value={actual} onChange={e => setActual(e.target.value)} className={inputCls} placeholder="••••••••" />
            </div>
            <div>
              <label className={labelCls}>Nueva contraseña</label>
              <input type="password" value={nueva} onChange={e => setNueva(e.target.value)} className={inputCls} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className={labelCls}>Confirmar nueva contraseña</label>
              <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} className={inputCls} placeholder="Repite la nueva contraseña" />
            </div>
            <div className="pt-1">
              <button
                onClick={handleCambiarPassword}
                disabled={guardando}
                className="w-full rounded-xl bg-[#25D366] text-[#062810] font-semibold py-3.5 text-[15px]
                           hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50"
              >
                {guardando ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </div>
        </div>

        {/* Privacidad y datos */}
        <div className="qe-card rounded-2xl p-5 md:p-6">
          <h2 className="text-[15px] font-semibold text-white mb-1 flex items-center gap-2">
            <Download size={15} className="text-white/50" />
            Tus datos
          </h2>
          <p className="text-[12.5px] text-white/40 mb-4">
            RGPD: descarga tus datos en JSON o solicita la eliminación de tu cuenta.
          </p>
          <button
            onClick={handleExportar}
            disabled={exportando}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 text-white/80 font-semibold py-3 text-[14px]
                       hover:bg-white/5 transition disabled:opacity-50"
          >
            <Download size={15} />
            {exportando ? 'Preparando descarga...' : 'Descargar mis datos (JSON)'}
          </button>
          <p className="text-[11.5px] text-white/30 mt-2.5 leading-[1.55]">
            Incluye perfil, historial de chat, lista de documentos y diagnósticos. No incluye archivos PDF originales.
          </p>
        </div>

        <NotificacionesPanel />

        {/* Zona de peligro */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 md:p-6 lg:col-span-2">
          <h2 className="text-[15px] font-semibold text-red-300 mb-1 flex items-center gap-2">
            <Trash2 size={15} />
            Zona de peligro
          </h2>
          <p className="text-[12.5px] text-red-300/70 mb-4 leading-[1.55]">
            Eliminar tu cuenta borra permanentemente tu perfil, chats, documentos subidos y diagnósticos.
            Esta acción no se puede deshacer.
          </p>
          <button
            onClick={() => { setConfirmDeleteOpen(true); setDeleteError(''); setTextoConfirma(''); setPassDelete(''); }}
            className="rounded-xl border border-red-500/40 text-red-300 font-semibold px-4 py-2.5 text-[13.5px]
                       hover:bg-red-500/10 transition"
          >
            Eliminar mi cuenta
          </button>
        </div>
        </div>
      </div>

      {/* Modal eliminar cuenta */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-[460px] rounded-2xl border border-red-500/30 bg-[#111111] p-6">
            <h3 className="text-[17px] font-semibold text-white mb-1">Eliminar cuenta permanentemente</h3>
            <p className="text-[13px] text-white/55 mb-4 leading-[1.55]">
              Se borrarán: perfil, chat con Mia, documentos subidos y diagnósticos.
              Esta acción es irreversible.
            </p>

            {deleteError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-[13px] text-red-400 mb-4">
                <AlertCircle size={14} className="shrink-0" />
                {deleteError}
              </div>
            )}

            <div className="space-y-3 mb-5">
              <div>
                <label className={labelCls}>Contraseña</label>
                <input
                  type="password" autoComplete="current-password"
                  value={passDelete} onChange={e => setPassDelete(e.target.value)}
                  className={inputCls} placeholder="Tu contraseña actual"
                />
              </div>
              <div>
                <label className={labelCls}>Escribe "BORRAR" para confirmar</label>
                <input
                  type="text" autoComplete="off"
                  value={textoConfirma} onChange={e => setTextoConfirma(e.target.value)}
                  className={inputCls} placeholder="BORRAR"
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={borrando}
                className="flex-1 rounded-xl border border-white/15 text-white/70 font-semibold py-2.5 text-[13.5px] hover:bg-white/5 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarCuenta}
                disabled={borrando}
                className="flex-1 rounded-xl bg-red-500 text-white font-bold py-2.5 text-[13.5px] hover:bg-red-600 transition disabled:opacity-50"
              >
                {borrando ? 'Eliminando...' : 'Eliminar para siempre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
