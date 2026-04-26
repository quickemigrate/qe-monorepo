import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import { db } from '../firebase';

const router = Router();

const DEFAULT_PLANES = [
  { id: 'free', nombre: 'Free', precio: 0, precioTexto: 'Gratis', tipo: 'free', descripcion: '', features: [], activo: true, orden: 1 },
  { id: 'starter', nombre: 'Starter', precio: 59, precioTexto: '59€', tipo: 'unico', descripcion: '', features: [], activo: true, orden: 2 },
  { id: 'pro', nombre: 'Pro', precio: 39, precioTexto: '39€/mes', tipo: 'mensual', descripcion: '', features: [], activo: true, orden: 3 },
  { id: 'premium', nombre: 'Premium', precio: null, precioTexto: 'A consultar', tipo: 'custom', descripcion: '', features: [], activo: true, orden: 4 },
];

router.get('/planes', async (_req: Request, res: Response) => {
  try {
    const doc = await db.collection('config').doc('planes').get();
    const data = doc.data();
    res.json({ planes: data?.planes ?? DEFAULT_PLANES });
  } catch {
    res.json({ planes: DEFAULT_PLANES });
  }
});

router.put('/planes', verifyToken, async (req: Request, res: Response) => {
  try {
    const { planes } = req.body;
    if (!Array.isArray(planes)) {
      return res.status(400).json({ error: 'planes debe ser un array' });
    }
    await db.collection('config').doc('planes').set({ planes });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al guardar planes' });
  }
});

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
