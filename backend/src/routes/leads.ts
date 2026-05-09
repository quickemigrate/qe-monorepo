import { Router, Request, Response } from 'express';
import { db } from '../firebase';
import { verifyToken } from '../middleware/auth';
import { toCsv, csvFilename } from '../utils/csv';

const router = Router();

router.get('/export', verifyToken, async (req: Request, res: Response) => {
  try {
    const estado = typeof req.query.estado === 'string' ? req.query.estado : '';
    let query: FirebaseFirestore.Query = db.collection('leads').orderBy('createdAt', 'desc');
    if (estado && estado !== 'todos') query = query.where('estado', '==', estado);
    const snap = await query.limit(2000).get();

    const headers = ['id', 'createdAt', 'nombre', 'email', 'pais', 'interes', 'estado', 'mensaje', 'notas', 'updatedAt'];
    const rows = snap.docs.map(doc => {
      const d = doc.data();
      return [
        doc.id,
        d.createdAt || '',
        d.nombre || '',
        d.email || '',
        d.pais || '',
        d.interes || '',
        d.estado || '',
        d.mensaje || '',
        d.notas || '',
        d.updatedAt || '',
      ];
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${csvFilename('leads')}"`);
    res.send(toCsv(headers, rows));
  } catch (error) {
    console.error('Error exportando leads:', error);
    res.status(500).json({ error: 'Error exportando leads' });
  }
});

router.get('/', verifyToken, async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('leads')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ leads });
  } catch (error) {
    console.error('Error obteniendo leads:', error);
    res.status(500).json({ error: 'Error obteniendo leads' });
  }
});

const LEAD_ESTADOS = new Set(['nuevo', 'contactado', 'convertido', 'descartado']);

router.post('/bulk', verifyToken, async (req: Request, res: Response) => {
  try {
    const { ids, action, estado } = req.body as { ids?: unknown; action?: unknown; estado?: unknown };
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) {
      return res.status(400).json({ error: 'ids inválidos (1-500)' });
    }
    const cleanIds = ids.filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 500);
    if (cleanIds.length === 0) return res.status(400).json({ error: 'Sin ids válidos' });

    if (action === 'updateEstado') {
      if (typeof estado !== 'string' || !LEAD_ESTADOS.has(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      const batch = db.batch();
      const now = new Date().toISOString();
      cleanIds.forEach(id => batch.update(db.collection('leads').doc(id), { estado, updatedAt: now }));
      await batch.commit();
      return res.json({ ok: true, afectados: cleanIds.length });
    }

    if (action === 'delete') {
      const batch = db.batch();
      cleanIds.forEach(id => batch.delete(db.collection('leads').doc(id)));
      await batch.commit();
      return res.json({ ok: true, afectados: cleanIds.length });
    }

    return res.status(400).json({ error: 'Acción no soportada' });
  } catch (error) {
    console.error('Error bulk leads:', error);
    res.status(500).json({ error: 'Error en operación masiva' });
  }
});

router.patch('/:id', verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado, notas } = req.body;

  try {
    await db.collection('leads').doc(id).update({
      estado,
      notas,
      updatedAt: new Date().toISOString()
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error actualizando lead:', error);
    res.status(500).json({ error: 'Error actualizando lead' });
  }
});

export default router;
