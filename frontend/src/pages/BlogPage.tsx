import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Globe } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  country: string;
  publishedAt: string | null;
  createdAt: string;
}

/* ─── Blog Hero ──────────────────────────────────────────── */
const BlogHero = () => (
  <section className="relative isolate overflow-hidden bg-[var(--ink)] text-white rounded-b-[28px]">
    <div
      className="absolute inset-0 opacity-[0.06] pointer-events-none"
      style={{
        backgroundImage:
          'linear-gradient(var(--brand) 1px, transparent 1px), linear-gradient(90deg, var(--brand) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }}
    />
    <div className="mx-auto max-w-[1000px] px-6 pt-24 pb-20 md:pt-32 md:pb-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium
                   bg-[var(--brand)]/12 text-[var(--brand)] border border-[var(--brand)]/25 mb-6"
      >
        Blog
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="font-semibold tracking-[-0.035em] leading-[1.0] text-[48px] md:text-[72px]"
      >
        Guías y recursos para{' '}
        <span className="italic font-normal text-white/80" style={{ fontFamily: "'Fraunces', serif" }}>
          emigrar con claridad
        </span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-6 text-[17px] leading-[1.55] text-white/60 max-w-[580px] mx-auto"
      >
        Información actualizada sobre visados, trámites y vida en España para la comunidad
        latinoamericana.
      </motion.p>
    </div>
  </section>
);

/* ─── Skeleton Card ──────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="rounded-2xl bg-white border border-black/5 p-7 animate-pulse">
    <div className="flex items-center justify-between mb-5">
      <div className="h-5 w-20 bg-black/6 rounded-full" />
      <div className="h-4 w-12 bg-black/6 rounded-full" />
    </div>
    <div className="h-6 w-3/4 bg-black/6 rounded-lg mb-2" />
    <div className="h-4 w-full bg-black/5 rounded mb-1.5" />
    <div className="h-4 w-2/3 bg-black/5 rounded" />
    <div className="mt-6 pt-5 border-t border-dashed border-black/8 flex justify-between items-center">
      <div className="h-3.5 w-20 bg-black/5 rounded" />
      <div className="h-4 w-24 bg-black/6 rounded" />
    </div>
  </div>
);

/* ─── Article Card ───────────────────────────────────────── */
const ArticleCard = ({ article, index }: { article: Article; index: number }) => {
  const date = article.publishedAt || article.createdAt;
  const dateStr = new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative flex flex-col rounded-2xl bg-white border border-black/5 p-7 tonal-lift
                 hover:border-black/12 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-5">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)] bg-[var(--brand)]/10 px-2.5 py-1 rounded-full">
          <Globe size={10} />
          {article.country}
        </span>
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink)]/40">
          <Clock size={12} />
          <span>{dateStr}</span>
        </div>
      </div>
      <h2 className="text-[20px] font-semibold tracking-[-0.02em] leading-[1.25] text-[var(--ink)] mb-3
                     group-hover:text-[var(--brand-ink)] transition-colors">
        {article.title}
      </h2>
      <p className="text-[14.5px] leading-[1.6] text-[var(--ink)]/60 flex-1">{article.excerpt}</p>
      <div className="mt-6 pt-5 border-t border-dashed border-black/8 flex items-center justify-end">
        <Link
          to={`/blog/${article.slug}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand-ink)]
                     hover:gap-2.5 transition-all"
        >
          Leer artículo
          <ArrowRight size={14} />
        </Link>
      </div>
    </motion.article>
  );
};

/* ─── Blog List ──────────────────────────────────────────── */
const BlogList = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/articles`)
      .then(r => r.json())
      .then(data => setArticles(data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-surface-container-lowest min-h-screen font-sans pt-[72px]">
      <BlogHero />
      <section className="mx-auto max-w-[1200px] px-6 py-20">
        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-[var(--ink)]/40 text-[16px]">
            Próximamente publicaremos guías y recursos.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {articles.map((article, i) => (
              <ArticleCard key={article.id} article={article} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

/* ─── Exports ────────────────────────────────────────────── */
export const BlogListPage = () => <BlogList />;
