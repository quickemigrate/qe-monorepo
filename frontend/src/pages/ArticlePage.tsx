import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Globe, Calendar } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  country: string;
  metaDescription: string;
  publishedAt: string | null;
  createdAt: string;
}

/* ─── Prose styles for TipTap HTML ──────────────────────── */
const ProseStyles = () => (
  <style>{`
    .prose-qe p  { margin-bottom: 1.25rem; font-size: 16.5px; line-height: 1.75; color: rgba(255,255,255,0.65); }
    .prose-qe h2 { margin-top: 2.5rem; margin-bottom: 0.75rem; font-size: 22px; font-weight: 600;
                   letter-spacing: -0.02em; color: #ffffff; }
    .prose-qe h3 { margin-top: 2rem; margin-bottom: 0.5rem; font-size: 18px; font-weight: 600;
                   letter-spacing: -0.015em; color: #ffffff; }
    .prose-qe h2:first-child, .prose-qe h3:first-child { margin-top: 0; }
    .prose-qe ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
    .prose-qe ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; }
    .prose-qe li { margin-bottom: 0.4rem; font-size: 16.5px; line-height: 1.7; color: rgba(255,255,255,0.65); }
    .prose-qe strong { font-weight: 600; color: #ffffff; }
    .prose-qe em { font-style: italic; }
  `}</style>
);

/* ─── Skeleton ───────────────────────────────────────────── */
const Skeleton = () => (
  <div className="bg-[#0A0A0A] min-h-screen font-sans pt-[72px] animate-pulse">
    <div className="bg-[#111111] rounded-b-[28px] px-6 pt-20 pb-16 md:pt-28 md:pb-20">
      <div className="max-w-[800px] mx-auto space-y-4">
        <div className="h-4 w-32 bg-white/10 rounded" />
        <div className="h-10 w-3/4 bg-white/10 rounded-lg" />
        <div className="h-5 w-full bg-white/8 rounded" />
      </div>
    </div>
    <div className="max-w-[720px] mx-auto px-6 py-16 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-4 bg-white/6 rounded" />)}
    </div>
  </div>
);

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/api/articles/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setArticle(data.article); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton />;

  if (notFound || !article) {
    return (
      <div className="bg-[#0A0A0A] min-h-screen font-sans pt-[72px] flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-[56px] font-bold text-white/10 mb-4">404</p>
          <p className="text-[18px] font-semibold text-white mb-2">Artículo no encontrado</p>
          <p className="text-[14.5px] text-white/50 mb-8">
            El artículo que buscas no existe o ha sido eliminado.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 bg-[#25D366] text-[#062810] font-bold
                       px-6 py-3 rounded-full text-[14.5px] hover:bg-[#2adc6c] transition-colors"
          >
            <ArrowLeft size={15} />
            Volver al blog
          </Link>
        </div>
      </div>
    );
  }

  const date = article.publishedAt || article.createdAt;
  const dateStr = new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <ProseStyles />
      <div className="bg-[#0A0A0A] min-h-screen font-sans pt-[72px]">
        {/* Hero */}
        <section className="bg-[#111111] border-b border-white/10 rounded-b-[28px]">
          <div className="mx-auto max-w-[800px] px-6 pt-20 pb-16 md:pt-28 md:pb-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-[13px] text-white/50 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft size={14} />
                Volver al blog
              </Link>

              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/20 px-2.5 py-1 rounded-full">
                  <Globe size={10} />
                  {article.country}
                </span>
                <div className="flex items-center gap-1.5 text-[12px] text-white/40">
                  <Calendar size={12} />
                  {dateStr}
                </div>
              </div>

              <h1 className="text-[36px] md:text-[52px] font-semibold tracking-[-0.03em] leading-[1.08] text-white mb-5">
                {article.title}
              </h1>
              {article.excerpt && (
                <p className="text-[17px] leading-[1.6] text-white/55 max-w-[640px]">{article.excerpt}</p>
              )}
            </motion.div>
          </div>
        </section>

        {/* Body */}
        <article className="mx-auto max-w-[720px] px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="prose-qe"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-16 rounded-[24px] bg-[#111111] border border-white/10 text-white p-8 md:p-10"
          >
            <p className="text-[20px] font-semibold tracking-[-0.02em] leading-[1.3] mb-4">
              ¿Necesitas ayuda con tu caso específico?
            </p>
            <p className="text-[14.5px] text-white/60 leading-[1.6] mb-6">
              Cada expediente es distinto. Cuéntanos el tuyo y te damos un diagnóstico honesto.
            </p>
            <Link
              to="/#contacto"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] text-[#062810]
                         font-semibold px-5 py-3 text-[14.5px] hover:bg-[#2adc6c] transition-colors"
            >
              Reservar diagnóstico
              <ArrowRight size={15} />
            </Link>
          </motion.div>

          <div className="mt-12">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              Todos los artículos
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
