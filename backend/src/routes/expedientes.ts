import { Router, Request, Response } from 'express';
import { db } from '../firebase';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/', verifyToken, async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('expedientes')
      .orderBy('createdAt', 'desc')
      .get();

    const expedientes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ expedientes });
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

router.patch('/:id', verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

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
