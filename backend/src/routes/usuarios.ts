import { Router, Request, Response } from 'express';
import { Resend } from 'resend';
import { verifyToken } from '../middleware/auth';
import { verifyClientToken } from '../middleware/clientAuth';
import { rateLimit } from '../middleware/rateLimit';
import { db } from '../firebase';

const router = Router();

const registroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyName: 'registro',
  message: 'Demasiados registros desde tu IP. Espera 1 hora antes de reintentar.',
});

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyName: 'reset-password',
  message: 'Demasiadas solicitudes de reset. Espera 1 hora antes de reintentar.',
});

function escapeHtmlReset(s: string): string {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

// Admin: list all users
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

// Client: get own profile
router.get('/perfil', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;
    const doc = await db.collection('usuarios').doc(userEmail).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, data: doc.data() });
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener perfil' });
  }
});

// Admin: sync Firebase Auth users to Firestore
router.post('/sincronizar', verifyToken, async (_req: Request, res: Response) => {
  try {
    const { getAuth } = await import('firebase-admin/auth');
    const adminAuth = getAuth();

    const listResult = await adminAuth.listUsers();
    let sincronizados = 0;

    for (const userRecord of listResult.users) {
      const email = userRecord.email;
      if (!email) continue;

      const docRef = db.collection('usuarios').doc(email);
      const doc = await docRef.get();

      if (!doc.exists) {
        await docRef.set({
          uid: userRecord.uid,
          email,
          nombre: userRecord.displayName || email.split('@')[0],
          plan: 'free',
          mensajesUsados: 0,
          consentimientoDiagnostico: false,
          diagnosticoId: null,
          perfilCompleto: false,
          creadoEn: userRecord.metadata.creationTime || new Date().toISOString(),
          actualizadoEn: new Date().toISOString(),
        });
        sincronizados++;
      }
    }

    res.json({ success: true, sincronizados });
  } catch {
    res.status(500).json({ success: false, error: 'Error al sincronizar' });
  }
});

// Public: create Firestore doc after Firebase Auth signup
router.post('/registro', registroLimiter, async (req: Request, res: Response) => {
  try {
    const { email, nombre } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email requerido' });
    }

    await db.collection('usuarios').doc(email).set({
      email,
      nombre: nombre || email.split('@')[0],
      plan: 'free',
      mensajesUsados: 0,
      consentimientoDiagnostico: false,
      diagnosticoId: null,
      perfilCompleto: false,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    }, { merge: true });

    res.json({ success: true });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ success: false, error: 'Error al registrar usuario' });
  }
});

// Reenvía email de verificación. Frontend llama tras click "Reenviar verificación".
const verifyEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyName: 'verify-email-resend',
  message: 'Demasiadas solicitudes. Espera 1 hora.',
});

