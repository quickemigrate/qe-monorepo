import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MessageCircle, FolderOpen, FileText, Settings, LogOut, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

interface Cmd {
  id: string;
  label: string;
  sub?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const cmds: Cmd[] = [
    { id: 'inicio',      label: 'Inicio',         sub: 'Panel principal',          icon: <Home size={16} />,          action: () => navigate('/cliente/inicio') },
    { id: 'chat',        label: 'Asistente IA',   sub: 'Habla con Mia',            icon: <MessageCircle size={16} />, action: () => navigate('/cliente/chat') },
    { id: 'documentos',  label: 'Mis Documentos', sub: 'Archivos y expediente',    icon: <FolderOpen size={16} />,    action: () => navigate('/cliente/documentos') },
    { id: 'expediente',  label: 'Mi Expediente',  sub: 'Estado de tu proceso',     icon: <FileText size={16} />,      action: () => navigate('/cliente/expediente') },
    { id: 'perfil',      label: 'Mi Perfil',      sub: 'Ajustes y personalización',icon: <Settings size={16} />,      action: () => navigate('/cliente/perfil') },
    { id: 'salir',       label: 'Cerrar sesión',  sub: '',                          icon: <LogOut size={16} />,        action: () => signOut(auth) },
  ];

  const filtered = query
    ? cmds.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || (c.sub ?? '').toLowerCase().includes(query.toLowerCase()))
    : cmds;

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  const run = (cmd: Cmd) => { cmd.action(); onClose(); };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) run(filtered[selected]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] rounded-2xl shadow-2xl w-full max-w-[480px] mx-4 overflow-hidden border border-white/10">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
          <span className="text-white/30 text-[12px] font-mono shrink-0">⌘K</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Buscar o navegar..."
            className="flex-1 text-[14.5px] text-white placeholder:text-white/30 focus:outline-none bg-transparent"
          />
          <button onClick={onClose} className="text-white/30 hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="py-1.5 max-h-[300px] overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-[13px] text-white/40 text-center py-6">Sin resultados</p>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => run(cmd)}
              onMouseEnter={() => setSelected(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                ${i === selected ? 'bg-white/8' : ''}`}
            >
              <span className={`shrink-0 ${i === selected ? 'text-white' : 'text-white/40'}`}>
                {cmd.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-white truncate">{cmd.label}</p>
                {cmd.sub && <p className="text-[11.5px] text-white/40 truncate">{cmd.sub}</p>}
              </div>
              {i === selected && (
                <kbd className="shrink-0 text-[11px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-mono">↵</kbd>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
