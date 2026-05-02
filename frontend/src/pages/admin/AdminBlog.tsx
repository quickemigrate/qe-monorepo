import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Plus, Pencil, Trash2, Globe, FileText, Bold, Italic, List, ListOrdered, Heading2, Heading3, ArrowLeft } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  country: string;
  status: 'draft' | 'published';
  metaDescription: string;
  createdAt: string;
  publishedAt: string | null;
}

const COUNTRIES = ['General', 'Argentina', 'Perú', 'Nicaragua', 'Colombia', 'México'];

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  country: 'General',
  metaDescription: '',
};

const ESTADO_BADGE: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-yellow-100 text-yellow-700',
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/* ─── TipTap Toolbar ─────────────────────────────────────── */
function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const btnCls = (active: boolean) =>
    `p-1.5 rounded-lg transition-colors ${active ? 'bg-on-background text-white' : 'text-on-background/50 hover:bg-surface-container-low hover:text-on-background'}`;

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-black/8 bg-surface-container-lowest rounded-t-xl">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnCls(editor.isActive('bold'))}>
        <Bold size={15} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnCls(editor.isActive('italic'))}>
        <Italic size={15} />
      </button>
      <div className="w-px h-4 bg-black/10 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnCls(editor.isActive('heading', { level: 2 }))}>
        <Heading2 size={15} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnCls(editor.isActive('heading', { level: 3 }))}>
        <Heading3 size={15} />
      </button>
      <div className="w-px h-4 bg-black/10 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnCls(editor.isActive('bulletList'))}>
        <List size={15} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnCls(editor.isActive('orderedList'))}>
        <ListOrdered size={15} />
      </button>
    </div>
  );
}

