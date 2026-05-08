import { Router, Request, Response } from 'express';
import { verifyClientToken } from '../middleware/clientAuth';
import { db } from '../firebase';
import { stripe } from '../config/stripe';

const router = Router();

async function getOrCreateCustomer(userEmail: string, nombre?: string): Promise<string> {
  const userDoc = await db.collection('usuarios').doc(userEmail).get();
  const existing = userDoc.data()?.stripeCustomerId;
  if (existing) return existing;

  const customer = await stripe.customers.create({
    email: userEmail,
    name: nombre,
    metadata: { userEmail },
  });

  await db.collection('usuarios').doc(userEmail).update({
    stripeCustomerId: customer.id,
    actualizadoEn: new Date().toISOString(),
  });

  return customer.id;
}

// Crea Subscription real Stripe — devuelve clientSecret del primer invoice
router.post('/create-subscription', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const userDoc = await db.collection('usuarios').doc(userEmail).get();
    if (!userDoc.exists) return res.status(403).json({ success: false, error: 'Usuario no encontrado' });

    const userData = userDoc.data()!;
    if (userData.plan === 'pro' || userData.plan === 'premium') {
      return res.status(400).json({ success: false, error: 'Ya tienes un plan Pro o Premium activo' });
    }

    const priceId = process.env.STRIPE_PRICE_ID_PRO;
    if (!priceId) {
      return res.status(500).json({
        success: false,
        error: 'Plan Pro no configurado en Stripe. Contacta soporte.',
      });
    }

    const customerId = await getOrCreateCustomer(userEmail, userData.nombre);

    const subscription: any = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { userEmail, planId: 'pro' },
    });

    const paymentIntent = subscription.latest_invoice?.payment_intent;
    if (!paymentIntent?.client_secret) {
      return res.status(500).json({ success: false, error: 'Error iniciando el pago' });
    }

    await db.collection('usuarios').doc(userEmail).update({
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      actualizadoEn: new Date().toISOString(),
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
    });
  } catch (err: any) {
    console.error('Error creando subscription:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al iniciar la suscripción' });
  }
});

// Cancel at period end — mantiene acceso hasta fin de periodo
router.post('/cancelar', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const userDoc = await db.collection('usuarios').doc(userEmail).get();
    if (!userDoc.exists) return res.status(403).json({ success: false, error: 'Usuario no encontrado' });

    const subId = userDoc.data()?.stripeSubscriptionId;
    if (!subId) {
      return res.status(400).json({ success: false, error: 'No tienes una suscripción activa' });
    }

    const updated: any = await stripe.subscriptions.update(subId, { cancel_at_period_end: true });

    const periodEnd = updated.current_period_end as number | undefined;
    await db.collection('usuarios').doc(userEmail).update({
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      actualizadoEn: new Date().toISOString(),
    });

    res.json({
      success: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    });
  } catch (err: any) {
    console.error('Error cancelando suscripción:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al cancelar' });
  }
});

// Reanudar antes de que expire
router.post('/reanudar', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const userDoc = await db.collection('usuarios').doc(userEmail).get();
    if (!userDoc.exists) return res.status(403).json({ success: false, error: 'Usuario no encontrado' });

    const subId = userDoc.data()?.stripeSubscriptionId;
    if (!subId) {
      return res.status(400).json({ success: false, error: 'No tienes una suscripción que reanudar' });
    }

    await stripe.subscriptions.update(subId, { cancel_at_period_end: false });

    await db.collection('usuarios').doc(userEmail).update({
      subscriptionCancelAtPeriodEnd: false,
      actualizadoEn: new Date().toISOString(),
    });

    res.json({ success: true, cancelAtPeriodEnd: false });
  } catch (err: any) {
    console.error('Error reanudando suscripción:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al reanudar' });
  }
});

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
    const proPlan = planes.find((p: any) => p.id === 'pro');

    if (!proPlan?.precio) {
      return res.status(500).json({ success: false, error: 'Plan Pro no configurado. Contacta con soporte.' });
    }

    const amount = Math.round(proPlan.precio * 100);
    const precioTexto = proPlan.precioTexto || `${proPlan.precio}€/mes`;

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
