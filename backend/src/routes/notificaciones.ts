import { Router, Request, Response } from 'express';
import { getMessaging } from 'firebase-admin/messaging';
import { db } from '../firebase';
import { verifyClientToken } from '../middleware/clientAuth';
import { verifyToken } from '../middleware/auth';

const router = Router();

const PAISES_VALIDOS = new Set([
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador',
  'El Salvador', 'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá',
  'Paraguay', 'Perú', 'República Dominicana', 'Uruguay', 'Venezuela',
]);

function sanitizePaises(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(
    input
      .filter((p): p is string => typeof p === 'string')
      .map(p => p.trim())
      .filter(p => PAISES_VALIDOS.has(p))
  )).slice(0, 10);
}

// Cliente: subscribirse a notificaciones por país
router.post('/suscribir', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const { token, paises } = req.body as { token?: unknown; paises?: unknown };

    if (typeof token !== 'string' || token.length < 20 || token.length > 4096) {
      return res.status(400).json({ success: false, error: 'Token inválido' });
    }
    const paisesValidos = sanitizePaises(paises);
    if (paisesValidos.length === 0) {
      return res.status(400).json({ success: false, error: 'Debes elegir al menos un país' });
    }

    await db.collection('notificaciones_subs').doc(token).set({
      email: userEmail,
      paises: paisesValidos,
      activo: true,
      actualizadoEn: new Date().toISOString(),
    }, { merge: true });

    res.json({ success: true });
  } catch (err) {
    console.error('Error suscribiendo notificaciones:', err);
    res.status(500).json({ success: false, error: 'Error al suscribir' });
  }
});

// Cliente: ver suscripción actual (consolidada por email)
router.get('/suscripcion', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const snap = await db.collection('notificaciones_subs')
      .where('email', '==', userEmail)
      .where('activo', '==', true)
      .limit(20)
      .get();

    if (snap.empty) return res.json({ success: true, data: null });

    const paisesSet = new Set<string>();
    snap.docs.forEach(d => (d.data().paises || []).forEach((p: string) => paisesSet.add(p)));
    res.json({ success: true, data: { paises: [...paisesSet], activo: true } });
  } catch (err) {
    console.error('Error obteniendo suscripción:', err);
    res.status(500).json({ success: false, error: 'Error al obtener suscripción' });
  }
});

// Cliente: desactivar todas sus suscripciones
router.delete('/suscripcion', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const snap = await db.collection('notificaciones_subs')
      .where('email', '==', userEmail)
      .limit(50)
      .get();
    if (snap.empty) return res.json({ success: true });
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    res.json({ success: true, eliminadas: snap.size });
  } catch (err) {
    console.error('Error desactivando suscripciones:', err);
    res.status(500).json({ success: false, error: 'Error al desactivar' });
  }
});

// Admin: enviar notificación de cambio normativa a suscriptores de un país
router.post('/enviar', verifyToken, async (req: Request, res: Response) => {
  try {
    const { pais, titulo, cuerpo, url } = req.body as {
      pais?: string; titulo?: string; cuerpo?: string; url?: string;
    };

    if (!pais || !PAISES_VALIDOS.has(pais)) {
      return res.status(400).json({ success: false, error: 'País inválido' });
    }
    if (!titulo || typeof titulo !== 'string' || titulo.length > 200) {
      return res.status(400).json({ success: false, error: 'Título inválido (max 200)' });
    }
    if (!cuerpo || typeof cuerpo !== 'string' || cuerpo.length > 500) {
      return res.status(400).json({ success: false, error: 'Cuerpo inválido (max 500)' });
    }

    const targetUrl = (typeof url === 'string' && url.startsWith('/')) ? url : '/cliente/inicio';

    const snap = await db.collection('notificaciones_subs')
      .where('paises', 'array-contains', pais)
      .where('activo', '==', true)
      .limit(500)
      .get();

    if (snap.empty) {
      return res.json({ success: true, enviados: 0, fallidos: 0, suscriptores: 0 });
    }

    const tokens = snap.docs.map(d => d.id);

    // FCM admite máx 500 por sendEachForMulticast — ya limitado
    const messaging = getMessaging();
    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: { title: titulo, body: cuerpo },
      data: { url: targetUrl, pais, tag: `normativa-${pais}-${Date.now()}` },
      webpush: {
        fcmOptions: { link: targetUrl },
      },
    });

    // Limpiar tokens inválidos
    const tokensInvalidos: string[] = [];
    result.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code;
        if (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token') {
          tokensInvalidos.push(tokens[i]);
        }
      }
    });
    if (tokensInvalidos.length > 0) {
      const batch = db.batch();
      tokensInvalidos.forEach(t => batch.delete(db.collection('notificaciones_subs').doc(t)));
      await batch.commit();
    }

    res.json({
      success: true,
      enviados: result.successCount,
      fallidos: result.failureCount,
      suscriptores: tokens.length,
      limpiados: tokensInvalidos.length,
    });
  } catch (err) {
    console.error('Error enviando notificaciones:', err);
    res.status(500).json({ success: false, error: 'Error al enviar notificaciones' });
  }
});

export default router;