/* ─── Editor Form ────────────────────────────────────────── */
function ArticleEditor({
  initial,
  onSave,
  onBack,
}: {
  initial: Partial<Article> | null;
  onSave: (data: typeof EMPTY_FORM & { content: string }, status: 'draft' | 'published') => Promise<void>;
  onBack: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [slugManual, setSlugManual] = useState(!!initial?.slug);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initial?.content || '',
    editorProps: {
      attributes: {
        class: 'min-h-[280px] px-4 py-3 text-[15px] leading-[1.7] text-on-background focus:outline-none',
      },
    },
  });

  const handleTitleChange = (value: string) => {
    setForm(f => ({
      ...f,
      title: value,
      slug: slugManual ? f.slug : slugify(value),
    }));
  };

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true);
    try {
      await onSave({ ...form, content: editor?.getHTML() || '' }, status);
    } catch (err) {
      console.error('Error guardando artículo:', err);
      alert('Error al guardar. Revisa la consola.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full rounded-xl border border-black/10 px-4 py-3 text-[14.5px] text-on-background
                    bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition`;
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-1.5';

  return (
    <div className="p-8 max-w-[820px]">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] text-on-background/50 hover:text-on-background transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Volver a la lista
      </button>

      <h1 className="text-[26px] font-semibold tracking-[-0.025em] text-on-background mb-8">
        {initial?.id ? 'Editar artículo' : 'Nuevo artículo'}
      </h1>

      <div className="space-y-5">
        <div>
          <label className={labelCls}>Título *</label>
          <input
            value={form.title}
            onChange={e => handleTitleChange(e.target.value)}
            className={inputCls}
            placeholder="Cómo emigrar desde Argentina a España en 2026"
          />
        </div>

        <div>
          <label className={labelCls}>Slug (URL)</label>
          <input
            value={form.slug}
            onChange={e => { setSlugManual(true); setForm(f => ({ ...f, slug: e.target.value })); }}
            className={inputCls}
            placeholder="como-emigrar-desde-argentina"
          />
          <p className="text-[11.5px] text-on-background/35 mt-1">
            Se genera automáticamente desde el título. URL: /blog/{form.slug || '…'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>País objetivo</label>
            <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className={inputCls}>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Excerpt (resumen corto)</label>
          <textarea
            rows={2}
            value={form.excerpt}
            onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
            className={`${inputCls} resize-none`}
            placeholder="Resumen de 1-2 frases para la card del blog..."
          />
        </div>

        <div>
          <label className={labelCls}>Meta description (SEO)</label>
          <textarea
            rows={2}
            value={form.metaDescription}
            onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
            className={`${inputCls} resize-none`}
            placeholder="Descripción para buscadores, max 160 caracteres..."
          />
          <p className="text-[11.5px] text-on-background/35 mt-1">{form.metaDescription.length}/160</p>
        </div>

        <div>
          <label className={labelCls}>Contenido</label>
          <div className="rounded-xl border border-black/10 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary-container/50 transition">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="flex-1 rounded-xl border border-black/10 font-semibold py-3 text-[14.5px] text-on-background/60
                       hover:bg-surface-container-low transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar borrador'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('published')}
            className="flex-1 rounded-xl bg-on-background text-white font-semibold py-3 text-[14.5px]
                       hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function AdminBlog() {
  const { getToken } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Article> | null | 'new'>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API}/api/articles/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setArticles(data.articles || []);
    }
    setLoading(false);
  }, [getToken]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const handleSave = async (
    data: typeof EMPTY_FORM & { content: string },
    status: 'draft' | 'published'
  ) => {
    const token = await getToken();
    if (!token) throw new Error('No autenticado');

    const isEdit = editing && editing !== 'new' && (editing as Article).id;
    const method = isEdit ? 'PATCH' : 'POST';
    const url = isEdit ? `${API}/api/articles/${(editing as Article).id}` : `${API}/api/articles`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...data, status }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    setEditing(null);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    const token = await getToken();
    await fetch(`${API}/api/articles/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleting(null);
    fetchArticles();
  };

  const handleToggleStatus = async (article: Article) => {
    const token = await getToken();
    await fetch(`${API}/api/articles/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: article.status === 'published' ? 'draft' : 'published' }),
    });
    fetchArticles();
  };

  if (editing !== null) {
    return (
      <AdminLayout>
        <ArticleEditor
          initial={editing === 'new' ? null : editing}
          onSave={handleSave}
          onBack={() => setEditing(null)}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background">Blog</h1>
          <button
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-2 rounded-xl bg-on-background text-white font-semibold
                       px-5 py-2.5 text-[14px] hover:opacity-90 transition active:scale-[0.98]"
          >
            <Plus size={16} />
            Nuevo artículo
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          {loading ? (
            <div className="px-6 py-10 text-center text-on-background/40 text-[14px]">Cargando artículos...</div>
          ) : articles.length === 0 ? (
            <div className="px-6 py-10 text-center text-on-background/40 text-[14px]">
              Sin artículos aún. Crea el primero.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-black/5">
                    {['Título', 'País', 'Estado', 'Fecha', 'Acciones'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-on-background/40">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article, i) => (
                    <tr
                      key={article.id}
                      className={`border-b border-black/4 ${i % 2 === 0 ? '' : 'bg-surface-container-lowest/40'}`}
                    >
                      <td className="px-5 py-3.5 font-medium text-on-background max-w-[280px]">
                        <div className="truncate">{article.title}</div>
                        <div className="text-[11.5px] text-on-background/35 mt-0.5 truncate">/blog/{article.slug}</div>
                      </td>
                      <td className="px-5 py-3.5 text-on-background/60">
                        <span className="inline-flex items-center gap-1">
                          <Globe size={12} className="text-on-background/30" />
                          {article.country}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${ESTADO_BADGE[article.status] || 'bg-gray-100 text-gray-500'}`}>
                          {article.status === 'published' ? 'Publicado' : 'Borrador'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-on-background/40">
                        {new Date(article.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditing(article)}
                            className="p-1.5 rounded-lg text-on-background/40 hover:text-on-background hover:bg-surface-container-low transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(article)}
                            className="p-1.5 rounded-lg text-on-background/40 hover:text-on-background hover:bg-surface-container-low transition-colors text-[11px] font-semibold px-2"
                            title={article.status === 'published' ? 'Despublicar' : 'Publicar'}
                          >
                            {article.status === 'published' ? 'Despublicar' : 'Publicar'}
                          </button>
                          <button
                            onClick={() => handleDelete(article.id)}
                            disabled={deleting === article.id}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
