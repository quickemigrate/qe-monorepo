import { index } from '../config/pinecone';
import { generateEmbedding, generateQueryEmbedding } from './embeddings';
import { db } from '../firebase';

export interface DocumentoLegal {
  id?: string;
  titulo: string;
  contenido: string;
  fuente: 'BOE' | 'manual';
  categoria: string;
  pais: string;
  url?: string;
  fechaPublicacion?: string;
  fechaIngesta: string;
}

export async function ingestarDocumento(doc: DocumentoLegal): Promise<string> {
  const docRef = await db.collection('conocimiento').add({
    ...doc,
    fechaIngesta: new Date().toISOString(),
  });

  const texto = `${doc.titulo}\n\n${doc.contenido}`;
  const embedding = await generateEmbedding(texto);

  await index.upsert({
    records: [{
      id: docRef.id,
      values: embedding,
      metadata: {
        titulo: doc.titulo,
        fuente: doc.fuente,
        categoria: doc.categoria,
        pais: doc.pais,
        url: doc.url || '',
        fechaPublicacion: doc.fechaPublicacion || '',
      },
    }],
  });

  return docRef.id;
}

export async function buscarDocumentosRelevantes(
  query: string,
  filtros?: { pais?: string; categoria?: string },
  topK: number = 5
): Promise<{ id: string; score: number; metadata: any }[]> {
  const embedding = await generateQueryEmbedding(query);

  const filter: Record<string, string> = {};
  if (filtros?.pais) filter.pais = filtros.pais;
  if (filtros?.categoria) filter.categoria = filtros.categoria;

  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  });

  return results.matches?.map(m => ({
    id: m.id,
    score: m.score || 0,
    metadata: m.metadata,
  })) || [];
}

export async function obtenerContextoLegal(
  pais: string,
  objetivo: string
): Promise<string> {
  const query = `legislación española emigrar ${pais} ${objetivo} visado permiso residencia`;

  const resultados = await buscarDocumentosRelevantes(query, { pais }, 5);

  if (resultados.length === 0) return '';

  const docs = await Promise.all(
    resultados.map(r => db.collection('conocimiento').doc(r.id).get())
  );

  return docs
    .filter(d => d.exists)
    .map(d => {
      const data = d.data()!;
      return `### ${data.titulo}\nFuente: ${data.fuente} | Fecha: ${data.fechaPublicacion || 'N/A'}\n\n${data.contenido}`;
    })
    .join('\n\n---\n\n');
}
