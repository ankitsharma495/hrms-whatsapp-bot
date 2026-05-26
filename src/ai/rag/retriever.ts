import { semanticSearch, SearchResult } from './vector.store';
import { Chunk } from './chunking';

/**
 * Retrieves relevant document chunks for a query with similarity scores.
 */
export async function retrieve(query: string, topK: number = 3): Promise<SearchResult[]> {
  return semanticSearch(query, topK);
}

/**
 * Retrieves just the chunk content/metadata (without scores).
 */
export async function retrieveChunks(query: string, topK: number = 3): Promise<Chunk[]> {
  const results = await semanticSearch(query, topK);
  return results.map((r) => ({
    content: r.content,
    metadata: r.metadata,
  }));
}
