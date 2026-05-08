import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as pdfParseModule from 'pdf-parse';
const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
import Anthropic from '@anthropic-ai/sdk';
import { verifyClientToken } from '../middleware/clientAuth';
import { db } from '../firebase';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const router = Router();

const ALLOWED_MIMES = [
  'application/pdf',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_MIMES.includes(file.mimetype));
  },
});

// Magic byte signatures
function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
}

function isJpegBuffer(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isPngBuffer(buf: Buffer): boolean {
  return buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a;
}

function isWebpBuffer(buf: Buffer): boolean {
  // RIFF....WEBP
  return buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
}

// Detect HEIC for friendly error message
function isHeicBuffer(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const ftyp = buf.subarray(4, 8).toString('ascii');
  if (ftyp !== 'ftyp') return false;
  const brand = buf.subarray(8, 12).toString('ascii');
  return ['heic', 'heix', 'hevc', 'heim', 'heis', 'heif', 'mif1'].includes(brand);
}

function isTxtBuffer(buf: Buffer): boolean {
  const sample = buf.subarray(0, Math.min(buf.length, 1024));
  if (sample.includes(0)) return false;
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(sample);
    return decoded.length > 0 || buf.length === 0;
  } catch {
    return false;
  }
}

function validarContenido(buf: Buffer, mimetype: string): string | null {
  if (mimetype === 'application/pdf') {
    if (!isPdfBuffer(buf)) return 'El archivo no es un PDF válido.';
    return null;
  }
  if (mimetype === 'text/plain') {
    if (!isTxtBuffer(buf)) return 'El archivo no es un TXT válido (encoding no permitido).';
    return null;
  }
  if (mimetype === 'image/jpeg') {
    if (!isJpegBuffer(buf)) return 'El archivo no es un JPG válido.';
    return null;
  }
  if (mimetype === 'image/png') {
    if (!isPngBuffer(buf)) return 'El archivo no es un PNG válido.';
    return null;
  }
  if (mimetype === 'image/webp') {
    if (!isWebpBuffer(buf)) return 'El archivo no es un WebP válido.';
    return null;
  }
  if (isHeicBuffer(buf)) {
    return 'Las fotos HEIC del iPhone no se soportan. En tu móvil ve a Ajustes → Cámara → Formatos → "Más compatible" para que las fotos se guarden como JPG.';
  }
  return 'Formato no soportado.';
}

const MAX_DOCS_PRO = 5;
const MAX_DOCS_PREMIUM = 10;
const MAX_TEXT_CHARS = 50_000;

async function extraerTextoImagen(buffer: Buffer, mediaType: 'image/jpeg' | 'image/png' | 'image/webp'): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: buffer.toString('base64'),
            },
          } as any,
          {
            type: 'text',
            text: 'Transcribe todo el texto visible en esta imagen exactamente como aparece. Si hay datos clave (número de pasaporte, fechas, nombres, importes), inclúyelos. Solo el texto, sin comentarios ni explicaciones adicionales. Si la imagen no contiene texto legible, responde "(sin texto)".',
          },
        ],
      }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    if (text.trim() === '(sin texto)') return '';
    return text.substring(0, MAX_TEXT_CHARS);
  } catch (err) {
    console.error('Error OCR imagen:', err);
    return '';
  }
}

async function extraerTexto(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    // Try native text extraction first (fast, free)
    try {
      const data = await pdfParse(buffer);
      const text = data.text.trim();
      if (text.length > 50) return text.substring(0, MAX_TEXT_CHARS);
    } catch {
      // fall through to OCR
    }

    // Scanned PDF — use Claude vision for OCR
    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: buffer.toString('base64'),
              },
            } as any,
            {
              type: 'text',
              text: 'Transcribe todo el texto de este documento exactamente como aparece. Solo el texto, sin comentarios ni explicaciones adicionales.',
            },
          ],
        }],
      });
      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      return text.substring(0, MAX_TEXT_CHARS);
    } catch {
      return '';
    }
  }
  if (mimetype === 'text/plain') {
    return buffer.toString('utf-8').substring(0, MAX_TEXT_CHARS);
  }
  if (mimetype === 'image/jpeg' || mimetype === 'image/png' || mimetype === 'image/webp') {
    return extraerTextoImagen(buffer, mimetype);
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

    const validationError = validarContenido(req.file.buffer, req.file.mimetype);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
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
