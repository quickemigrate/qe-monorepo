import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Globe, Search, X, SlidersHorizontal } from 'lucide-react';
import { AuroraBackground } from '../components/ui/aurora-background';

type SortOrder = 'recent' | 'oldest';

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
  <AuroraBackground className="min-h-[26rem] pt-16">
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
  </AuroraBackground>
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

/* ─── Filters Bar ────────────────────────────────────────── */
interface FiltersProps {
  query: string;
  setQuery: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  sort: SortOrder;
  setSort: (v: SortOrder) => void;
  countries: string[];
  total: number;
  filteredCount: number;
  onClear: () => void;
  hasFilters: boolean;
}

const FiltersBar = ({
  query, setQuery, country, setCountry, sort, setSort,
  countries, total, filteredCount, onClear, hasFilters,
}: FiltersProps) => (
  <div className="mb-8 space-y-4">
    {/* Search + sort row */}
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar artículos por título o contenido..."
          className="qe-input w-full rounded-xl pl-11 pr-10 py-3 text-[14px] text-white placeholder:text-white/35 transition"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white transition"
            aria-label="Limpiar búsqueda"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <SlidersHorizontal size={15} className="text-white/35 hidden sm:block" />
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOrder)}
          className="qe-input rounded-xl px-4 py-3 text-[13.5px] text-white transition cursor-pointer min-w-[180px]"
        >
          <option value="recent">Más recientes</option>
          <option value="oldest">Más antiguos</option>
        </select>
      </div>
    </div>

    {/* Country chips */}
    {countries.length > 0 && (
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCountry('')}
          className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all
            ${country === ''
              ? 'bg-[#25D366] text-[#062810]'
              : 'qe-card qe-card-hover text-white/60 hover:text-white'
            }`}
        >
          Todos los países
        </button>
        {countries.map(c => (
          <button
            key={c}
            onClick={() => setCountry(c === country ? '' : c)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all
              ${country === c
                ? 'bg-[#25D366] text-[#062810]'
                : 'qe-card qe-card-hover text-white/60 hover:text-white'
              }`}
          >
            <Globe size={11} />
            {c}
          </button>
        ))}
      </div>
    )}

    {/* Result count + clear */}
    <div className="flex items-center justify-between text-[13px] text-white/45 pt-1">
      <span>
        {hasFilters
          ? <><span className="text-white font-semibold">{filteredCount}</span> de {total} artículos</>
          : <><span className="text-white font-semibold">{total}</span> {total === 1 ? 'artículo' : 'artículos'}</>
        }
      </span>
      {hasFilters && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#25D366] hover:opacity-80 transition"
        >
          <X size={13} />
          Limpiar filtros
        </button>
      )}
    </div>
  </div>
);

/* ─── Blog List ──────────────────────────────────────────── */
const BlogList = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [sort, setSort] = useState<SortOrder>('recent');

  useEffect(() => {
    fetch(`${API}/api/articles`)
      .then(r => r.json())
      .then(data => setArticles(data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const countries = useMemo(() => {
    const set = new Set<string>();
    articles.forEach(a => { if (a.country) set.add(a.country); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = articles.filter(a => {
      if (country && a.country !== country) return false;
      if (q) {
        const hay = `${a.title} ${a.excerpt}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      const da = new Date(a.publishedAt || a.createdAt).getTime();
      const db = new Date(b.publishedAt || b.createdAt).getTime();
      return sort === 'recent' ? db - da : da - db;
    });
    return list;
  }, [articles, query, country, sort]);

  const hasFilters = query.trim() !== '' || country !== '' || sort !== 'recent';
  const handleClear = () => { setQuery(''); setCountry(''); setSort('recent'); };

  return (
    <div className="bg-[#0A0A0A] min-h-screen font-sans">
      <BlogHero />
      <section className="mx-auto max-w-[1200px] px-5 md:px-6 py-12 md:py-16">
        {loading ? (
          <>
            <div className="mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="qe-card rounded-xl h-12 flex-1 animate-pulse" />
                <div className="qe-card rounded-xl h-12 w-full sm:w-[200px] animate-pulse" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[60, 80, 100, 70, 90].map((w, i) => (
                  <div key={i} className="qe-card rounded-full h-8 animate-pulse" style={{ width: w }} />
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          </>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-white/40 text-[16px]">
            Próximamente publicaremos guías y recursos.
          </div>
        ) : (
          <>
            <FiltersBar
              query={query} setQuery={setQuery}
              country={country} setCountry={setCountry}
              sort={sort} setSort={setSort}
              countries={countries}
              total={articles.length}
              filteredCount={filtered.length}
              onClear={handleClear}
              hasFilters={hasFilters}
            />

            {filtered.length === 0 ? (
              <div className="qe-card rounded-2xl py-16 px-6 text-center">
                <div className="text-[15px] text-white/60 mb-3 font-medium">
                  Sin resultados
                </div>
                <p className="text-[13.5px] text-white/40 mb-5 max-w-[380px] mx-auto">
                  No encontramos artículos que coincidan con
                  {query && <> "<span className="text-white/70 font-medium">{query}</span>"</>}
                  {query && country && ' en '}
                  {country && <> <span className="text-white/70 font-medium">{country}</span></>}
                  .
                </p>
                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#25D366] hover:opacity-80 transition"
                >
                  <X size={14} />
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {filtered.map((article, i) => (
                  <ArticleCard key={article.id} article={article} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export const BlogListPage = () => <BlogList />;
