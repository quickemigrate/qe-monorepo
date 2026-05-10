import { Router, Request, Response } from 'express';
import { verifyClientToken, requireEmailVerified } from '../middleware/clientAuth';
import { db } from '../firebase';
import { stripe } from '../config/stripe';
import { crearCheckoutDiagnostico, crearCheckoutPro } from '../services/pagos';

const router = Router();

// POST /api/pagos/checkout — body: { tipo: 'diagnostico' | 'pro' }
router.post('/checkout', verifyClientToken, requireEmailVerified, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const { tipo } = req.body as { tipo?: 'diagnostico' | 'pro' };

    if (tipo !== 'diagnostico' && tipo !== 'pro') {
      return res.status(400).json({ success: false, error: 'tipo inválido' });
    }

    const userDoc = await db.collection('usuarios').doc(userEmail).get();
    if (!userDoc.exists) return res.status(403).json({ success: false, error: 'Usuario no encontrado' });
    const userData = userDoc.data()!;

    if (tipo === 'pro') {
      if (userData.plan === 'pro' || userData.plan === 'premium') {
        return res.status(400).json({ success: false, error: 'Ya tienes un plan Pro o Premium activo' });
      }
      const result = await crearCheckoutPro({ userEmail, nombre: userData.nombre });
      return res.json({ success: true, ...result });
    }

    // tipo === 'diagnostico'
    const result = await crearCheckoutDiagnostico({
      userEmail,
      nombre: userData.nombre || '',
      perfil: userData.perfil || {},
    });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error creando checkout session:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al iniciar el pago' });
  }
});

// GET /api/pagos/session/:id — estado de una Checkout Session (post-return)
router.get('/session/:id', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const session = await stripe.checkout.sessions.retrieve(req.params.id);

    if (session.metadata?.userEmail !== userEmail) {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    res.json({
      success: true,
      status: session.status,
      paymentStatus: session.payment_status,
      tipo: session.metadata?.tipo,
      diagnosticoId: session.metadata?.diagnosticoId || null,
    });
  } catch (err: any) {
    console.error('Error recuperando session:', err);
    res.status(500).json({ success: false, error: 'Error al recuperar la sesión' });
  }
});

export default router;
