import { db } from '../firebase';
import { Timestamp } from 'firebase-admin/firestore';

export interface DocumentoLegal {
  id?: string;
  titulo: string;
  contenido: string;
  fuente: 'BOE' | 'manual' | 'ine_statistics' | string;
  categoria: string;
  pais: string;
  url?: string;
  fechaPublicacion?: string;
  fechaIngesta: string;
}

// Pinecone pausado — guarda solo en Firestore
export async function ingestarDocumento(doc: DocumentoLegal): Promise<string> {
  const docRef = await db.collection('conocimiento').add({
    ...doc,
    fechaIngesta: Timestamp.now(),
  });
  return docRef.id;
}

// Sin vector search — query básica por categoria/pais
export async function buscarDocumentosRelevantes(
  _query: string,
  filtros?: { pais?: string; categoria?: string },
  topK: number = 5
): Promise<{ id: string; score: number; metadata: any }[]> {
  try {
    let q = db.collection('conocimiento').limit(topK) as FirebaseFirestore.Query;
    if (filtros?.categoria) q = q.where('categoria', '==', filtros.categoria);
    if (filtros?.pais) q = q.where('pais', '==', filtros.pais);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, score: 1.0, metadata: d.data() }));
  } catch {
    return [];
  }
}

export async function obtenerContextoRAG(params: {
  paisOrigen: string;
  objetivo: string;
  presupuesto?: number;
  edad?: number;
}): Promise<string> {
  const { paisOrigen, objetivo } = params;
  const secciones: string[] = [];

  try {
    // Capa 1 — Requisitos legales
    const reqSnap = await db.collection('requisitos_legales')
      .where('categoria', '==', objetivo)
      .where('activo', '==', true)
      .orderBy('fechaActualizacion', 'desc')
      .limit(3)
      .get();
    if (!reqSnap.empty) {
      const textos = reqSnap.docs.map(d => {
        const data = d.data();
        return `**${data.titulo}**\n${data.contenido}`;
      }).join('\n\n');
      secciones.push(`## Requisitos Legales\n\n${textos}`);
    }
  } catch { /* omitir si falla */ }

  try {
    // Capa 2 — Rutas migratorias
    const rutasSnap = await db.collection('rutas_migratorias')
      .where('subcategoria', '==', objetivo)
      .where('activo', '==', true)
      .limit(2)
      .get();
    if (!rutasSnap.empty) {
      const textos = rutasSnap.docs.map(d => {
        const data = d.data();
        return `**${data.titulo}**\n${data.contenido}`;
      }).join('\n\n');
      secciones.push(`## Rutas Migratorias\n\n${textos}`);
    }
  } catch { /* omitir */ }

  try {
    // Capa 3 — Normativa
    const normativaSnap = await db.collection('base_conocimiento')
      .where('categoria', '==', 'normativa')
      .where('activo', '==', true)
      .orderBy('fechaActualizacion', 'desc')
      .limit(2)
      .get();
    if (!normativaSnap.empty) {
      const textos = normativaSnap.docs.map(d => {
        const data = d.data();
        return `**${data.titulo}**\n${data.contenido}`;
      }).join('\n\n');
      secciones.push(`## Normativa Vigente\n\n${textos}`);
    }
  } catch { /* omitir */ }

  try {
    // Capa 4 — Casos reales (preferir mismo país origen)
    let casosSnap = await db.collection('casos_reales')
      .where('ruta_migratoria', '==', objetivo)
      .where('pais_origen', '==', paisOrigen)
      .where('activo', '==', true)
      .limit(2)
      .get();
    if (casosSnap.empty) {
      casosSnap = await db.collection('casos_reales')
        .where('ruta_migratoria', '==', objetivo)
        .where('activo', '==', true)
        .limit(2)
        .get();
    }
    if (!casosSnap.empty) {
      const textos = casosSnap.docs.map(d => {
        const data = d.data();
        return `**${data.titulo}** (${data.resultado})\n${data.contenido}`;
      }).join('\n\n');
      secciones.push(`## Casos Reales\n\n${textos}`);
    }
  } catch { /* omitir */ }

  try {
    // Capa 5 — Datos económicos
    const econSnap = await db.collection('base_conocimiento')
      .where('categoria', '==', 'datos_economicos')
      .where('activo', '==', true)
      .limit(2)
      .get();
    if (!econSnap.empty) {
      const textos = econSnap.docs.map(d => {
        const data = d.data();
        return `**${data.titulo}**\n${data.contenido}`;
      }).join('\n\n');
      secciones.push(`## Datos Económicos de Referencia\n\n${textos}`);
    }
  } catch { /* omitir */ }

  return secciones.join('\n\n---\n\n');
}

// Mantener firma para diagnostico.ts y chat.ts
export async function obtenerContextoLegal(
  pais: string,
  objetivo: string
): Promise<string> {
  return obtenerContextoRAG({ paisOrigen: pais, objetivo }).catch(() => '');
}
