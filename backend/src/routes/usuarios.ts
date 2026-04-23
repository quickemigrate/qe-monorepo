import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import { db } from '../firebase';

const router = Router();

router.get('/', verifyToken, async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('usuarios')
      .orderBy('creadoEn', 'desc')
      .limit(100)
      .get();
    const usuarios = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: usuarios });
  } catch {
    res.status(500).json({ success: false, error: 'Error al listar usuarios' });
  }
});

router.patch('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!['starter', 'pro', 'premium'].includes(plan)) {
      return res.status(400).json({ success: false, error: 'Plan inválido' });
    }

    await db.collection('usuarios').doc(id).update({
      plan,
      actualizadoEn: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Error al actualizar usuario' });
  }
});

export default router;
