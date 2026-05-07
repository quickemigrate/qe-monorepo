import { Router, Request, Response } from 'express';
import { db } from '../firebase';
import { verifyToken } from '../middleware/auth';

const router = Router();

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

const EXP_ALLOWED_FIELDS = ['nombre', 'pais', 'tipoVisado', 'estado', 'notas'] as const;

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
