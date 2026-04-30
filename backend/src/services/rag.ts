import { dbKnowledge } from '../config/firebaseKnowledge';

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

export async function ingestarDocumento(doc: DocumentoLegal): Promise<string> {
  if (!dbKnowledge) throw new Error('dbKnowledge not initialized');
  const docRef = await dbKnowledge.collection('documents').add({ ...doc });
  return docRef.id;
}

export async function buscarDocumentosRelevantes(
  _query: string,
  filtros?: { pais?: string; categoria?: string },
  topK: number = 5
): Promise<{ id: string; score: number; metadata: any }[]> {
  if (!dbKnowledge) return [];
  try {
    let q = dbKnowledge.collection('document_chunks').limit(topK) as FirebaseFirestore.Query;
    if (filtros?.categoria) q = q.where('categoria', '==', filtros.categoria);
    if (filtros?.pais) q = q.where('pais', '==', filtros.pais);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, score: 1.0, metadata: d.data() }));
  } catch {
    return [];
  }
}

const OBJETIVO_TAG_MAP: Record<string, string> = {
  estudios: 'estudiante',
  trabajo: 'trabajo',
  residencia: 'no_lucrativa',
  arraigo: 'arraigo',
};

async function obtenerContextoRAG(pais: string, objetivo: string): Promise<string> {
  if (!dbKnowledge) return '';

  const secciones: string[] = [];
  let routeId: string | null = null;
  let routeName: string | null = null;
  const tag = OBJETIVO_TAG_MAP[objetivo.toLowerCase()] ?? objetivo.toLowerCase();

  // Capa 1 — Ruta migratoria recomendada
  try {
    const snap = await dbKnowledge
      .collection('migration_routes')
      .where('active', '==', true)
      .where('tags', 'array-contains', tag)
      .orderBy('mvp_priority', 'asc')
      .limit(1)
      .get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      routeId = doc.id;
      const d = doc.data();
      routeName = d.name;
      secciones.push(
        `## Ruta Migratoria Recomendada\n\n` +
        `**${d.name}**\n${d.description ?? ''}\n\n` +
        `- **Quién puede aplicar:** ${d.who_can_apply ?? '-'}\n` +
        `- **Duración inicial:** ${d.initial_duration ?? '-'}\n` +
        `- **Permite trabajar:** ${d.allows_work ?? '-'}\n` +
        `- **Opciones de transición:** ${d.transition_options ?? '-'}\n` +
        `- **Cambios RD 1155/2024:** ${d.rd_1155_2024_changes ?? '-'}\n` +
        `- **Tasa de éxito estimada:** ${d.estimated_success_rate_label ?? '-'}`
      );
    }
  } catch { /* omitir */ }

  if (!routeId) return secciones.join('\n\n---\n\n');

  // Capa 2 — Requisitos de la ruta
  try {
    const snap = await dbKnowledge
      .collection('route_requirements')
      .where('route_id', '==', routeId)
      .where('mandatory', '==', true)
      .limit(5)
      .get();
    if (!snap.empty) {
      const items = snap.docs.map(d => {
        const r = d.data();
        return `- **[${r.category}] ${r.requirement}:** ${r.description ?? ''}${r.blocking_if_missing ? ' *(bloqueante)*' : ''}`;
      }).join('\n');
      secciones.push(`## Requisitos de la Ruta\n\n${items}`);
    }
  } catch { /* omitir */ }

  // Capa 3 — Documentos necesarios
  try {
    const snap = await dbKnowledge
      .collection('route_documents')
      .where('route_id', '==', routeId)
      .where('mandatory_level', '==', 'obligatorio')
      .limit(5)
      .get();
    if (!snap.empty) {
      const items = snap.docs.map(d => {
        const r = d.data();
        const flags = [
          r.requires_apostille ? 'apostilla' : '',
          r.requires_translation ? 'traducción oficial' : '',
        ].filter(Boolean).join(', ');
        return (
          `- **${r.name}:** ${r.description ?? ''}\n` +
          `  - Dónde obtener: ${r.where_obtained ?? '-'}` +
          (flags ? `\n  - Requisitos: ${flags}` : '') +
          (r.common_errors ? `\n  - Errores comunes: ${r.common_errors}` : '')
        );
      }).join('\n');
      secciones.push(`## Documentos Necesarios\n\n${items}`);
    }
  } catch { /* omitir */ }

  // Capa 4 — Costes estimados
  try {
    const snap = await dbKnowledge
      .collection('route_costs')
      .where('route_id', '==', routeId)
      .limit(5)
      .get();
    if (!snap.empty) {
      const items = snap.docs.map(d => {
        const r = d.data();
        return `- **${r.concept}:** ${r.min_eur}€ – ${r.max_eur}€ (${r.mandatory_or_optional ?? '-'})${r.notes ? ` — ${r.notes}` : ''}`;
      }).join('\n');
      secciones.push(`## Costes Estimados\n\n${items}`);
    }
  } catch { /* omitir */ }

  // Capa 5 — Riesgos relevantes (severity filtrado in-memory por límite Firestore)
  try {
    const snap = await dbKnowledge
      .collection('risk_catalog')
      .where('affected_routes', 'array-contains', routeId)
      .limit(10)
      .get();
    const relevant = snap.docs
      .filter(d => ['alta', 'crítica'].includes(d.data().severity))
      .slice(0, 3);
    if (relevant.length > 0) {
      const items = relevant.map(d => {
        const r = d.data();
        return `- **${r.name}** (${r.severity}): ${r.description ?? ''}\n  - Mitigación: ${r.mitigation ?? '-'}`;
      }).join('\n');
      secciones.push(`## Riesgos Relevantes\n\n${items}`);
    }
  } catch { /* omitir */ }

  // Capa 6 — Datos del consulado
  try {
    const snap = await dbKnowledge
      .collection('consulates')
      .where('origin_country', '==', pais)
      .limit(1)
      .get();
    if (!snap.empty) {
      const r = snap.docs[0].data();
      secciones.push(
        `## Datos del Consulado\n\n` +
        `- **Consulados principales:** ${r.main_consulates ?? '-'}\n` +
        `- **Tasas consulares aprox.:** ${r.approx_consular_fees ?? '-'}\n` +
        `- **Proveedor externo:** ${r.external_provider ?? '-'}\n` +
        `- **Autoridad antecedentes penales:** ${r.criminal_records_authority ?? '-'}`
      );
    }
  } catch { /* omitir */ }

  // Capa 7 — Casos de entrenamiento similares
  try {
    let q = dbKnowledge
      .collection('training_cases')
      .where('output_visa_recomendada', '==', routeName) as FirebaseFirestore.Query;
    if (pais) q = q.where('input_nacionalidad', '==', pais);
    const snap = await q.limit(2).get();
    if (!snap.empty) {
      const items = snap.docs.map(d => {
        const r = d.data();
        const blockers = Array.isArray(r.output_blockers_principales)
          ? r.output_blockers_principales.join(', ')
          : (r.output_blockers_principales ?? '-');
        return (
          `- Viabilidad: ${r.output_score_viabilidad ?? '-'} | Coste estimado: ${r.output_coste_estimado_total_eur ?? '-'}€\n` +
          `  - Blockers: ${blockers}\n` +
          `  - Razonamiento: ${r.razonamiento ?? '-'}`
        );
      }).join('\n');
      secciones.push(`## Casos Similares\n\n${items}`);
    }
  } catch { /* omitir */ }

  return secciones.join('\n\n---\n\n');
}

export async function obtenerContextoLegal(
  pais: string,
  objetivo: string
): Promise<string> {
  return obtenerContextoRAG(pais, objetivo).catch(() => '');
}
