import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as pdfParseModule from 'pdf-parse';
const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
import { verifyClientToken } from '../middleware/clientAuth';
import { db } from '../firebase';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const MAX_DOCS_PRO = 5;
const MAX_DOCS_PREMIUM = 10;
const MAX_TEXT_CHARS = 50_000;

async function extraerTexto(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    try {
      const data = await pdfParse(buffer);
      return data.text.substring(0, MAX_TEXT_CHARS);
    } catch {
      return '';
    }
  }
  if (mimetype === 'text/plain') {
    return buffer.toString('utf-8').substring(0, MAX_TEXT_CHARS);
  }
  return '';
}

router.get('/', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    const snap = await db.collection('usuarios').doc(userEmail)
      .collection('documentos')
      .orderBy('creadoEn', 'desc')
      .get();

    const docs = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        nombre: data.nombre,
        etiqueta: data.etiqueta || '',
        tipo: data.tipo,
        tamaño: data.tamaño,
        tieneTexto: !!data.textoExtraido,
        creadoEn: data.creadoEn,
      };
    });

    res.json({ success: true, data: docs });
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener documentos' });
  }
});

router.post('/', verifyClientToken, upload.single('archivo'), async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;

    const userDoc = await db.collection('usuarios').doc(userEmail).get();
    if (!userDoc.exists) return res.status(403).json({ success: false, error: 'Usuario no encontrado' });

    const plan = userDoc.data()!.plan;
    if (!['pro', 'premium'].includes(plan)) {
      return res.status(403).json({ success: false, error: 'Función disponible en planes Pro y Premium' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Archivo requerido (PDF o TXT, máx. 5MB)' });
    }

    const maxDocs = plan === 'premium' ? MAX_DOCS_PREMIUM : MAX_DOCS_PRO;
    const snap = await db.collection('usuarios').doc(userEmail).collection('documentos').get();
    if (snap.size >= maxDocs) {
      return res.status(400).json({
        success: false,
        error: `Límite alcanzado. Tu plan ${plan === 'pro' ? 'Pro' : 'Premium'} permite ${maxDocs} documentos.`,
      });
    }

    const etiqueta = (req.body.etiqueta || '').trim().substring(0, 100);
    const texto = await extraerTexto(req.file.buffer, req.file.mimetype);

    const docRef = await db.collection('usuarios').doc(userEmail).collection('documentos').add({
      nombre: req.file.originalname,
      etiqueta,
      tipo: req.file.mimetype,
      tamaño: req.file.size,
      textoExtraido: texto,
      creadoEn: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: {
        id: docRef.id,
        nombre: req.file.originalname,
        etiqueta,
        tipo: req.file.mimetype,
        tamaño: req.file.size,
        tieneTexto: !!texto,
        creadoEn: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'El archivo supera el límite de 5MB' });
    }
    console.error('Error subiendo documento:', err);
    res.status(500).json({ success: false, error: 'Error al subir documento' });
  }
});

router.delete('/:id', verifyClientToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email as string;
    await db.collection('usuarios').doc(userEmail)
      .collection('documentos').doc(req.params.id).delete();
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Error al eliminar documento' });
  }
});

export default router;
