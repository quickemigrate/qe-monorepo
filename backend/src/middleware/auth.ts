import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase';

const ALLOWED_EMAILS = [
  process.env.ADMIN_EMAIL_1 || '',
  process.env.ADMIN_EMAIL_2 || ''
];

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await auth.verifyIdToken(token);
    if (!ALLOWED_EMAILS.includes(decoded.email || '')) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
