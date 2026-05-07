import { Router, Request, Response } from 'express';
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