router.post('/verify-email/resend', verifyClientToken, verifyEmailLimiter, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const emailVerified = (req as any).user.email_verified;
    if (emailVerified) {
      return res.json({ success: true, alreadyVerified: true });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Quick Emigrate <hola@quickemigrate.com>';
    const baseUrl = process.env.FRONTEND_URL || 'https://quickemigrate.com';
    if (!apiKey) return res.json({ success: true });

    const { getAuth } = await import('firebase-admin/auth');
    let firebaseLink: string;
    try {
      firebaseLink = await getAuth().generateEmailVerificationLink(userEmail);
    } catch (err) {
      console.error('[verify-email/resend] Error generando link:', err);
      return res.json({ success: true });
    }

    let customLink = firebaseLink;
    try {
      const u = new URL(firebaseLink);
      const oobCode = u.searchParams.get('oobCode') || '';
      const fbApiKey = u.searchParams.get('apiKey') || '';
      const lang = u.searchParams.get('lang') || 'es';
      customLink = `${baseUrl}/cliente/auth-action?mode=verifyEmail&oobCode=${encodeURIComponent(oobCode)}&apiKey=${encodeURIComponent(fbApiKey)}&lang=${encodeURIComponent(lang)}`;
    } catch { /* fallback */ }

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f4f5; padding: 32px 16px;">
  <div style="background: #1A1C1C; border-radius: 16px; padding: 28px;">
    <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Quick Emigrate</p>
    <h1 style="color: #fff; font-size: 22px; margin: 0;">Verifica tu email</h1>
  </div>
  <div style="background: #fff; border-radius: 16px; padding: 28px; margin-top: 16px; color: #374151; line-height: 1.65; font-size: 14.5px;">
    <p>Confirma que <strong>${escapeHtmlReset(userEmail)}</strong> es tu email para activar tu cuenta.</p>
    <div style="text-align: center; margin: 24px 0 8px;">
      <a href="${customLink}" style="display: inline-block; background: #25D366; color: #062810; font-weight: 700; padding: 12px 22px; border-radius: 999px; text-decoration: none; font-size: 14px;">Verificar email</a>
    </div>
    <p style="color: #6B7280; font-size: 11.5px; word-break: break-all; margin-top: 16px;">¿No funciona el botón? Copia este enlace:<br>${escapeHtmlReset(customLink)}</p>
  </div>
</div>`.trim();

    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: fromEmail,
        to: userEmail,
        subject: 'Verifica tu email — Quick Emigrate',
        html,
      });
    } catch (err) {
      console.error('[verify-email/resend] Error enviando email:', err);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[verify-email/resend] Error:', err);
    res.json({ success: true });
  }
});

// Reset password — genera link via Admin SDK, envía email propio (Resend) con URL propia.
// Bypassa el handler default de Firebase (*.firebaseapp.com) para evitar prefetch de scanners.
// Respuesta siempre genérica: no revela existencia de cuenta.
router.post('/reset-password', resetPasswordLimiter, async (req: Request, res: Response) => {
  const genericOk = () => res.json({
    success: true,
    message: 'Si esa cuenta existe, te enviamos un enlace para restablecer tu contraseña.',
  });

  try {
    const email = (req.body?.email || '').toString().trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Email no válido' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Quick Emigrate <hola@quickemigrate.com>';
    const baseUrl = process.env.FRONTEND_URL || 'https://quickemigrate.com';

    if (!apiKey) {
      console.error('[reset-password] RESEND_API_KEY no configurada');
      return genericOk();
    }

    const { getAuth } = await import('firebase-admin/auth');
    let firebaseLink: string;
    try {
      // Sin actionCodeSettings: evita "Domain not allowlisted" si el dominio
      // del front no está en Authorized domains. El continueUrl no se usa —
      // reescribimos la URL completa abajo apuntando a /cliente/auth-action.
      firebaseLink = await getAuth().generatePasswordResetLink(email);
    } catch (err: any) {
      // auth/user-not-found → respuesta genérica (no enumeration)
      const code = err?.code || err?.errorInfo?.code || '';
      if (code === 'auth/user-not-found') {
        return genericOk();
      }
      console.error('[reset-password] Error generando link Firebase:', err);
      return genericOk();
    }

    // Reescribir link → URL propia, conservando oobCode/apiKey/mode
    let customLink = firebaseLink;
    try {
      const u = new URL(firebaseLink);
      const oobCode = u.searchParams.get('oobCode') || '';
      const fbApiKey = u.searchParams.get('apiKey') || '';
      const lang = u.searchParams.get('lang') || 'es';
      customLink = `${baseUrl}/cliente/auth-action?mode=resetPassword&oobCode=${encodeURIComponent(oobCode)}&apiKey=${encodeURIComponent(fbApiKey)}&lang=${encodeURIComponent(lang)}`;
    } catch {
      // si falla parse, dejar link original (peor caso → handler default)
    }

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f4f5; padding: 32px 16px;">
  <div style="background: #1A1C1C; border-radius: 16px; padding: 28px;">
    <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Quick Emigrate</p>
    <h1 style="color: #fff; font-size: 22px; margin: 0;">Restablece tu contraseña</h1>
  </div>
  <div style="background: #fff; border-radius: 16px; padding: 28px; margin-top: 16px; color: #374151; line-height: 1.65; font-size: 14.5px;">
    <p>Recibimos una solicitud para restablecer la contraseña de <strong>${escapeHtmlReset(email)}</strong>.</p>
    <p>Pulsa el botón para crear una nueva contraseña. El enlace caduca en 1 hora.</p>
    <div style="text-align: center; margin: 24px 0 8px;">
      <a href="${customLink}" style="display: inline-block; background: #25D366; color: #062810; font-weight: 700; padding: 12px 22px; border-radius: 999px; text-decoration: none; font-size: 14px;">Cambiar contraseña</a>
    </div>
    <p style="color: #6B7280; font-size: 12.5px; margin-top: 20px;">Si no fuiste tú, puedes ignorar este email — tu contraseña actual seguirá funcionando.</p>
    <p style="color: #6B7280; font-size: 11.5px; word-break: break-all; margin-top: 16px;">¿No funciona el botón? Copia este enlace en tu navegador:<br>${escapeHtmlReset(customLink)}</p>
  </div>
</div>`.trim();

    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Restablece tu contraseña — Quick Emigrate',
        html,
      });
    } catch (err) {
      console.error('[reset-password] Error enviando email Resend:', err);
    }

    return genericOk();
  } catch (err) {
    console.error('[reset-password] Error inesperado:', err);
    res.json({
      success: true,
      message: 'Si esa cuenta existe, te enviamos un enlace para restablecer tu contraseña.',
    });
  }
});

