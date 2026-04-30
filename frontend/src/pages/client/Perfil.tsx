import { useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import ClientLayout from '../../components/client/ClientLayout';
import { useAuth } from '../../context/AuthContext';
import {
  usePreferencias, TEMAS,
  type TemaId, type Tono, type Detalle, type IdiomaIA,
} from '../../hooks/usePreferencias';

const inputCls = `w-full rounded-xl border border-black/10 px-4 py-3 text-[14.5px] text-on-background
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition`;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-1.5';

function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[13.5px] font-semibold transition-all border
        ${active
          ? 'bg-on-background text-white border-on-background scale-[1.03] shadow-sm'
          : 'bg-white text-on-background/60 border-black/10 hover:border-black/20 hover:text-on-background'
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
  const { user } = useAuth();
  const { prefs, tema, setTema, setIA } = usePreferencias();

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
      <div className="p-8 max-w-[640px] space-y-6">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background">
          Mi Perfil
        </h1>

        {/* Datos de cuenta */}
        <div className="bg-white rounded-2xl border border-black/5 p-6">
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

        {/* Tema del panel */}
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          <h2 className="text-[15px] font-semibold text-on-background mb-1">Apariencia</h2>
          <p className="text-[13px] text-on-background/40 mb-5">Elige el tema de tu panel</p>
          <div className="grid grid-cols-3 gap-3">
            {(Object.values(TEMAS)).map(t => {
              const active = prefs.tema === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTema(t.id as TemaId)}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all
                    ${active ? 'border-on-background shadow-md scale-[1.02]' : 'border-transparent hover:border-black/15'}`}
                >
                  {/* Preview swatch */}
                  <div
                    className="h-16 w-full"
                    style={{ background: t.preview }}
                  />
                  {/* Accent dot */}
                  <div
                    className="absolute top-2 right-2 w-3 h-3 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: t.accent }}
                  />
                  <div className="px-3 py-2 bg-white">
                    <p className="text-[12.5px] font-semibold text-on-background text-left">{t.name}</p>
                  </div>
                  {active && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                      <CheckCircle2 size={13} className="text-on-background" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Personalización IA */}
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          <h2 className="text-[15px] font-semibold text-on-background mb-1">Asistente IA</h2>
          <p className="text-[13px] text-on-background/40 mb-6">Ajusta cómo responde Mia a tus preguntas</p>

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
                  <span className="text-[11px] text-on-background/35 px-1">{desc}</span>
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
                  <span className="text-[11px] text-on-background/35 px-1">{desc}</span>
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
