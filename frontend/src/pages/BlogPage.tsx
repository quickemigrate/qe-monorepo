import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Globe } from 'lucide-react';
import { LampContainer } from '../components/ui/lamp';

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
  <LampContainer className="min-h-[26rem] pt-16">
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold mb-5
                 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/25"
    >
      Blog
    </motion.div>
    <motion.h1
      initial={{ opacity: 0.5, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8, ease: "easeInOut" }}
      className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-center text-[42px] md:text-[64px] font-bold tracking-[-0.035em] leading-[1.05] text-transparent mb-3"
    >
      Guías para emigrar
      <br />
      <span className="text-[#25D366]">con claridad.</span>
    </motion.h1>
    <motion.p
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.55 }}
      className="text-[16px] text-white/50 leading-[1.55] text-center max-w-[480px]"
    >
      Información actualizada sobre visados, trámites y vida en España para la comunidad latinoamericana.
    </motion.p>
  </LampContainer>
);

/* ─── Skeleton Card ──────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="rounded-2xl bg-[#111111] border border-white/10 p-7 animate-pulse">
    <div className="flex items-center justify-between mb-5">
      <div className="h-5 w-20 bg-white/8 rounded-full" />
      <div className="h-4 w-12 bg-white/8 rounded-full" />
    </div>
    <div className="h-6 w-3/4 bg-white/8 rounded-lg mb-2" />
    <div className="h-4 w-full bg-white/5 rounded mb-1.5" />
    <div className="h-4 w-2/3 bg-white/5 rounded" />
    <div className="mt-6 pt-5 border-t border-dashed border-white/10 flex justify-between items-center">
      <div className="h-3.5 w-20 bg-white/5 rounded" />
      <div className="h-4 w-24 bg-white/8 rounded" />
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
      className="group relative flex flex-col rounded-2xl bg-[#111111] border border-white/10 p-7
                 hover:border-[#25D366]/30 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-5">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#25D366] bg-[#25D366]/10 px-2.5 py-1 rounded-full border border-[#25D366]/20">
          <Globe size={10} />
          {article.country}
        </span>
        <div className="flex items-center gap-1.5 text-[12px] text-white/40">
          <Clock size={12} />
          <span>{dateStr}</span>
        </div>
      </div>
      <h2 className="text-[20px] font-semibold tracking-[-0.02em] leading-[1.25] text-white mb-3
                     group-hover:text-[#25D366] transition-colors">
        {article.title}
      </h2>
      <p className="text-[14.5px] leading-[1.6] text-white/60 flex-1">{article.excerpt}</p>
      <div className="mt-6 pt-5 border-t border-dashed border-white/10 flex items-center justify-end">
        <Link
          to={`/blog/${article.slug}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#25D366]
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
    <div className="bg-[#0A0A0A] min-h-screen font-sans pt-[72px]">
      <BlogHero />
      <section className="mx-auto max-w-[1200px] px-6 py-16">
        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-white/40 text-[16px]">
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

export const BlogListPage = () => <BlogList />;
