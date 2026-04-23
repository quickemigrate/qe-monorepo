import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import { db } from '../firebase';

const router = Router();

router.get('/chat', verifyToken, async (_req: Request, res: Response) => {
  try {
    const doc = await db.collection('config').doc('chat').get();
    const data = doc.data() || { limiteMensajesPro: 50, limiteMensajesPremium: 200 };
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener configuración' });
  }
});

router.patch('/chat', verifyToken, async (req: Request, res: Response) => {
  try {
    const { limiteMensajesPro, limiteMensajesPremium } = req.body;

    if (typeof limiteMensajesPro !== 'number' || typeof limiteMensajesPremium !== 'number') {
      return res.status(400).json({ success: false, error: 'Valores inválidos' });
    }

    await db.collection('config').doc('chat').update({
      limiteMensajesPro,
      limiteMensajesPremium,
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Error al guardar configuración' });
  }
});

export default router;
