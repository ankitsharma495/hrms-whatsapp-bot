import { semanticSearch, SearchResult } from './vector.store';

/**
 * Searches Pinecone for policy-relevant chunks and returns results with scores.
 */
export async function policySearch(query: string, topK: number = 3): Promise<SearchResult[]> {
  const results = await semanticSearch(query, topK);

  console.log(`[PolicySearch] Query: "${query}"`);
  console.log(`[PolicySearch] Results: ${results.length}`);
  for (const r of results) {
    console.log(`  - ${r.metadata.source} #${r.metadata.chunk} (score: ${r.score.toFixed(4)})`);
  }

  return results;
}

/**
 * Builds a combined context string from search results for LLM injection.
 */
export function buildContextFromResults(results: SearchResult[]): string {
  if (results.length === 0) return '';

  return results
    .map((r, i) => `[Source: ${r.metadata.source}, Chunk: ${r.metadata.chunk}, Score: ${r.score.toFixed(2)}]\n${r.content}`)
    .join('\n\n');
}
