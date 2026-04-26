import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import { db } from '../firebase';
import { Timestamp } from 'firebase-admin/firestore';

const router = Router();

const COLECCIONES_VALIDAS = new Set([
  'rutas_migratorias', 'requisitos_legales', 'base_conocimiento', 'simulaciones', 'casos_reales',
]);

const queryColeccion = async (col: string, categoria?: string, pais?: string) => {
  let q: FirebaseFirestore.Query = db.collection(col);
  if (categoria) q = q.where('categoria', '==', categoria);
  if (pais) q = q.where('pais', '==', pais);
  if (!categoria && !pais) q = (q as any).orderBy('fechaActualizacion', 'desc');
  q = q.limit(100);
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, _coleccion: col, ...d.data() }));
};

// GET /api/conocimiento?coleccion=X&categoria=Y&pais=Z
router.get('/', verifyToken, async (req: Request, res: Response) => {
  const { coleccion, categoria, pais } = req.query as Record<string, string>;
  try {
    if (coleccion && COLECCIONES_VALIDAS.has(coleccion)) {
      const docs = await queryColeccion(coleccion, categoria, pais);
      return res.json({ success: true, data: docs });
    }

    const results = await Promise.all(
      [...COLECCIONES_VALIDAS].map(col => queryColeccion(col, categoria, pais))
    );
    const data = results.flat().sort((a: any, b: any) => {
      const ta = a.fechaActualizacion?.seconds ?? a.fechaActualizacion?._seconds ?? 0;
      const tb = b.fechaActualizacion?.seconds ?? b.fechaActualizacion?._seconds ?? 0;
      return tb - ta;
    });
    res.json({ success: true, data });
  } catch (e) {
    console.error('Error GET /conocimiento:', e);
    res.status(500).json({ success: false, error: 'Error al listar documentos' });
  }
});

// GET /api/conocimiento/search?q=texto&coleccion=X&categoria=Y&pais=Z
router.get('/search', verifyToken, async (req: Request, res: Response) => {
  const { q, coleccion, categoria, pais } = req.query as Record<string, string>;
  if (!q) return res.status(400).json({ success: false, error: 'Falta parámetro q' });

  try {
    const searchCol = async (col: string) => {
      const snap = await db.collection(col)
        .where('titulo', '>=', q)
        .where('titulo', '<=', q + '')
        .limit(50)
        .get();
      return snap.docs.map(d => ({ id: d.id, _coleccion: col, ...d.data() }));
    };

    const cols = coleccion && COLECCIONES_VALIDAS.has(coleccion)
      ? [coleccion]
      : [...COLECCIONES_VALIDAS];

    const results = (await Promise.all(cols.map(searchCol))).flat();

    const filtered = results.filter(doc => {
      if (categoria && (doc as any).categoria !== categoria) return false;
      if (pais && (doc as any).pais !== pais) return false;
      return true;
    });

    res.json({ success: true, data: filtered });
  } catch (e) {
    console.error('Error GET /conocimiento/search:', e);
    res.status(500).json({ success: false, error: 'Error en búsqueda' });
  }
});

// POST /api/conocimiento
router.post('/', verifyToken, async (req: Request, res: Response) => {
  const { coleccion, titulo, contenido, ...resto } = req.body;

  if (!coleccion || !COLECCIONES_VALIDAS.has(coleccion)) {
    return res.status(400).json({ success: false, error: 'Colección inválida o no especificada' });
  }
  if (!titulo || !contenido) {
    return res.status(400).json({ success: false, error: 'titulo y contenido son obligatorios' });
  }

  try {
    const docRef = await db.collection(coleccion).add({
      titulo,
      contenido,
      ...resto,
      activo: resto.activo ?? true,
      fechaActualizacion: Timestamp.now(),
    });
    res.json({ success: true, id: docRef.id });
  } catch {
    res.status(500).json({ success: false, error: 'Error al guardar documento' });
  }
});

// DELETE /api/conocimiento/:coleccion/:id
router.delete('/:coleccion/:id', verifyToken, async (req: Request, res: Response) => {
  const { coleccion, id } = req.params;
  if (!COLECCIONES_VALIDAS.has(coleccion)) {
    return res.status(400).json({ success: false, error: 'Colección inválida' });
  }
  try {
    await db.collection(coleccion).doc(id).delete();
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Error al eliminar documento' });
  }
});

// PATCH /api/conocimiento/:coleccion/:id
router.patch('/:coleccion/:id', verifyToken, async (req: Request, res: Response) => {
  const { coleccion, id } = req.params;
  if (!COLECCIONES_VALIDAS.has(coleccion)) {
    return res.status(400).json({ success: false, error: 'Colección inválida' });
  }
  try {
    await db.collection(coleccion).doc(id).update({
      ...req.body,
      fechaActualizacion: Timestamp.now(),
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Error al actualizar documento' });
  }
});

// POST /api/conocimiento/sincronizar-pinecone — stub (Pinecone pausado)
router.post('/sincronizar-pinecone', verifyToken, (_req: Request, res: Response) => {
  res.json({ success: true, mensaje: 'Pinecone pausado' });
});

export default router;
