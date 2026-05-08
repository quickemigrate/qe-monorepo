import { Router, Request, Response, raw } from 'express';
import { db } from '../firebase';
import { stripe } from '../config/stripe';
import { Resend } from 'resend';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY || '');

// Stripe firma el body raw. NO parsear JSON antes.
router.post('/', raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string | undefined;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET no configurado');
    return res.status(500).send('Webhook secret missing');
  }
  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, secret);
  } catch (err: any) {
    console.error('[stripe-webhook] signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotencia: log evento procesado para dedupe
  const eventId = event.id;
  const eventRef = db.collection('stripe_events').doc(eventId);
  const eventSnap = await eventRef.get();
  if (eventSnap.exists) {
    return res.json({ received: true, duplicate: true });
  }
  await eventRef.set({
    type: event.type,
    receivedAt: new Date().toISOString(),
    processed: false,
  });

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
      default:
        // No manejado pero ack 200 para que Stripe no reintente
        break;
    }

    await eventRef.update({ processed: true, processedAt: new Date().toISOString() });
    res.json({ received: true });
  } catch (err) {
    console.error(`[stripe-webhook] handler error (${event.type}):`, err);
    await eventRef.update({ processed: false, error: String(err) });
    // 500 para que Stripe reintente automáticamente
    res.status(500).send('Handler error');
  }
});

// ─── Handlers ────────────────────────────────────────────────

async function handlePaymentIntentSucceeded(pi: any) {
  // Caso A: pago de diagnóstico Starter
  const diagnosticoId = pi.metadata?.diagnosticoId;
  if (diagnosticoId) {
    const diagRef = db.collection('diagnosticos').doc(diagnosticoId);
    const diagSnap = await diagRef.get();
    if (!diagSnap.exists) {
      console.warn(`[stripe-webhook] diagnosticoId ${diagnosticoId} no existe`);
      return;
    }
    const data = diagSnap.data()!;

    // Idempotencia: si ya procesado, no re-procesar
    if (
      data.stripePaymentIntentId === pi.id &&
      ['procesando', 'completado', 'error'].includes(data.estado)
    ) {
      return;
    }

    await diagRef.update({
      estado: 'procesando',
      stripePaymentIntentId: pi.id,
      pagadoEn: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (data.email) {
      await db.collection('usuarios').doc(data.email).update({
        diagnosticoId,
        plan: data.plan || 'starter',
        actualizadoEn: new Date().toISOString(),
      });
    }

    const { procesarConRetry } = await import('../services/diagnosticoProcessor');
    procesarConRetry(diagnosticoId, { ...data, email: data.email });
    return;
  }

  // Caso B: pago Pro (legacy paymentIntent flow — migrar a subscriptions)
  const userEmail = pi.metadata?.userEmail;
  const planId = pi.metadata?.planId;
  if (userEmail && planId === 'pro') {
    await db.collection('usuarios').doc(userEmail).set({
      plan: 'pro',
      planActivadoEn: new Date().toISOString(),
      stripePaymentIntentId: pi.id,
      actualizadoEn: new Date().toISOString(),
    }, { merge: true });
  }
}

async function handlePaymentIntentFailed(pi: any) {
  const reason = pi.last_payment_error?.message || 'unknown';
  const diagnosticoId = pi.metadata?.diagnosticoId;

  if (diagnosticoId) {
    await db.collection('diagnosticos').doc(diagnosticoId).update({
      estado: 'pago_fallido',
      ultimoErrorPago: reason,
      updatedAt: new Date().toISOString(),
    }).catch(() => { /* doc may not exist */ });
  }

  await notifyAdmin(
    `Pago Stripe fallido — ${pi.id}`,
    `PaymentIntent ${pi.id} falló.\nMotivo: ${reason}\nMetadata: ${JSON.stringify(pi.metadata)}`
  );
}

async function handleSubscriptionUpsert(sub: any) {
  // Resolver email: customer.metadata.userEmail o subscription.metadata.userEmail
  const customer = await stripe.customers.retrieve(sub.customer as string);
  const userEmail =
    sub.metadata?.userEmail ||
    (customer && !('deleted' in customer) ? customer.metadata?.userEmail || customer.email : null);

  if (!userEmail) {
    console.warn(`[stripe-webhook] subscription ${sub.id} sin userEmail`);
    return;
  }

  // status posibles: active, trialing, past_due, canceled, incomplete, incomplete_expired, unpaid
  const isActive = ['active', 'trialing'].includes(sub.status);
  const plan = isActive ? (sub.metadata?.planId || 'pro') : 'free';

  const periodEnd = (sub as any).current_period_end as number | undefined;

  await db.collection('usuarios').doc(userEmail).set({
    plan,
    stripeCustomerId: sub.customer,
    stripeSubscriptionId: sub.id,
    subscriptionStatus: sub.status,
    subscriptionCancelAtPeriodEnd: !!sub.cancel_at_period_end,
    subscriptionCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    actualizadoEn: new Date().toISOString(),
  }, { merge: true });
}

async function handleSubscriptionDeleted(sub: any) {
  const customer = await stripe.customers.retrieve(sub.customer as string);
  const userEmail =
    sub.metadata?.userEmail ||
    (customer && !('deleted' in customer) ? customer.metadata?.userEmail || customer.email : null);

  if (!userEmail) return;

  await db.collection('usuarios').doc(userEmail).set({
    plan: 'free',
    subscriptionStatus: 'canceled',
    stripeSubscriptionId: null,
    subscriptionCancelAtPeriodEnd: false,
    canceladoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  }, { merge: true });
}

async function handleInvoicePaymentFailed(invoice: any) {
  const customerEmail = invoice.customer_email;
  const subId = (invoice as any).subscription as string | undefined;

  if (customerEmail) {
    await db.collection('usuarios').doc(customerEmail).set({
      ultimoPagoFallido: {
        invoiceId: invoice.id,
        fecha: new Date().toISOString(),
        cantidad: invoice.amount_due,
      },
    }, { merge: true });
  }

  await notifyAdmin(
    `Cobro mensual Pro fallido — ${customerEmail || 'unknown'}`,
    `Invoice ${invoice.id} falló (subscription ${subId}). Cliente debería actualizar tarjeta.`
  );
}

async function handleChargeRefunded(charge: any) {
  await notifyAdmin(
    `Reembolso Stripe — ${charge.id}`,
    `Cargo ${charge.id} reembolsado por ${charge.amount_refunded / 100}€. Customer ${charge.customer}`
  );
}

async function notifyAdmin(subject: string, body: string) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Quick Emigrate <hola@quickemigrate.com>',
      to: process.env.CONTACT_EMAIL || '',
      subject: `[QE] ${subject}`,
      html: `<pre style="font-family:monospace;white-space:pre-wrap">${body}</pre>`,
    });
  } catch (e) {
    console.error('[stripe-webhook] notifyAdmin failed:', e);
  }
}

export default router;
