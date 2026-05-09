import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase';

// Verifies a valid Firebase token without restricting to admin emails.
export const verifyClientToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await auth.verifyIdToken(token);
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Bloquea acciones críticas (chat, suscripción) si el email no está verificado.
// Usar DESPUÉS de verifyClientToken — depende de req.user.
export const requireEmailVerified = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  // Google sign-in marca email_verified=true automáticamente.
  // Email/password requiere clic en el link de verificación.
  if (!user?.email_verified && user?.firebase?.sign_in_provider !== 'google.com') {
    return res.status(403).json({
      success: false,
      error: 'Verifica tu email para continuar.',
      code: 'email_not_verified',
    });
  }
  next();
};
