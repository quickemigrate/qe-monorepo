import { useEffect, useState } from 'react';
import { X, Trash2, Search, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const COLECCIONES = [
  { id: 'rutas_migratorias', label: 'Rutas Migratorias' },
  { id: 'requisitos_legales', label: 'Requisitos Legales' },
  { id: 'base_conocimiento', label: 'Base de Conocimiento' },
  { id: 'simulaciones', label: 'Simulaciones' },
  { id: 'casos_reales', label: 'Casos Reales' },
];

const CATEGORIAS_POR_COLECCION: Record<string, string[]> = {
  rutas_migratorias: ['estudios', 'trabajo', 'residencia_no_lucrativa', 'arraigo'],
  requisitos_legales: ['estudios', 'trabajo', 'residencia_no_lucrativa', 'otros'],
  base_conocimiento: ['normativa', 'datos_economicos'],
  simulaciones: ['coste_emigrar', 'probabilidad_exito', 'tiempo_estimado'],
  casos_reales: ['estudios', 'trabajo', 'residencia_no_lucrativa', 'arraigo'],
};

const TODAS_CATEGORIAS = Array.from(
  new Set(Object.values(CATEGORIAS_POR_COLECCION).flat())
).sort();

const PAISES = ['general', 'Ecuador', 'Colombia', 'Argentina', 'Perú', 'Venezuela', 'México', 'Bolivia', 'Chile', 'Uruguay'];

const colLabel = (id: string) => COLECCIONES.find(c => c.id === id)?.label ?? id;

const toDate = (ts: any): string => {
  if (!ts) return '—';
  const secs = ts.seconds ?? ts._seconds;
  if (secs) return new Date(secs * 1000).toLocaleDateString('es-ES');
  if (typeof ts === 'string') return new Date(ts).toLocaleDateString('es-ES');
  return '—';
};

interface Documento {
  id: string;
  _coleccion: string;
  titulo: string;
  contenido: string;
  categoria?: string;
  pais?: string;
  fuente?: string;
  activo?: boolean;
  fechaActualizacion?: any;
  [key: string]: any;
}

interface FormData {
  coleccion: string;
  titulo: string;
  contenido: string;
  categoria: string;
  subcategoria: string;
  pais: string;
  fuente: string;
  activo: boolean;
}

const FORM_INICIAL: FormData = {
  coleccion: 'rutas_migratorias',
  titulo: '',
  contenido: '',
  categoria: 'estudios',
  subcategoria: '',
  pais: 'general',
  fuente: 'manual',
  activo: true,
};

const inputCls = `w-full rounded-xl border border-white/15 px-4 py-3 text-[14.5px] text-white
                  bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 transition placeholder-white/25`;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1.5';

export default function Conocimiento() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<'documentos' | 'buscador'>('documentos');

  const [docs, setDocs] = useState<Documento[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filtroColeccion, setFiltroColeccion] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormData>(FORM_INICIAL);
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<'success' | 'error' | null>(null);

  const [query, setQuery] = useState('');
  const [buscarColeccion, setBuscarColeccion] = useState('');
  const [filtroPais, setFiltroPais] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [searching, setSearching] = useState(false);
  const [resultados, setResultados] = useState<Documento[]>([]);
  const [searchDone, setSearchDone] = useState(false);

  const fetchDocs = async (col = '') => {
    setLoadingDocs(true);
    const token = await getToken();
    if (!token) return;
    const params = new URLSearchParams();
    if (col) params.set('coleccion', col);
    const res = await fetch(`${API}/api/conocimiento?${params}&_t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      setDocs(data.data || []);
    }
    setLoadingDocs(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleFilterColeccion = (col: string) => {
    setFiltroColeccion(col);
    fetchDocs(col);
  };

  const handleDelete = async (doc: Documento) => {
    if (!confirm('¿Eliminar este documento?')) return;
    setDeletingId(doc.id);
    const token = await getToken();
    await fetch(`${API}/api/conocimiento/${doc._coleccion}/${doc.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeletingId(null);
    fetchDocs(filtroColeccion);
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
      fetchDocs(filtroColeccion);
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
    if (buscarColeccion) params.set('coleccion', buscarColeccion);
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

  const categoriasModal = CATEGORIAS_POR_COLECCION[form.coleccion] ?? [];
  const categoriasBuscador = buscarColeccion
    ? (CATEGORIAS_POR_COLECCION[buscarColeccion] ?? [])
    : TODAS_CATEGORIAS;

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-white mb-6">
          Base de Conocimiento Legal
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#111111] border border-white/10 rounded-2xl p-1 w-fit">
          {(['documentos', 'buscador'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-[13.5px] font-semibold transition-colors capitalize
                ${tab === t
                  ? 'bg-white/12 text-white'
                  : 'text-white/50 hover:text-white'
                }`}
            >
              {t === 'documentos' ? 'Documentos' : 'Buscador'}
            </button>
          ))}
        </div>

        {/* ── TAB 1: DOCUMENTOS ── */}
        {tab === 'documentos' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleFilterColeccion('')}
                className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors
                  ${filtroColeccion === ''
                    ? 'bg-white/12 text-white'
                    : 'border border-white/15 text-white/50 hover:text-white hover:bg-white/8'
                  }`}
              >
                Todas
              </button>
              {COLECCIONES.map(col => (
                <button
                  key={col.id}
                  onClick={() => handleFilterColeccion(col.id)}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors
                    ${filtroColeccion === col.id
                      ? 'bg-white/12 text-white'
                      : 'border border-white/15 text-white/50 hover:text-white hover:bg-white/8'
                    }`}
                >
                  {col.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <p className="text-[14px] text-white/50">
                {docs.length} documento{docs.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 bg-[#25D366] text-[#062810] px-4 py-2.5 rounded-xl
                           text-[13.5px] font-semibold hover:bg-[#2adc6c] active:scale-[0.98] transition"
              >
                <Plus size={15} />
                Añadir Documento
              </button>
            </div>

            <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden">
              {loadingDocs ? (
                <div className="px-6 py-10 text-center text-white/40 text-[14px]">Cargando documentos...</div>
              ) : docs.length === 0 ? (
                <div className="px-6 py-10 text-center text-white/40 text-[14px]">No hay documentos en esta colección.</div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[700px] text-[13.5px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Título', 'Colección', 'Categoría', 'País', 'Fecha', ''].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map((doc, i) => (
                        <tr
                          key={doc.id}
                          className={`border-b border-white/8 ${i % 2 !== 0 ? 'bg-white/[0.02]' : ''}`}
                        >
                          <td className="px-5 py-3.5 font-medium text-white max-w-[220px] truncate">
                            {doc.titulo}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/8 text-white/60">
                              {colLabel(doc._coleccion)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-white/60">{doc.categoria ?? '—'}</td>
                          <td className="px-5 py-3.5 text-white/60">{doc.pais ?? '—'}</td>
                          <td className="px-5 py-3.5 text-white/40 whitespace-nowrap">
                            {toDate(doc.fechaActualizacion)}
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleDelete(doc)}
                              disabled={deletingId === doc.id}
                              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-red-400
                                         bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors
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
            <div className="bg-[#111111] rounded-2xl border border-white/10 p-6 mb-6">
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Colección (opcional)</label>
                    <select
                      value={buscarColeccion}
                      onChange={e => { setBuscarColeccion(e.target.value); setFiltroCategoria(''); }}
                      className={inputCls}
                    >
                      <option value="">Todas</option>
                      {COLECCIONES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Categoría (opcional)</label>
                    <select
                      value={filtroCategoria}
                      onChange={e => setFiltroCategoria(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Todas</option>
                      {categoriasBuscador.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>País (opcional)</label>
                    <select
                      value={filtroPais}
                      onChange={e => setFiltroPais(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Todos</option>
                      {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !query.trim()}
                className="flex items-center gap-2 bg-[#25D366] text-[#062810] px-5 py-2.5 rounded-xl
                           text-[13.5px] font-semibold hover:bg-[#2adc6c] transition disabled:opacity-50"
              >
                <Search size={15} />
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {searchDone && (
              <div className="space-y-3">
                {resultados.length === 0 ? (
                  <div className="bg-[#111111] rounded-2xl border border-white/10 px-6 py-10 text-center text-white/40 text-[14px]">
                    Sin resultados para esta consulta.
                  </div>
                ) : (
                  resultados.map((r, i) => (
                    <div key={r.id} className="bg-[#111111] rounded-2xl border border-white/10 p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-[11px] font-bold text-white/30 w-5 shrink-0 pt-0.5">{i + 1}</span>
                        <h3 className="text-[15px] font-semibold text-white">{r.titulo}</h3>
                      </div>
                      <div className="ml-8 flex flex-wrap gap-2 text-[12px]">
                        <span className="px-2 py-0.5 rounded-full bg-white/8 text-white/60 font-semibold">
                          {colLabel(r._coleccion)}
                        </span>
                        {r.fuente && (
                          <span className={`px-2 py-0.5 rounded-full font-semibold
                            ${r.fuente === 'BOE' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                            {r.fuente}
                          </span>
                        )}
                        {r.categoria && (
                          <span className="px-2 py-0.5 rounded-full bg-white/8 text-white/50 font-medium">
                            {r.categoria}
                          </span>
                        )}
                        {r.pais && (
                          <span className="px-2 py-0.5 rounded-full bg-white/8 text-white/50 font-medium">
                            {r.pais}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-white/8 text-white/40 font-medium">
                          {toDate(r.fechaActualizacion)}
                        </span>
                      </div>
                      {r.contenido && (
                        <p className="ml-8 mt-2 text-[13px] text-white/50 line-clamp-2">{r.contenido}</p>
                      )}
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#111111] border border-white/10 rounded-[24px] shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-7 py-5 border-b border-white/10">
              <h2 className="text-[18px] font-semibold text-white">Añadir Documento</h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-4">
              {ingestResult === 'success' && (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-[13.5px] text-emerald-400 font-medium">
                  <CheckCircle2 size={16} /> Documento guardado correctamente.
                </div>
              )}
              {ingestResult === 'error' && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13.5px] text-red-400 font-medium">
                  <AlertCircle size={16} /> Error al guardar el documento.
                </div>
              )}

              <div>
                <label className={labelCls}>Colección *</label>
                <select
                  value={form.coleccion}
                  onChange={e => {
                    const col = e.target.value;
                    const cats = CATEGORIAS_POR_COLECCION[col] ?? [];
                    setForm(f => ({ ...f, coleccion: col, categoria: cats[0] ?? '' }));
                  }}
                  className={inputCls}
                >
                  {COLECCIONES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Título *</label>
                <input
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  className={inputCls}
                  placeholder="Ej: Requisitos Visado Estudios España 2024"
                />
              </div>

              <div>
                <label className={labelCls}>Contenido *</label>
                <textarea
                  value={form.contenido}
                  onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                  rows={7}
                  className={`${inputCls} resize-y`}
                  placeholder="Pega aquí el contenido del documento..."
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
                    {categoriasModal.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>País</label>
                  <select
                    value={form.pais}
                    onChange={e => setForm(f => ({ ...f, pais: e.target.value }))}
                    className={inputCls}
                  >
                    {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Subcategoría (opcional)</label>
                  <input
                    value={form.subcategoria}
                    onChange={e => setForm(f => ({ ...f, subcategoria: e.target.value }))}
                    className={inputCls}
                    placeholder="Ej: visado_estudios"
                  />
                </div>
                <div>
                  <label className={labelCls}>Fuente</label>
                  <input
                    value={form.fuente}
                    onChange={e => setForm(f => ({ ...f, fuente: e.target.value }))}
                    className={inputCls}
                    placeholder="BOE / manual / INE..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/15 px-4 py-3">
                <span className="text-[14px] text-white/60 font-medium">Activo</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                    className="w-4 h-4 accent-[#25D366]"
                  />
                  <span className="text-[13px] text-white/50">{form.activo ? 'Sí' : 'No'}</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={ingesting}
                  className="flex-1 rounded-xl border border-white/15 font-semibold py-3 text-[14.5px]
                             text-white/60 hover:bg-white/5 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleIngest}
                  disabled={ingesting || !form.titulo || !form.contenido}
                  className="flex-1 rounded-xl bg-[#25D366] text-[#062810] font-semibold py-3 text-[14.5px]
                             hover:bg-[#2adc6c] transition disabled:opacity-50"
                >
                  {ingesting ? 'Guardando...' : 'Guardar Documento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
