import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import { db } from '../firebase';

const router = Router();

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
          plan: 'starter',
          mensajesUsados: 0,
          consentimientoDiagnostico: false,
          diagnosticoId: null,
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

router.patch('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!['starter', 'pro', 'premium'].includes(plan)) {
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
