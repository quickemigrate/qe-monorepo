import { Router } from 'express';
import { db } from '../firebase';

const router = Router();

const SITE = 'https://quickemigrate.com';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

const STATIC_URLS: SitemapUrl[] = [
  { loc: `${SITE}/`,            lastmod: new Date().toISOString().slice(0, 10), changefreq: 'weekly',  priority: 1.0 },
  { loc: `${SITE}/diagnostico`, lastmod: new Date().toISOString().slice(0, 10), changefreq: 'monthly', priority: 0.9 },
  { loc: `${SITE}/blog`,        lastmod: new Date().toISOString().slice(0, 10), changefreq: 'weekly',  priority: 0.8 },
  { loc: `${SITE}/nosotros`,    lastmod: new Date().toISOString().slice(0, 10), changefreq: 'monthly', priority: 0.6 },
];

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

router.get('/', async (_req, res) => {
  try {
    const snap = await db.collection('articles').where('status', '==', 'published').get();
    const articles: SitemapUrl[] = snap.docs.map(d => {
      const a = d.data();
      const date = a.publishedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date();
      return {
        loc: `${SITE}/blog/${a.slug}`,
        lastmod: new Date(date).toISOString().slice(0, 10),
        changefreq: 'monthly' as const,
        priority: 0.7,
      };
    });

    const all = [...STATIC_URLS, ...articles];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all
      .map(u => `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority.toFixed(1)}</priority>\n  </url>`)
      .join('\n')}\n</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600'); // 1h cache
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
