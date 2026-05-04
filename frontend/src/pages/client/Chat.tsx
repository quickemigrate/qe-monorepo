import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Loader2, Copy, Check, Search, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ClientLayout from '../../components/client/ClientLayout';
import { useAuth } from '../../context/AuthContext';
import { usePreferencias } from '../../hooks/usePreferencias';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const QUICK_PROMPTS = [
  '¿Qué documentos necesito para mi caso?',
  '¿Cuánto tiempo tarda el proceso?',
  '¿Cuánto cuesta en total?',
  '¿Cuál es la ruta más rápida para residir legalmente?',
];

interface Mensaje {
  id?: string;
  role: 'user' | 'assistant';
  contenido: string;
  timestamp: string;
}

interface EstadoChat {
  plan: string;
  mensajesUsados: number;
  mensajesLimit: number;
  consentimientoDiagnostico: boolean;
  diagnosticoId: string | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      title="Copiar respuesta"
      className="opacity-0 group-hover:opacity-100 transition-opacity mt-1.5 self-end
                 flex items-center gap-1 text-[11.5px] text-white/40 hover:text-white px-1.5 py-0.5 rounded-lg hover:bg-white/8"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

export default function Chat() {
  const { getToken } = useAuth();
  const { prefs } = usePreferencias();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [estado, setEstado] = useState<EstadoChat | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [loadingMas, setLoadingMas] = useState(false);
  const [cursorBefore, setCursorBefore] = useState<string | undefined>(undefined);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [loadingEstado, setLoadingEstado] = useState(true);
  const [errorEstado, setErrorEstado] = useState(false);
  const [consentimientoPendiente, setConsentimientoPendiente] = useState(false);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchEstado = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/chat/estado`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEstado(data.data);
        setConsentimientoPendiente(!data.data.consentimientoDiagnostico && !!data.data.diagnosticoId);
      } else {
        setErrorEstado(true);
      }
    } catch {
      setErrorEstado(true);
    } finally {
      setLoadingEstado(false);
    }
  };

  const scrollToBottom = (smooth = false) => {
    const c = containerRef.current;
    if (!c) return;
    if (smooth) {
      c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' });
    } else {
      c.scrollTop = c.scrollHeight;
    }
  };

  const fetchHistorial = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API}/api/chat/historial?limit=30`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const msgs: Mensaje[] = data.data || [];
      setMensajes(msgs);
      setHayMas(data.hasMore || false);
      if (msgs.length > 0) setCursorBefore(msgs[0].timestamp);
      // instant scroll to bottom after paint
      requestAnimationFrame(() => scrollToBottom(false));
    }
  };

  const cargarMensajesAnteriores = async () => {
    if (!cursorBefore || loadingMas || !hayMas) return;
    setLoadingMas(true);
    const token = await getToken();
    if (!token) { setLoadingMas(false); return; }
    try {
      const res = await fetch(
        `${API}/api/chat/historial?limit=30&before=${encodeURIComponent(cursorBefore)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        const anteriores: Mensaje[] = data.data || [];
        if (anteriores.length > 0) {
          const c = containerRef.current;
          const scrollHeightAntes = c?.scrollHeight ?? 0;
          setMensajes(prev => [...anteriores, ...prev]);
          setCursorBefore(anteriores[0].timestamp);
          setHayMas(data.hasMore || false);
          // restore scroll position so user stays at same message
          requestAnimationFrame(() => {
            if (c) c.scrollTop = c.scrollHeight - scrollHeightAntes;
          });
        }
      }
    } finally {
      setLoadingMas(false);
    }
  };

  const handleScroll = () => {
    const c = containerRef.current;
    if (!c || loadingMas || !hayMas) return;
    if (c.scrollTop < 80) cargarMensajesAnteriores();
  };

  useEffect(() => {
    fetchEstado();
    fetchHistorial();
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const handleConsentimiento = async (acepta: boolean) => {
    const token = await getToken();
    if (!token) return;
    await fetch(`${API}/api/chat/consentimiento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ acepta }),
    });
    setConsentimientoPendiente(false);
    setEstado(prev => prev ? { ...prev, consentimientoDiagnostico: acepta } : prev);
  };

  const handleEnviar = async (texto?: string) => {
    const msg = (texto ?? input).trim();
    if (!msg || enviando) return;
    setInput('');
    setEnviando(true);

    const msgUsuario: Mensaje = { role: 'user', contenido: msg, timestamp: new Date().toISOString() };
    setMensajes(prev => [...prev, msgUsuario]);
    requestAnimationFrame(() => scrollToBottom(false));

    const token = await getToken();
    try {
      const res = await fetch(`${API}/api/chat/mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mensaje: msg, preferenciasIA: prefs.ia }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensajes(prev => [...prev, {
          role: 'assistant',
          contenido: data.data.respuesta,
          timestamp: new Date().toISOString(),
        }]);
        setEstado(prev => prev ? { ...prev, mensajesUsados: prev.mensajesUsados + 1 } : prev);
      } else {
        setMensajes(prev => [...prev, {
          role: 'assistant',
          contenido: `⚠️ ${data.error || 'Error al procesar tu mensaje.'}`,
          timestamp: new Date().toISOString(),
        }]);
      }
      requestAnimationFrame(() => scrollToBottom(false));
    } catch {
      setMensajes(prev => [...prev, {
        role: 'assistant',
        contenido: '⚠️ Error de conexión. Inténtalo de nuevo.',
        timestamp: new Date().toISOString(),
      }]);
      requestAnimationFrame(() => scrollToBottom(false));
    } finally {
      setEnviando(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(); }
  };

  const mensajesFiltrados = searchQuery
    ? mensajes.filter(m => m.contenido.toLowerCase().includes(searchQuery.toLowerCase()))
    : mensajes;

  const pct = estado ? Math.min((estado.mensajesUsados / estado.mensajesLimit) * 100, 100) : 0;
  const barColor = pct >= 80 ? '#ef4444' : pct >= 60 ? '#f97316' : '#22c55e';

  if (loadingEstado) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64 gap-2 text-white/40">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-[14px]">Cargando asistente...</span>
        </div>
      </ClientLayout>
    );
  }

  if (errorEstado || !estado) {
    return (
      <ClientLayout>
        <div className="qe-card rounded-2xl p-8 text-center">
          <p className="text-[14px] text-white/50">
            No se pudo cargar el estado del asistente. Inténtalo de nuevo más tarde.
          </p>
        </div>
      </ClientLayout>
    );
  }

  if (estado.plan === 'starter') {
    navigate('/cliente/plan', { replace: true });
    return null;
  }

  const limiteAlcanzado = estado.mensajesUsados >= estado.mensajesLimit;

  return (
    <ClientLayout>
      <div className="flex flex-col h-[100dvh] lg:h-screen p-4 lg:p-8 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
              <img src="/mia-avatar.png" alt="Mia" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold text-white leading-tight">
                Asistente de Inmigración
              </h1>
              <p className="text-[12px] text-white/40">Quick Emigrate IA</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search toggle */}
            {mensajes.length > 0 && (
              <button
                onClick={() => { setSearchOpen(s => !s); if (searchOpen) setSearchQuery(''); }}
                className={`p-2 rounded-xl transition-colors ${searchOpen ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white hover:bg-white/8'}`}
                title="Buscar en historial"
              >
                <Search size={16} />
              </button>
            )}

            {/* Limit bar */}
            <div className="text-right">
              <div className="text-[12px] text-white/40">Mensajes</div>
              <div className="text-[13px] font-semibold text-white">
                {estado.mensajesUsados}
                <span className="text-white/40 font-normal"> / {estado.mensajesLimit}</span>
              </div>
              <div className="mt-1 h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="flex items-center gap-2 qe-card rounded-2xl px-4 py-2.5 mb-3">
            <Search size={14} className="text-white/30 shrink-0" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar en el historial..."
              className="flex-1 text-[13.5px] text-white placeholder:text-white/30 focus:outline-none bg-transparent"
            />
            {searchQuery && (
              <span className="text-[12px] text-white/40 shrink-0">
                {mensajesFiltrados.length} resultado{mensajesFiltrados.length !== 1 ? 's' : ''}
              </span>
            )}
            <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="text-white/30 hover:text-white transition">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Consentimiento */}
        {consentimientoPendiente && (
          <div className="qe-card rounded-2xl p-4 mb-4 text-white">
            <p className="text-[13.5px] font-medium mb-3">
              ¿Quieres que el asistente tenga acceso a tu diagnóstico previo para darte respuestas más personalizadas?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleConsentimiento(true)}
                className="flex-1 py-2 rounded-xl bg-[#25D366] text-[#062810] text-[13px] font-semibold hover:bg-[#2adc6c] transition"
              >
                Sí, permitir acceso
              </button>
              <button
                onClick={() => handleConsentimiento(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-white text-[13px] font-semibold hover:bg-white/15 transition"
              >
                No, preferir privacidad
              </button>
            </div>
          </div>
        )}

        {/* Mensajes */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 qe-card rounded-2xl overflow-y-auto p-5 space-y-4 mb-3 mt-4"
        >
          {loadingMas && (
            <div className="flex justify-center py-2">
              <Loader2 size={16} className="animate-spin text-white/30" />
            </div>
          )}

          {mensajes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-5 py-12">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10">
                <img src="/mia-avatar.png" alt="Mia" className="w-full h-full object-cover" />
              </div>
              <p className="text-[14px] text-white/40 max-w-[300px]">
                Hola, soy tu asistente de inmigración. Pregúntame cualquier cosa sobre tu proceso de emigración a España.
              </p>
              {/* Quick-start prompts */}
              <div className="flex flex-wrap justify-center gap-2 max-w-[420px]">
                {QUICK_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => handleEnviar(p)}
                    disabled={enviando}
                    className="px-3.5 py-2 rounded-xl border border-white/10 text-[12.5px] text-white/60
                               hover:border-white/20 hover:text-white hover:bg-white/8
                               transition-colors text-left disabled:opacity-40"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchQuery && mensajesFiltrados.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-[13.5px] text-white/40">Sin resultados para "{searchQuery}"</p>
            </div>
          )}

          {mensajesFiltrados.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start group'}`}
            >
              {msg.role === 'assistant' ? (
                <div className="flex flex-col max-w-[80%]">
                  <div className="bg-white/8 text-white rounded-2xl rounded-bl-sm px-4 py-3 text-[14px] leading-[1.6]">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="ml-2">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                        code: ({ children }) => (
                          <code className="bg-white/10 rounded px-1 py-0.5 text-sm font-mono">{children}</code>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-[#25D366] pl-3 italic opacity-80 mb-2">{children}</blockquote>
                        ),
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer"
                             className="text-[#25D366] underline hover:opacity-80">{children}</a>
                        ),
                        hr: () => <hr className="border-white/15 my-2" />,
                      }}
                    >
                      {msg.contenido}
                    </ReactMarkdown>
                  </div>
                  <CopyButton text={msg.contenido} />
                </div>
              ) : (
                <div className="max-w-[80%] bg-[#25D366] text-[#062810] rounded-2xl rounded-br-sm px-4 py-3 text-[14px] leading-[1.6]">
                  <p>{msg.contenido}</p>
                </div>
              )}
            </div>
          ))}

          {enviando && (
            <div className="flex justify-start">
              <div className="bg-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {limiteAlcanzado ? (
          <div className="qe-card rounded-2xl px-4 py-3 text-center text-[13.5px] text-white/50">
            Has alcanzado el límite de {estado.mensajesLimit} mensajes de tu plan.
          </div>
        ) : (
          <div className="flex gap-2 qe-card rounded-2xl p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta... (Enter para enviar)"
              rows={1}
              disabled={enviando}
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] text-white
                         placeholder:text-white/30 focus:outline-none disabled:opacity-50"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={() => handleEnviar()}
              disabled={!input.trim() || enviando}
              className="w-10 h-10 self-end rounded-xl bg-[#25D366] text-[#062810] flex items-center justify-center
                         hover:bg-[#2adc6c] active:scale-95 transition disabled:opacity-30 shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
