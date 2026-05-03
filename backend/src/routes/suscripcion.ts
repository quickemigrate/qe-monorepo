import { Router, Request, Response } from 'express';
import { verifyClientToken } from '../middleware/clientAuth';
import { db } from '../firebase';
import { stripe } from '../config/stripe';

const router = Router();

const DEFAULT_PRO_PRICE_CENTS = 3900; // €39

router.post('/create-payment-intent', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;

    const userDoc = await db.collection('usuarios').doc(userEmail).get();
    if (!userDoc.exists) return res.status(403).json({ success: false, error: 'Usuario no encontrado' });

    const { plan } = userDoc.data()!;
    if (plan === 'pro' || plan === 'premium') {
      return res.status(400).json({ success: false, error: 'Ya tienes un plan Pro o Premium activo' });
    }

    const configDoc = await db.collection('config').doc('planes').get();
    const planes: any[] = configDoc.data()?.planes || [];
    const proPlan = planes.find(p => p.id === 'pro');
    const amount = proPlan?.precio ? Math.round(proPlan.precio * 100) : DEFAULT_PRO_PRICE_CENTS;
    const precioTexto = proPlan?.precioTexto || '39€/mes';

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      metadata: { userEmail, planId: 'pro' },
    });

    res.json({ success: true, clientSecret: paymentIntent.client_secret, precioTexto });
  } catch (err) {
    console.error('Error creando payment intent suscripción:', err);
    res.status(500).json({ success: false, error: 'Error al iniciar el pago' });
  }
});

router.post('/confirm-payment', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ success: false, error: 'paymentIntentId requerido' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, error: 'Pago no completado' });
    }

    if (paymentIntent.metadata.userEmail !== userEmail) {
      return res.status(403).json({ success: false, error: 'Pago no autorizado' });
    }

    await db.collection('usuarios').doc(userEmail).update({
      plan: 'pro',
      planActivadoEn: new Date().toISOString(),
      stripePaymentIntentId: paymentIntentId,
      actualizadoEn: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error confirmando suscripción Pro:', err);
    res.status(500).json({ success: false, error: 'Error al activar el plan' });
  }
});

export default router;
