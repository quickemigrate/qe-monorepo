/**
 * Firestore collection: articles
 * {
 *   title: string
 *   slug: string              // "como-emigrar-desde-argentina"
 *   excerpt: string
 *   content: string           // HTML from TipTap
 *   country: string           // "Argentina" | "Perú" | "General" | ...
 *   status: 'draft' | 'published'
 *   metaDescription: string
 *   createdAt: string         // ISO
 *   updatedAt: string         // ISO
 *   publishedAt: string | null
 * }
 */
import { Router, Request, Response } from 'express';
import { db } from '../firebase';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Public: list published articles
router.get('/', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('articles')
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .get();

    const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ articles });
  } catch (error) {
    console.error('Error obteniendo artículos:', error);
    res.status(500).json({ error: 'Error obteniendo artículos' });
  }
});

// Admin: list all articles (draft + published) — must come before /:slug
router.get('/admin/all', verifyToken, async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('articles')
      .orderBy('createdAt', 'desc')
      .get();

    const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ articles });
  } catch (error) {
    console.error('Error obteniendo artículos (admin):', error);
    res.status(500).json({ error: 'Error obteniendo artículos' });
  }
});

// Admin: create article
router.post('/', verifyToken, async (req: Request, res: Response) => {
  const { title, slug, excerpt, content, country, status, metaDescription } = req.body;

  if (!title || !slug) {
    return res.status(400).json({ error: 'Título y slug son obligatorios' });
  }

  const now = new Date().toISOString();

  try {
    const ref = await db.collection('articles').add({
      title,
      slug,
      excerpt: excerpt || '',
      content: content || '',
      country: country || 'General',
      status: status || 'draft',
      metaDescription: metaDescription || '',
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : null,
    });
    res.json({ id: ref.id, ok: true });
  } catch (error) {
    console.error('Error creando artículo:', error);
    res.status(500).json({ error: 'Error creando artículo' });
  }
});

// Admin: update article
router.patch('/:id', verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const now = new Date().toISOString();

  try {
    const docRef = db.collection('articles').doc(id);
    const doc = await docRef.get();

    const wasPublished = doc.data()?.status === 'published';
    const isPublishing = updates.status === 'published' && !wasPublished;

    await docRef.update({
      ...updates,
      updatedAt: now,
      ...(isPublishing && { publishedAt: now }),
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error actualizando artículo:', error);
    res.status(500).json({ error: 'Error actualizando artículo' });
  }
});

// Admin: delete article
router.delete('/:id', verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.collection('articles').doc(id).delete();
    res.json({ ok: true });
  } catch (error) {
    console.error('Error eliminando artículo:', error);
    res.status(500).json({ error: 'Error eliminando artículo' });
  }
});

// Public: get article by slug — must come after /admin/all
router.get('/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const snapshot = await db.collection('articles')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    const doc = snapshot.docs[0];
    res.json({ article: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Error obteniendo artículo:', error);
    res.status(500).json({ error: 'Error obteniendo artículo' });
  }
});

export default router;
