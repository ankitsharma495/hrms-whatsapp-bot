import { Chunk } from './chunking';
import { generateEmbedding, cosineSimilarity } from './embeddings';

interface StoredChunk {
  chunk: Chunk;
  embedding: number[];
}

const store: StoredChunk[] = [];

export async function addToStore(chunk: Chunk): Promise<void> {
  const embedding = await generateEmbedding(chunk.content);
  store.push({ chunk, embedding });
}

export async function searchStore(query: string, topK: number = 3): Promise<Chunk[]> {
  if (store.length === 0) return [];

  const queryEmbedding = await generateEmbedding(query);

  const scored = store.map((item) => ({
    chunk: item.chunk,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map((s) => s.chunk);
}

export function getStoreSize(): number {
  return store.length;
}
