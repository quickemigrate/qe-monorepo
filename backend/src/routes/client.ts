import { Router, Request, Response } from 'express';
import { db, auth } from '../firebase';

const router = Router();

router.get('/expediente', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await auth.verifyIdToken(token);
    const email = decoded.email || '';

    const snapshot = await db.collection('expedientes')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ expediente: null });
    }

    const doc = snapshot.docs[0];
    res.json({
      expediente: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Error obteniendo expediente del cliente:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
