// PAUSADO — Pinecone/VoyageAI desactivado. Mantener para reactivar vector search.
import { VoyageAIClient } from 'voyageai';

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY! });

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await voyage.embed({
    model: 'voyage-3',
    input: text,
    inputType: 'document',
  });
  return (response.data?.[0]?.embedding as number[]) ?? [];
}

export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const response = await voyage.embed({
    model: 'voyage-3',
    input: text,
    inputType: 'query',
  });
  return (response.data?.[0]?.embedding as number[]) ?? [];
}