// Avatar: cliente sube foto comprimida en base64 (data URL JPEG/PNG/WebP).
// Max 200KB para evitar bloat en Firestore. Cliente debe comprimir antes.
const AVATAR_MAX_BYTES = 200 * 1024;
router.put('/avatar', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const { dataUrl } = req.body || {};

    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return res.status(400).json({ success: false, error: 'dataUrl inválido' });
    }
    const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) {
      return res.status(400).json({ success: false, error: 'Formato no permitido. Usa JPG, PNG o WebP.' });
    }
    const approxBytes = Math.floor((m[2].length * 3) / 4);
    if (approxBytes > AVATAR_MAX_BYTES) {
      return res.status(400).json({ success: false, error: 'Imagen demasiado grande tras compresión.' });
    }

    await db.collection('usuarios').doc(userEmail).update({
      photoURL: dataUrl,
      actualizadoEn: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error al guardar avatar:', err);
    res.status(500).json({ success: false, error: 'Error al guardar avatar' });
  }
});

router.delete('/avatar', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const { FieldValue } = await import('firebase-admin/firestore');
    await db.collection('usuarios').doc(userEmail).update({
      photoURL: FieldValue.delete(),
      actualizadoEn: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error al borrar avatar:', err);
    res.status(500).json({ success: false, error: 'Error al borrar avatar' });
  }
});

// Admin: create user manually
router.post('/', verifyToken, async (req: Request, res: Response) => {
  try {
    const { email, nombre, plan, password } = req.body;

    if (!email || !nombre || !plan || !password) {
      return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener mínimo 6 caracteres' });
    }

    const { getAuth } = await import('firebase-admin/auth');
    const adminAuth = getAuth();

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: nombre,
    });

    await db.collection('usuarios').doc(email).set({
      uid: userRecord.uid,
      email,
      nombre,
      plan,
      mensajesUsados: 0,
      consentimientoDiagnostico: false,
      diagnosticoId: null,
      perfilCompleto: false,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    });

    res.json({ success: true, id: email });
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ success: false, error: 'El email ya está registrado' });
    }
    res.status(500).json({ success: false, error: 'Error al crear usuario' });
  }
});

// Client: save onboarding profile
router.put('/perfil', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;
    const {
      nombre, pais, edad, sector,
      estudios, experiencia, situacion, medios,
      objetivo, plazo, familiaresEnEspana,
      otrosIdiomas, cualesIdiomas,
      respuestas,
    } = req.body;

    await db.collection('usuarios').doc(userEmail).update({
      nombre,
      perfil: {
        pais, edad, sector,
        estudios, experiencia, situacion, medios,
        objetivo, plazo, familiaresEnEspana,
        otrosIdiomas, cualesIdiomas,
        ...(respuestas ? { respuestas } : {}),
      },
      perfilCompleto: true,
      actualizadoEn: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al guardar perfil:', error);
    res.status(500).json({ success: false, error: 'Error al guardar perfil' });
  }
});

async function deleteSubcollection(docPath: string, sub: string) {
  const ref = db.doc(docPath).collection(sub);
  let totalDeleted = 0;
  while (true) {
    const snap = await ref.limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    totalDeleted += snap.size;
    if (snap.size < 400) break;
  }
  return totalDeleted;
}

