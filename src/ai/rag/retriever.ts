import { searchStore } from './vector.store';
import { Chunk } from './chunking';

export async function retrieve(query: string, topK: number = 3): Promise<Chunk[]> {
  return searchStore(query, topK);
}
