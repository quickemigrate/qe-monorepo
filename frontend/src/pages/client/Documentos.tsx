import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Upload, Trash2, FileText, File, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import ClientLayout from '../../components/client/ClientLayout';
import { useClientePlan } from '../../hooks/useClientePlan';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Documento {
  id: string;
  nombre: string;
  etiqueta: string;
  tipo: string;
  tamaño: number;
  tieneTexto: boolean;
  creadoEn: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_DOCS: Record<string, number> = { pro: 5, premium: 10 };

export default function Documentos() {
  const { plan, loading: loadingPlan } = useClientePlan();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [docs, setDocs] = useState<Documento[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [etiqueta, setEtiqueta] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!loadingPlan && plan === 'starter') navigate('/cliente/plan', { replace: true });
  }, [plan, loadingPlan]);

  useEffect(() => {
    if (!loadingPlan && plan && plan !== 'starter') fetchDocs();
  }, [loadingPlan, plan]);

  const fetchDocs = async () => {
    setLoadingDocs(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/documentos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data.data);
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) { setError('Selecciona un archivo.'); return; }
    setError(''); setSuccess('');
    setUploading(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append('archivo', archivo);
      form.append('etiqueta', etiqueta);
      const res = await fetch(`${API}/api/documentos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        setDocs(prev => [data.data, ...prev]);
        setArchivo(null);
        setEtiqueta('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSuccess('Documento subido. La IA ya puede referenciarlo en el chat.');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.error || 'Error al subir el documento.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const token = await getToken();
      await fetch(`${API}/api/documentos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setArchivo(f);
  };

  if (loadingPlan || (plan && plan === 'starter')) return null;

  const maxDocs = MAX_DOCS[plan || 'pro'] || 5;
  const limite = docs.length >= maxDocs;

  return (
    <ClientLayout>
      <div className="p-4 lg:p-8 max-w-[680px]">
        <div className="mb-8">
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-[-0.025em] text-white">Mis Documentos</h1>
          <p className="text-[14px] text-white/50 mt-1">
            Sube tus documentos para que la IA los tenga en cuenta al responder.
          </p>
        </div>

        {/* Upload form */}
        {!limite && (
          <div className="qe-card rounded-2xl p-6 mb-6">
            <h2 className="text-[14px] font-semibold text-white mb-4">Subir documento</h2>

            {error && (
              <div className="flex items-center gap-2.5 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13px] text-red-400">
                <AlertCircle size={15} />
                {error}
                <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400"><X size={14} /></button>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2.5 mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/20 px-4 py-3 text-[13px] text-emerald-400">
                <CheckCircle2 size={15} />
                {success}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
                  cursor-pointer transition-colors py-8 px-4 text-center
                  ${dragging ? 'border-[#25D366]/60 bg-[#25D366]/5' : 'border-white/10 hover:border-white/20 bg-white/3'}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={e => setArchivo(e.target.files?.[0] || null)}
                />
                {archivo ? (
                  <>
                    <FileText size={24} className="text-[#25D366]" />
                    <p className="text-[13.5px] font-medium text-white">{archivo.name}</p>
                    <p className="text-[12px] text-white/40">{formatBytes(archivo.size)}</p>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setArchivo(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="absolute top-2 right-2 text-white/30 hover:text-white transition"
                    >
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload size={22} className="text-white/30" />
                    <p className="text-[13.5px] text-white/50">
                      Arrastra un archivo aquí o <span className="text-[#25D366] font-medium">haz click</span>
                    </p>
                    <p className="text-[12px] text-white/30">PDF o TXT · máx. 5 MB</p>
                  </>
                )}
              </div>

              {/* Label */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1.5">
                  Etiqueta <span className="normal-case font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={etiqueta}
                  onChange={e => setEtiqueta(e.target.value)}
                  placeholder="Ej: Pasaporte, Oferta de trabajo, Título universitario..."
                  maxLength={100}
                  className="w-full rounded-xl border border-white/15 bg-[#0A0A0A] px-4 py-2.5
                             text-[13.5px] text-white placeholder:text-white/25
                             focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 transition"
                />
              </div>

              <button
                type="submit"
                disabled={!archivo || uploading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] text-[#062810]
                           text-[13.5px] font-semibold hover:bg-[#2adc6c] transition disabled:opacity-40"
              >
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {uploading ? 'Subiendo...' : 'Subir documento'}
              </button>
            </form>
          </div>
        )}

        {/* Document list */}
        <div className="qe-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 className="text-[14px] font-semibold text-white">Documentos subidos</h2>
            <span className="text-[12px] text-white/40">{docs.length} / {maxDocs}</span>
          </div>

          {loadingDocs ? (
            <div className="flex items-center justify-center gap-2 py-10 text-white/30">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[13px]">Cargando...</span>
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <FolderOpen size={22} className="text-white/20" />
              </div>
              <p className="text-[13.5px] text-white/40">
                Aún no has subido ningún documento.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/6">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                    {doc.tipo === 'application/pdf'
                      ? <FileText size={15} className="text-white/50" />
                      : <File size={15} className="text-white/50" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-white truncate">
                      {doc.etiqueta || doc.nombre}
                    </p>
                    <p className="text-[11.5px] text-white/35">
                      {doc.etiqueta && <span className="mr-1.5">{doc.nombre} ·</span>}
                      {formatBytes(doc.tamaño)}
                      {doc.tieneTexto && <span className="ml-1.5 text-[#25D366]">· IA activa</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="shrink-0 p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
                  >
                    {deletingId === doc.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}

          {limite && (
            <div className="px-5 py-3.5 border-t border-white/8 text-[12.5px] text-white/40">
              Has alcanzado el límite de {maxDocs} documentos. Elimina uno para subir otro.
            </div>
          )}
        </div>

        <p className="mt-4 text-[12px] text-white/25 leading-relaxed">
          La IA usa el texto extraído de tus documentos para personalizar sus respuestas. Los documentos escaneados sin texto embebido no pueden ser leídos por la IA.
        </p>
      </div>
    </ClientLayout>
  );
}
