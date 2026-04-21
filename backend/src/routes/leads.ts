import { Router, Request, Response } from 'express';
import { db } from '../firebase';
import { verifyToken } from '../middleware/auth';

const router = Router();

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
