import { retrieve } from './retriever';

export async function policySearch(query: string): Promise<{ content: string }[]> {
  const chunks = await retrieve(query, 3);
  return chunks.map((c) => ({ content: c.content }));
}
