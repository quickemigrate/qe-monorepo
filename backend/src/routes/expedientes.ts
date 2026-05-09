import { Router, Request, Response } from 'express';
import { db } from '../firebase';
import { verifyToken } from '../middleware/auth';
import { toCsv, csvFilename } from '../utils/csv';

const router = Router();

router.get('/export', verifyToken, async (req: Request, res: Response) => {
  try {
    const estado = typeof req.query.estado === 'string' ? req.query.estado : '';
    let query: FirebaseFirestore.Query = db.collection('expedientes').orderBy('createdAt', 'desc');
    if (estado && estado !== 'todos') query = query.where('estado', '==', estado);
    const snap = await query.limit(2000).get();

    const headers = ['id', 'createdAt', 'nombre', 'email', 'pais', 'tipoVisado', 'estado', 'notas', 'updatedAt'];
    const rows = snap.docs.map(doc => {
      const d = doc.data();
      return [
        doc.id,
        d.createdAt || '',
        d.nombre || '',
        d.email || '',
        d.pais || '',
        d.tipoVisado || '',
        d.estado || '',
        d.notas || '',
        d.updatedAt || '',
      ];
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${csvFilename('expedientes')}"`);
    res.send(toCsv(headers, rows));
  } catch (error) {
    console.error('Error exportando expedientes:', error);
    res.status(500).json({ error: 'Error exportando expedientes' });
  }
});

router.get('/', verifyToken, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '200'), 10) || 200, 500);
    const snapshot = await db.collection('expedientes')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const expedientes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ expedientes, hasMore: snapshot.size === limit });
  } catch (error) {
    console.error('Error obteniendo expedientes:', error);
    res.status(500).json({ error: 'Error obteniendo expedientes' });
  }
});

router.post('/', verifyToken, async (req: Request, res: Response) => {
  const { nombre, email, pais, tipoVisado, estado, notas } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const ref = await db.collection('expedientes').add({
      nombre,
      email,
      pais,
      tipoVisado,
      estado: estado || 'nuevo',
      notas: notas || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    res.json({ id: ref.id, ok: true });
  } catch (error) {
    console.error('Error creando expediente:', error);
    res.status(500).json({ error: 'Error creando expediente' });
  }
});

const EXP_ESTADOS = new Set(['nuevo', 'en proceso', 'documentación pendiente', 'presentado', 'aprobado', 'denegado']);

router.post('/bulk', verifyToken, async (req: Request, res: Response) => {
  try {
    const { ids, action, estado } = req.body as { ids?: unknown; action?: unknown; estado?: unknown };
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) {
      return res.status(400).json({ error: 'ids inválidos (1-500)' });
    }
    const cleanIds = ids.filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 500);
    if (cleanIds.length === 0) return res.status(400).json({ error: 'Sin ids válidos' });

    if (action === 'updateEstado') {
      if (typeof estado !== 'string' || !EXP_ESTADOS.has(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      const batch = db.batch();
      const now = new Date().toISOString();
      cleanIds.forEach(id => batch.update(db.collection('expedientes').doc(id), { estado, updatedAt: now }));
      await batch.commit();
      return res.json({ ok: true, afectados: cleanIds.length });
    }

    if (action === 'delete') {
      const batch = db.batch();
      cleanIds.forEach(id => batch.delete(db.collection('expedientes').doc(id)));
      await batch.commit();
      return res.json({ ok: true, afectados: cleanIds.length });
    }

    return res.status(400).json({ error: 'Acción no soportada' });
  } catch (error) {
    console.error('Error bulk expedientes:', error);
    res.status(500).json({ error: 'Error en operación masiva' });
  }
});

const EXP_ALLOWED_FIELDS = ['nombre', 'pais', 'tipoVisado', 'estado', 'notas'] as const;

router.get('/:id/notas', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const snap = await db.collection('expedientes').doc(id)
      .collection('notas')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
    const notas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ notas });
  } catch (error) {
    console.error('Error obteniendo notas:', error);
    res.status(500).json({ error: 'Error obteniendo notas' });
  }
});

router.post('/:id/notas', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { texto } = req.body as { texto?: unknown };
    if (typeof texto !== 'string' || texto.trim().length === 0 || texto.length > 5000) {
      return res.status(400).json({ error: 'Texto inválido (1-5000)' });
    }
    const autorEmail = (req as any).user?.email || 'desconocido';
    const ref = await db.collection('expedientes').doc(id)
      .collection('notas')
      .add({
        texto: texto.trim(),
        autorEmail,
        createdAt: new Date().toISOString(),
      });
    await db.collection('expedientes').doc(id).update({ updatedAt: new Date().toISOString() });
    res.json({ id: ref.id, ok: true });
  } catch (error) {
    console.error('Error creando nota:', error);
    res.status(500).json({ error: 'Error creando nota' });
  }
});

router.delete('/:id/notas/:notaId', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id, notaId } = req.params;
    await db.collection('expedientes').doc(id).collection('notas').doc(notaId).delete();
    res.json({ ok: true });
  } catch (error) {
    console.error('Error eliminando nota:', error);
    res.status(500).json({ error: 'Error eliminando nota' });
  }
});

router.patch('/:id', verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  const updates: Record<string, unknown> = {};
  for (const k of EXP_ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body, k)) updates[k] = req.body[k];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Sin campos válidos para actualizar' });
  }

  try {
    await db.collection('expedientes').doc(id).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error actualizando expediente:', error);
    res.status(500).json({ error: 'Error actualizando expediente' });
  }
});

export default router;
