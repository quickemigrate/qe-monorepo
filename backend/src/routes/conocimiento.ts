import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import { ingestarDocumento, buscarDocumentosRelevantes } from '../services/rag';
import { generateEmbedding } from '../services/embeddings';
import { db } from '../firebase';
import { index } from '../config/pinecone';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', verifyToken, async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('conocimiento')
      .orderBy('fechaIngesta', 'desc')
      .limit(50)
      .get();

    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: docs });
  } catch {
    res.status(500).json({ success: false, error: 'Error al listar documentos' });
  }
});

router.post('/', verifyToken, async (req: Request, res: Response) => {
  try {
    const { titulo, contenido, categoria, pais, url, fechaPublicacion } = req.body;

    if (!titulo || !contenido || !categoria || !pais) {
      return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }

    const id = await ingestarDocumento({
      titulo,
      contenido,
      fuente: 'ine_statistics' ,
      categoria,
      pais,
      url,
      fechaPublicacion,
      fechaIngesta: new Date().toISOString(),
    });

    res.json({ success: true, id });
  } catch {
    res.status(500).json({ success: false, error: 'Error al ingestar documento' });
  }
});

router.delete('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.collection('conocimiento').doc(id).delete();
    await index.deleteOne({ id });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Error al eliminar documento' });
  }
});

router.get('/search', verifyToken, async (req: Request, res: Response) => {
  try {
    const { q, pais, categoria } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Falta parámetro q' });
    }

    const resultados = await buscarDocumentosRelevantes(
      q as string,
      {
        pais: pais as string | undefined,
        categoria: categoria as string | undefined,
      }
    );
    res.json({ success: true, data: resultados });
  } catch {
    res.status(500).json({ success: false, error: 'Error en búsqueda' });
  }
});

router.post('/sincronizar-pinecone', verifyToken, async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('conocimiento').get();
    let sincronizados = 0;
    let errores = 0;

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        const texto = `${data.titulo}\n\n${data.contenido}`;
        const embedding = await generateEmbedding(texto);

        await index.upsert({
          records: [{
            id: doc.id,
            values: embedding,
            metadata: {
              titulo: data.titulo,
              fuente: data.fuente || 'manual',
              categoria: data.categoria || 'general',
              pais: data.pais || 'general',
              url: data.url || '',
              fechaPublicacion: data.fechaPublicacion || '',
            },
          }],
        });

        sincronizados++;
      } catch (e) {
        console.error(`Error sincronizando ${doc.id}:`, e);
        errores++;
      }
    }

    res.json({ success: true, sincronizados, errores });
  } catch {
    res.status(500).json({ success: false, error: 'Error en sincronización' });
  }
});

export { upload };
export default router;