// Public: opt-out recordatorios via token de un diagnóstico (link en email)
router.get('/recordatorios/optout/:diagnosticoId', async (req: Request, res: Response) => {
  try {
    const { diagnosticoId } = req.params;
    const docRef = db.collection('diagnosticos').doc(diagnosticoId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).send('Diagnóstico no encontrado.');
    }
    await docRef.update({ recordatoriosOptOut: true });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<html><body style="font-family:Arial;background:#0A0A0A;color:#fff;padding:48px;text-align:center;">
      <h1>Listo</h1>
      <p>No volverás a recibir recordatorios sobre este diagnóstico.</p>
      <p><a href="https://quickemigrate.com" style="color:#25D366;">Volver a Quick Emigrate</a></p>
    </body></html>`);
  } catch {
    res.status(500).send('Error procesando solicitud.');
  }
});

// Client: skip onboarding (perfil incompleto pero acceso permitido)
router.post('/saltar-onboarding', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    await db.collection('usuarios').doc(userEmail).set({
      onboardingSkipped: true,
      onboardingSkippedAt: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    }, { merge: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Error saltando onboarding:', error);
    res.status(500).json({ success: false, error: 'Error al saltar onboarding' });
  }
});

// Admin: delete user from Firestore + Firebase Auth + cascade subcolecciones (RGPD)
router.delete('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // id = email (doc key)
    const docRef = db.collection('usuarios').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({ success: true });
    }

    const userPath = `usuarios/${id}`;
    const [chatDeleted, docsDeleted] = await Promise.all([
      deleteSubcollection(userPath, 'chat'),
      deleteSubcollection(userPath, 'documentos'),
    ]);

    // Diagnosticos asociados (no es subcolección)
    const diagSnap = await db.collection('diagnosticos').where('email', '==', id).limit(500).get();
    if (!diagSnap.empty) {
      const batch = db.batch();
      diagSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    const uid = doc.data()?.uid;
    if (uid) {
      try {
        const { getAuth } = await import('firebase-admin/auth');
        await getAuth().deleteUser(uid);
      } catch (authErr: any) {
        if (authErr.code !== 'auth/user-not-found') throw authErr;
      }
    }

    await docRef.delete();

    res.json({
      success: true,
      eliminados: { chat: chatDeleted, documentos: docsDeleted, diagnosticos: diagSnap.size },
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar usuario' });
  }
});

// Client: export own data (RGPD portabilidad)
router.get('/exportar', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const userDoc = await db.collection('usuarios').doc(userEmail).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    const [chatSnap, docsSnap, diagSnap] = await Promise.all([
      db.collection('usuarios').doc(userEmail).collection('chat').limit(1000).get(),
      db.collection('usuarios').doc(userEmail).collection('documentos').limit(100).get(),
      db.collection('diagnosticos').where('email', '==', userEmail).limit(50).get(),
    ]);

    const exportData = {
      perfil: userDoc.data(),
      chat: chatSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      documentos: docsSnap.docs.map(d => {
        const data = d.data();
        return { id: d.id, nombre: data.nombre, etiqueta: data.etiqueta, tipo: data.tipo, tamaño: data.tamaño, creadoEn: data.creadoEn };
      }),
      diagnosticos: diagSnap.docs.map(d => {
        const data = d.data();
        const { pdfBase64, ...rest } = data;
        return { id: d.id, ...rest };
      }),
      exportadoEn: new Date().toISOString(),
    };

    res.setHeader('Content-Disposition', `attachment; filename="quickemigrate-export-${userEmail}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('Error exportando datos:', error);
    res.status(500).json({ success: false, error: 'Error al exportar datos' });
  }
});

// Client: request account deletion (RGPD derecho de supresión)
router.delete('/me', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const docRef = db.collection('usuarios').doc(userEmail);
    const doc = await docRef.get();

    if (!doc.exists) return res.json({ success: true });

    const userPath = `usuarios/${userEmail}`;
    await Promise.all([
      deleteSubcollection(userPath, 'chat'),
      deleteSubcollection(userPath, 'documentos'),
    ]);

    const diagSnap = await db.collection('diagnosticos').where('email', '==', userEmail).limit(500).get();
    if (!diagSnap.empty) {
      const batch = db.batch();
      diagSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    const uid = doc.data()?.uid;
    if (uid) {
      try {
        const { getAuth } = await import('firebase-admin/auth');
        await getAuth().deleteUser(uid);
      } catch (authErr: any) {
        if (authErr.code !== 'auth/user-not-found') throw authErr;
      }
    }

    await docRef.delete();

    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando cuenta propia:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar cuenta' });
  }
});

// Admin: update plan
router.patch('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!['free', 'starter', 'pro', 'premium'].includes(plan)) {
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
