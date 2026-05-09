import { useMemo, useState } from 'react';
import { Bell, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const PAISES = [
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador',
  'El Salvador', 'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá',
  'Paraguay', 'Perú', 'República Dominicana', 'Uruguay', 'Venezuela',
];

const inputCls = `w-full rounded-xl border border-white/15 px-4 py-3 text-[14.5px] text-white
                  bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 transition placeholder-white/25`;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1.5';

interface SendResult {
  enviados: number;
  fallidos: number;
  suscriptores: number;
  limpiados?: number;
}

export default function Notificaciones() {
  const { getToken } = useAuth();
  const [pais, setPais] = useState('');
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [url, setUrl] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const urlValid = url === '' || url.startsWith('/');
  const formValid = pais && titulo.trim() && cuerpo.trim() && urlValid;
  const tituloLen = titulo.length;
  const cuerpoLen = cuerpo.length;

  const previewUrl = useMemo(() => url.trim() || '/cliente/inicio', [url]);

  const reset = () => {
    setTitulo('');
    setCuerpo('');
    setUrl('');
    setResult(null);
    setError(null);
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sin sesión');
      const res = await fetch(`${API}/api/notificaciones/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pais,
          titulo: titulo.trim(),
          cuerpo: cuerpo.trim(),
          url: url.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al enviar');
      setResult({
        enviados: data.enviados,
        fallidos: data.fallidos,
        suscriptores: data.suscriptores,
        limpiados: data.limpiados,
      });
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1100px] mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 grid place-items-center text-[#25D366]">
            <Bell size={20} />
          </div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-white">Notificaciones push</h1>
        </div>
        <p className="text-white/50 text-[14px] mb-8">
          Envía un cambio de normativa a los suscriptores de un país.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form */}
          <div className="rounded-2xl bg-[#111111] border border-white/10 p-6 space-y-5">
            <div>
              <label className={labelCls}>País</label>
              <select
                value={pais}
                onChange={e => setPais(e.target.value)}
                className={inputCls}
              >
                <option value="">Selecciona un país…</option>
                {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`${labelCls} mb-0`}>Título</label>
                <span className={`text-[11px] ${tituloLen > 200 ? 'text-red-400' : 'text-white/30'}`}>
                  {tituloLen}/200
                </span>
              </div>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value.slice(0, 200))}
                placeholder="Cambio en visado no lucrativo"
                className={inputCls}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`${labelCls} mb-0`}>Cuerpo</label>
                <span className={`text-[11px] ${cuerpoLen > 500 ? 'text-red-400' : 'text-white/30'}`}>
                  {cuerpoLen}/500
                </span>
              </div>
              <textarea
                value={cuerpo}
                onChange={e => setCuerpo(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="El consulado actualizó los requisitos de solvencia económica…"
                className={`${inputCls} resize-none`}
              />
            </div>

            <div>
              <label className={labelCls}>URL destino (opcional)</label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="/cliente/inicio"
                className={inputCls}
              />
              {!urlValid && (
                <p className="mt-1.5 text-[12px] text-red-400">Debe empezar con / (ruta interna)</p>
              )}
              <p className="mt-1.5 text-[11px] text-white/30">
                Por defecto: /cliente/inicio
              </p>
            </div>

            <button
              disabled={!formValid || sending}
              onClick={() => setConfirmOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] text-[#062810] font-bold px-6 py-3.5 text-[14.5px] hover:bg-[#2adc6c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
              Enviar notificación
            </button>
          </div>

          {/* Preview + Result */}
          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-3">
                Vista previa
              </div>
              <div className="rounded-2xl bg-[#0A0A0A] border border-white/10 p-5">
                <div className="flex items-start gap-3">
                  <img src="/logo-dark.png" alt="QE" className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[12px] font-semibold text-white/70">Quick Emigrate</span>
                      <span className="text-[11px] text-white/30">ahora</span>
                    </div>
                    <div className="text-[14.5px] font-semibold text-white truncate">
                      {titulo || 'Título de la notificación'}
                    </div>
                    <div className="mt-1 text-[13px] text-white/55 leading-[1.45] line-clamp-3">
                      {cuerpo || 'Cuerpo del mensaje que verá el suscriptor en la notificación push.'}
                    </div>
                    <div className="mt-2 text-[11px] text-white/30 truncate">
                      → {previewUrl}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {result && (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-5">
                <div className="flex items-center gap-2 text-emerald-400 mb-3">
                  <CheckCircle2 size={18} />
                  <span className="font-semibold text-[14px]">Notificación enviada</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <div className="text-white/40 text-[11px] uppercase tracking-[0.1em]">Suscriptores</div>
                    <div className="text-white font-bold text-[20px]">{result.suscriptores}</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-[11px] uppercase tracking-[0.1em]">Enviados OK</div>
                    <div className="text-emerald-400 font-bold text-[20px]">{result.enviados}</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-[11px] uppercase tracking-[0.1em]">Fallidos</div>
                    <div className={`${result.fallidos > 0 ? 'text-amber-400' : 'text-white/60'} font-bold text-[20px]`}>
                      {result.fallidos}
                    </div>
                  </div>
                  {typeof result.limpiados === 'number' && result.limpiados > 0 && (
                    <div>
                      <div className="text-white/40 text-[11px] uppercase tracking-[0.1em]">Tokens limpiados</div>
                      <div className="text-white/70 font-bold text-[20px]">{result.limpiados}</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={reset}
                  className="mt-4 text-[12px] text-white/50 hover:text-white transition-colors"
                >
                  Enviar otra
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-5">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={18} />
                  <span className="font-semibold text-[14px]">{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => !sending && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#111111] border border-white/15 p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-[18px] font-bold text-white mb-2">Confirmar envío</h2>
            <p className="text-[14px] text-white/60 leading-[1.55]">
              Vas a enviar esta notificación a los suscriptores de <span className="text-white font-semibold">{pais}</span>. Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                disabled={sending}
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2.5 rounded-full text-[13.5px] font-semibold text-white/60 hover:text-white transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                disabled={sending}
                onClick={handleSend}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-[#062810] font-bold text-[13.5px] hover:bg-[#2adc6c] transition-colors disabled:opacity-50"
              >
                {sending ? 'Enviando…' : (<><Send size={14} /> Confirmar envío</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
