import { db } from '../firebase';
import { stripe } from '../config/stripe';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://quickemigrate.com';

export async function getOrCreateCustomer(userEmail: string, nombre?: string): Promise<string> {
  const userDoc = await db.collection('usuarios').doc(userEmail).get();
  const existing = userDoc.data()?.stripeCustomerId;
  if (existing) return existing;

  const customer = await stripe.customers.create({
    email: userEmail,
    name: nombre,
    metadata: { userEmail },
  });

  await db.collection('usuarios').doc(userEmail).set({
    stripeCustomerId: customer.id,
    actualizadoEn: new Date().toISOString(),
  }, { merge: true });

  return customer.id;
}

async function getPrecioStarterCents(): Promise<number> {
  let precioStarter = 59;
  try {
    const configDoc = await db.collection('config').doc('planes').get();
    const planes: any[] = configDoc.data()?.planes || [];
    const starter = planes.find((p: any) => p.id === 'starter');
    if (starter?.precio != null) precioStarter = starter.precio;
  } catch { /* fallback */ }
  return Math.round(precioStarter * 100);
}

export async function crearCheckoutDiagnostico(params: {
  userEmail: string;
  nombre: string;
  perfil: Record<string, any>;
}): Promise<{ clientSecret: string; diagnosticoId: string }> {
  const { userEmail, nombre, perfil } = params;

  const datosFormulario: Record<string, any> = { ...perfil, nombre, email: userEmail };
  if (!datosFormulario.nombre || !datosFormulario.pais || !datosFormulario.objetivo) {
    throw new Error('Completa tu perfil antes de continuar (nombre, país y objetivo son obligatorios)');
  }

  const diagnosticoRef = await db.collection('diagnosticos').add({
    ...datosFormulario,
    estado: 'pendiente_pago',
    creadoEn: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const customerId = await getOrCreateCustomer(userEmail, nombre);
  const amount = await getPrecioStarterCents();

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    mode: 'payment',
    customer: customerId,
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: 'Diagnóstico Migratorio IA — Quick Emigrate' },
        unit_amount: amount,
      },
      quantity: 1,
    }],
    payment_method_types: ['card', 'bizum'] as any,
    payment_intent_data: {
      metadata: { diagnosticoId: diagnosticoRef.id, userEmail, tipo: 'diagnostico' },
    },
    metadata: { diagnosticoId: diagnosticoRef.id, userEmail, tipo: 'diagnostico' },
    return_url: `${FRONTEND_URL}/diagnostico/exito?session_id={CHECKOUT_SESSION_ID}`,
  } as any);

  await diagnosticoRef.update({ stripeSessionId: session.id });

  if (!session.client_secret) throw new Error('Stripe no devolvió client_secret');
  return { clientSecret: session.client_secret, diagnosticoId: diagnosticoRef.id };
}

export async function crearCheckoutPro(params: {
  userEmail: string;
  nombre?: string;
}): Promise<{ clientSecret: string }> {
  const { userEmail, nombre } = params;

  const priceId = process.env.STRIPE_PRICE_ID_PRO;
  if (!priceId) throw new Error('Plan Pro no configurado en Stripe');

  const customerId = await getOrCreateCustomer(userEmail, nombre);

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { userEmail, planId: 'pro' },
    },
    metadata: { userEmail, tipo: 'pro', planId: 'pro' },
    return_url: `${FRONTEND_URL}/cliente/plan?session_id={CHECKOUT_SESSION_ID}`,
  } as any);

  if (!session.client_secret) throw new Error('Stripe no devolvió client_secret');
  return { clientSecret: session.client_secret };
}
