import { Router, Request, Response } from 'express';
import { Resend } from 'resend';
import { verifyClientToken } from '../middleware/clientAuth';
import { db } from '../firebase';
import { stripe } from '../config/stripe';

const router = Router();

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

function formatFechaES(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function sendCancelEmail(to: string, nombre: string | undefined, periodEndIso: string | null, razon: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const from = process.env.RESEND_FROM_EMAIL || 'Quick Emigrate <hola@quickemigrate.com>';
  const adminEmail = process.env.ADMIN_EMAIL_1;
  const baseUrl = process.env.FRONTEND_URL || 'https://quickemigrate.com';
  const resend = new Resend(apiKey);

  const fechaFin = formatFechaES(periodEndIso);
  const saludo = nombre ? `Hola ${escapeHtml(nombre)},` : 'Hola,';
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f4f5; padding: 32px 16px;">
  <div style="background: #1A1C1C; border-radius: 16px; padding: 28px;">
    <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Quick Emigrate</p>
    <h1 style="color: #fff; font-size: 22px; margin: 0;">${saludo}</h1>
    <h2 style="color: #25D366; font-size: 18px; margin: 12px 0 0 0;">Hemos programado la cancelación de tu Plan Pro</h2>
  </div>
  <div style="background: #fff; border-radius: 16px; padding: 28px; margin-top: 16px; color: #374151; line-height: 1.65; font-size: 14.5px;">
    <p>Tu suscripción no se renovará. Mantienes el acceso completo al Plan Pro hasta el <strong>${fechaFin}</strong>. Después tu cuenta pasará a Free automáticamente.</p>
    <p>Si cambias de opinión, puedes <a href="${baseUrl}/cliente/plan" style="color: #25D366;">reanudar la suscripción</a> antes de esa fecha sin perder nada.</p>
    <p style="color: #6B7280; font-size: 12.5px; margin-top: 20px;">Si esto no fuiste tú, responde a este email y lo revisamos.</p>
  </div>
</div>`.trim();

  try {
    await resend.emails.send({
      from,
      to,
      subject: 'Tu Plan Pro queda cancelado al final del periodo',
      html,
    });
  } catch (err) {
    console.error('Error enviando email cancelación:', err);
  }

  if (adminEmail) {
    const adminHtml = `
<p>Cancelación Pro programada.</p>
<ul>
  <li><strong>Email:</strong> ${escapeHtml(to)}</li>
  <li><strong>Nombre:</strong> ${escapeHtml(nombre || '—')}</li>
  <li><strong>Fin de periodo:</strong> ${fechaFin}</li>
  <li><strong>Razón:</strong> ${razon ? escapeHtml(razon) : '<em>(no indicada)</em>'}</li>
</ul>`.trim();
    try {
      await resend.emails.send({
        from,
        to: adminEmail,
        subject: `[QE] Cancelación Pro: ${to}`,
        html: adminHtml,
      });
    } catch (err) {
      console.error('Error enviando email admin cancelación:', err);
    }
  }
}

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
    const razon = (req.body?.razon || '').toString().trim().substring(0, 500);

    const userDoc = await db.collection('usuarios').doc(userEmail).get();
    if (!userDoc.exists) return res.status(403).json({ success: false, error: 'Usuario no encontrado' });

    const userData = userDoc.data()!;
    const subId = userData.stripeSubscriptionId;
    if (!subId) {
      return res.status(400).json({ success: false, error: 'No tienes una suscripción activa' });
    }

    const updated: any = await stripe.subscriptions.update(subId, { cancel_at_period_end: true });

    const periodEnd = updated.current_period_end as number | undefined;
    const periodEndIso = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
    const nowIso = new Date().toISOString();

    await db.collection('usuarios').doc(userEmail).update({
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: periodEndIso,
      subscriptionCancelReason: razon || null,
      subscriptionCanceledAt: nowIso,
      actualizadoEn: nowIso,
    });

    // Audit log para análisis de churn
    await db.collection('cancelaciones').add({
      email: userEmail,
      stripeSubscriptionId: subId,
      razon: razon || null,
      currentPeriodEnd: periodEndIso,
      creadoEn: nowIso,
    });

    sendCancelEmail(userEmail, userData.nombre, periodEndIso, razon).catch(err =>
      console.error('Error enviando email cancelación (fire-and-forget):', err)
    );

    res.json({
      success: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: periodEndIso,
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
