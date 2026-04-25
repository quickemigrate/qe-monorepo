import { useEffect, useState } from 'react';
import { X, Trash2, Search, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const CATEGORIAS = ['visados', 'permisos_trabajo', 'residencia', 'arraigo', 'nacionalidad', 'general'];
const PAISES = ['Ecuador', 'Colombia', 'Argentina', 'Perú', 'Venezuela', 'México', 'Bolivia', 'general'];

interface Documento {
  id: string;
  titulo: string;
  contenido: string;
  fuente: 'BOE' | 'manual' | any | 'ine_statistics';
  categoria: string;
  pais: string;
  url?: string;
  fechaPublicacion?: string;
  fechaIngesta: string;
}

interface ResultadoBusqueda {
  id: string;
  score: number;
  metadata: {
    titulo: string;
    fuente: string;
    categoria: string;
    pais: string;
    url?: string;
    fechaPublicacion?: string;
  };
}

interface FormData {
  titulo: string;
  contenido: string;
  categoria: string;
  pais: string;
  url: string;
  fechaPublicacion: string;
}

const FORM_INICIAL: FormData = {
  titulo: '',
  contenido: '',
  categoria: 'general',
  pais: 'general',
  url: '',
  fechaPublicacion: '',
};

const inputCls = `w-full rounded-xl border border-black/10 px-4 py-3 text-[14.5px] text-on-background
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition`;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-1.5';

export default function Conocimiento() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<'documentos' | 'buscador'>('documentos');

  // Documentos
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal añadir
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormData>(FORM_INICIAL);
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<'success' | 'error' | null>(null);

  // Buscador
  const [query, setQuery] = useState('');
  const [filtroPais, setFiltroPais] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [searching, setSearching] = useState(false);
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [searchDone, setSearchDone] = useState(false);

  const fetchDocs = async () => {
    setLoadingDocs(true);
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API}/api/conocimiento`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setDocs(data.data || []);
    }
    setLoadingDocs(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento del índice?')) return;
    setDeletingId(id);
    const token = await getToken();
    await fetch(`${API}/api/conocimiento/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeletingId(null);
    fetchDocs();
  };

  const handleIngest = async () => {
    if (!form.titulo || !form.contenido) return;
    setIngesting(true);
    setIngestResult(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/conocimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setIngestResult('success');
      fetchDocs();
      setTimeout(() => {
        setModalOpen(false);
        setForm(FORM_INICIAL);
        setIngestResult(null);
      }, 1500);
    } catch {
      setIngestResult('error');
    } finally {
      setIngesting(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResultados([]);
    setSearchDone(false);
    const token = await getToken();
    const params = new URLSearchParams({ q: query });
    if (filtroPais) params.set('pais', filtroPais);
    if (filtroCategoria) params.set('categoria', filtroCategoria);
    const res = await fetch(`${API}/api/conocimiento/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setResultados(data.data || []);
    }
    setSearching(false);
    setSearchDone(true);
  };

  const closeModal = () => {
    if (ingesting) return;
    setModalOpen(false);
    setForm(FORM_INICIAL);
    setIngestResult(null);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background mb-6">
          Base de Conocimiento Legal
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-black/5 rounded-2xl p-1 w-fit">
          {(['documentos', 'buscador'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-[13.5px] font-semibold transition-colors capitalize
                ${tab === t
                  ? 'bg-on-background text-white'
                  : 'text-on-background/50 hover:text-on-background'
                }`}
            >
              {t === 'documentos' ? 'Documentos' : 'Buscador'}
            </button>
          ))}
        </div>

        {/* ── TAB 1: DOCUMENTOS ── */}
        {tab === 'documentos' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] text-on-background/50">
                {docs.length} documento{docs.length !== 1 ? 's' : ''} en el índice
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 bg-on-background text-white px-4 py-2.5 rounded-xl
                           text-[13.5px] font-semibold hover:opacity-90 active:scale-[0.98] transition"
              >
                <Plus size={15} />
                Añadir Documento
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
              {loadingDocs ? (
                <div className="px-6 py-10 text-center text-on-background/40 text-[14px]">
                  Cargando documentos...
                </div>
              ) : docs.length === 0 ? (
                <div className="px-6 py-10 text-center text-on-background/40 text-[14px]">
                  No hay documentos en el índice aún.
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[600px] text-[13.5px]">
                    <thead>
                      <tr className="border-b border-black/5">
                        {['Título', 'Categoría', 'País', 'Fuente', 'Fecha', ''].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map((doc, i) => (
                        <tr
                          key={doc.id}
                          className={`border-b border-black/4 ${i % 2 !== 0 ? 'bg-surface-container-lowest/40' : ''}`}
                        >
                          <td className="px-5 py-3.5 font-medium text-on-background max-w-[260px] truncate">
                            {doc.titulo}
                          </td>
                          <td className="px-5 py-3.5 text-on-background/60">{doc.categoria}</td>
                          <td className="px-5 py-3.5 text-on-background/60">{doc.pais}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold
                              ${doc.fuente === 'BOE'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                              }`}>
                              {doc.fuente}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-on-background/40 whitespace-nowrap">
                            {doc.fechaPublicacion
                              ? new Date(doc.fechaPublicacion).toLocaleDateString('es-ES')
                              : new Date(doc.fechaIngesta).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleDelete(doc.id)}
                              disabled={deletingId === doc.id}
                              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-red-500
                                         bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors
                                         disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                              {deletingId === doc.id ? 'Eliminando...' : 'Eliminar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: BUSCADOR ── */}
        {tab === 'buscador' && (
          <div>
            <div className="bg-white rounded-2xl border border-black/5 p-6 mb-6">
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className={labelCls}>Consulta *</label>
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Ej: visado no lucrativo para colombianos"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>País (opcional)</label>
                    <select
                      value={filtroPais}
                      onChange={e => setFiltroPais(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Todos los países</option>
                      {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Categoría (opcional)</label>
                    <select
                      value={filtroCategoria}
                      onChange={e => setFiltroCategoria(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Todas las categorías</option>
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !query.trim()}
                className="flex items-center gap-2 bg-on-background text-white px-5 py-2.5 rounded-xl
                           text-[13.5px] font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                <Search size={15} />
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {searchDone && (
              <div className="space-y-3">
                {resultados.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-black/5 px-6 py-10 text-center text-on-background/40 text-[14px]">
                    Sin resultados para esta consulta.
                  </div>
                ) : (
                  resultados.map((r, i) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-black/5 p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-on-background/30 w-5">{i + 1}</span>
                          <h3 className="text-[15px] font-semibold text-on-background">
                            {r.metadata.titulo}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-1.5 rounded-full bg-primary-container"
                              style={{ width: `${Math.round(r.score * 60)}px`, minWidth: '4px', maxWidth: '60px' }}
                            />
                            <span className="text-[12px] font-semibold text-primary-container">
                              {Math.round(r.score * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-8 flex flex-wrap gap-2 text-[12px]">
                        <span className={`px-2 py-0.5 rounded-full font-semibold
                          ${r.metadata.fuente === 'BOE' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {r.metadata.fuente}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-background/60 font-medium">
                          {r.metadata.categoria}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-background/60 font-medium">
                          {r.metadata.pais}
                        </span>
                        {r.metadata.fechaPublicacion && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-background/40 font-medium">
                            {r.metadata.fechaPublicacion}
                          </span>
                        )}
                        {r.metadata.url && (
                          <a
                            href={r.metadata.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium hover:underline"
                          >
                            Ver fuente
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL AÑADIR DOCUMENTO ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-7 py-5 border-b border-black/5">
              <h2 className="text-[18px] font-semibold text-on-background">Añadir Documento</h2>
              <button
                onClick={closeModal}
                className="text-on-background/40 hover:text-on-background transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-4">
              {ingestResult === 'success' && (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-[13.5px] text-emerald-700 font-medium">
                  <CheckCircle2 size={16} />
                  Documento ingestado correctamente en el índice.
                </div>
              )}
              {ingestResult === 'error' && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13.5px] text-red-600 font-medium">
                  <AlertCircle size={16} />
                  Error al ingestar el documento. Inténtalo de nuevo.
                </div>
              )}

              <div>
                <label className={labelCls}>Título *</label>
                <input
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  className={inputCls}
                  placeholder="Ej: Real Decreto 557/2011 — Reglamento de Extranjería"
                />
              </div>

              <div>
                <label className={labelCls}>Contenido *</label>
                <textarea
                  value={form.contenido}
                  onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                  rows={8}
                  className={`${inputCls} resize-y`}
                  placeholder="Pega aquí el texto del documento legal..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Categoría *</label>
                  <select
                    value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    className={inputCls}
                  >
                    {CATEGORIAS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>País *</label>
                  <select
                    value={form.pais}
                    onChange={e => setForm(f => ({ ...f, pais: e.target.value }))}
                    className={inputCls}
                  >
                    {PAISES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>URL fuente (opcional)</label>
                <input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className={inputCls}
                  placeholder="https://www.boe.es/..."
                  type="url"
                />
              </div>

              <div>
                <label className={labelCls}>Fecha publicación (opcional)</label>
                <input
                  value={form.fechaPublicacion}
                  onChange={e => setForm(f => ({ ...f, fechaPublicacion: e.target.value }))}
                  className={inputCls}
                  type="date"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={ingesting}
                  className="flex-1 rounded-xl border border-black/10 font-semibold py-3 text-[14.5px]
                             text-on-background/60 hover:bg-surface-container-low transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleIngest}
                  disabled={ingesting || !form.titulo || !form.contenido}
                  className="flex-1 rounded-xl bg-on-background text-white font-semibold py-3 text-[14.5px]
                             hover:opacity-90 transition disabled:opacity-50"
                >
                  {ingesting ? 'Ingestando...' : 'Ingestar Documento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
