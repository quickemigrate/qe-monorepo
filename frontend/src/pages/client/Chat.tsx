import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, Loader2 } from 'lucide-react';
import ClientLayout from '../../components/client/ClientLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

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

export default function Chat() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [estado, setEstado] = useState<EstadoChat | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [loadingEstado, setLoadingEstado] = useState(true);
  const [errorEstado, setErrorEstado] = useState(false);
  const [consentimientoPendiente, setConsentimientoPendiente] = useState(false);

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

  const fetchHistorial = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API}/api/chat/historial`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setMensajes(data.data || []);
    }
  };

  useEffect(() => {
    fetchEstado();
    fetchHistorial();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

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

  const handleEnviar = async () => {
    if (!input.trim() || enviando) return;
    const texto = input.trim();
    setInput('');
    setEnviando(true);

    const msgUsuario: Mensaje = { role: 'user', contenido: texto, timestamp: new Date().toISOString() };
    setMensajes(prev => [...prev, msgUsuario]);

    const token = await getToken();
    try {
      const res = await fetch(`${API}/api/chat/mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mensaje: texto }),
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
    } catch {
      setMensajes(prev => [...prev, {
        role: 'assistant',
        contenido: '⚠️ Error de conexión. Inténtalo de nuevo.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setEnviando(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  if (loadingEstado) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64 gap-2 text-on-background/40">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-[14px]">Cargando asistente...</span>
        </div>
      </ClientLayout>
    );
  }

  if (errorEstado || !estado) {
    return (
      <ClientLayout>
        <div className="bg-white rounded-2xl border border-black/5 p-8 text-center">
          <p className="text-[14px] text-on-background/50">
            No se pudo cargar el estado del asistente. Inténtalo de nuevo más tarde.
          </p>
        </div>
      </ClientLayout>
    );
  }

  // Plan starter — redirigir a /cliente/plan
  if (estado.plan === 'starter') {
    navigate('/cliente/plan', { replace: true });
    return null;
  }

  const limiteAlcanzado = estado.mensajesUsados >= estado.mensajesLimit;

  return (
    <ClientLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] max-h-[800px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-on-background flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold text-on-background leading-tight">
                Asistente de Inmigración
              </h1>
              <p className="text-[12px] text-on-background/40">Quick Emigrate IA</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12px] text-on-background/40">Mensajes utilizados</div>
            <div className="text-[13px] font-semibold text-on-background">
              {estado.mensajesUsados}
              <span className="text-on-background/40 font-normal"> / {estado.mensajesLimit}</span>
            </div>
            <div className="mt-1 h-1 w-24 rounded-full bg-black/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-container transition-all"
                style={{ width: `${Math.min((estado.mensajesUsados / estado.mensajesLimit) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Banner consentimiento */}
        {consentimientoPendiente && (
          <div className="bg-on-background rounded-2xl p-4 mb-4 text-white">
            <p className="text-[13.5px] font-medium mb-3">
              ¿Quieres que el asistente tenga acceso a tu diagnóstico previo para darte respuestas más personalizadas?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleConsentimiento(true)}
                className="flex-1 py-2 rounded-xl bg-primary-container text-on-background text-[13px] font-semibold
                           hover:opacity-90 transition"
              >
                Sí, permitir acceso
              </button>
              <button
                onClick={() => handleConsentimiento(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-white text-[13px] font-semibold
                           hover:bg-white/15 transition"
              >
                No, preferir privacidad
              </button>
            </div>
          </div>
        )}

        {/* Área de mensajes */}
        <div className="flex-1 bg-white rounded-2xl border border-black/5 overflow-y-auto p-5 space-y-4 mb-3">
          {mensajes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center">
                <Bot size={20} className="text-on-background/30" />
              </div>
              <p className="text-[14px] text-on-background/40 max-w-[300px]">
                Hola, soy tu asistente de inmigración. Pregúntame cualquier cosa sobre tu proceso de emigración a España.
              </p>
            </div>
          )}

          {mensajes.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[14px] leading-[1.6] ${
                msg.role === 'user'
                  ? 'bg-primary-container text-on-background rounded-br-sm'
                  : 'bg-surface-container-low text-on-background rounded-bl-sm'
              }`}>
                {msg.contenido}
              </div>
            </div>
          ))}

          {enviando && (
            <div className="flex justify-start">
              <div className="bg-surface-container-low rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-background/30 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-on-background/30 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-on-background/30 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {limiteAlcanzado ? (
          <div className="bg-white rounded-2xl border border-black/5 px-4 py-3 text-center text-[13.5px] text-on-background/50">
            Has alcanzado el límite de {estado.mensajesLimit} mensajes de tu plan.
          </div>
        ) : (
          <div className="flex gap-2 bg-white rounded-2xl border border-black/5 p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta... (Enter para enviar)"
              rows={1}
              disabled={enviando}
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] text-on-background
                         placeholder:text-on-background/30 focus:outline-none disabled:opacity-50"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={handleEnviar}
              disabled={!input.trim() || enviando}
              className="w-10 h-10 self-end rounded-xl bg-on-background text-white flex items-center justify-center
                         hover:opacity-90 active:scale-95 transition disabled:opacity-30 shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
