import { Pinecone } from '@pinecone-database/pinecone';
import { Chunk } from './chunking';
import { EmbeddedChunk, generateEmbedding } from './embeddings';

// ─── Pinecone Client ────────────────────────────────────────────────

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'hrms-docs';

let pineconeIndex: ReturnType<Pinecone['index']> | null = null;

function getIndex() {
  if (!pineconeIndex) {
    const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
    pineconeIndex = pc.index(PINECONE_INDEX);
    console.log(`[VectorStore] Connected to Pinecone index: ${PINECONE_INDEX}`);
  }
  return pineconeIndex;
}

// ─── Search Result Type ─────────────────────────────────────────────

export interface SearchResult {
  content: string;
  metadata: {
    source: string;
    chunk: number;
  };
  score: number;
}

// ─── Store Embeddings ───────────────────────────────────────────────

/**
 * Upserts embedded chunks into Pinecone in batches of 100.
 */
export async function storeEmbeddings(embeddedChunks: EmbeddedChunk[]): Promise<void> {
  const index = getIndex();
  const BATCH_SIZE = 100;

  console.log(`[VectorStore] Upserting ${embeddedChunks.length} vectors...`);

  for (let i = 0; i < embeddedChunks.length; i += BATCH_SIZE) {
    const batch = embeddedChunks.slice(i, i + BATCH_SIZE);

    const vectors = batch.map((chunk, j) => ({
      id: `${chunk.metadata.source}_chunk_${chunk.metadata.chunk}`,
      values: chunk.embedding,
      metadata: {
        content: chunk.content,
        source: chunk.metadata.source,
        chunk: chunk.metadata.chunk,
      },
    }));

    await index.upsert({ records: vectors });

    console.log(`[VectorStore] Upserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${vectors.length} vectors)`);
  }

  console.log(`[VectorStore] Total vectors uploaded: ${embeddedChunks.length}`);
}

// ─── Semantic Search ────────────────────────────────────────────────

/**
 * Generates an embedding for the query and searches Pinecone for top matches.
 */
export async function semanticSearch(query: string, topK: number = 3): Promise<SearchResult[]> {
  const index = getIndex();
  const queryEmbedding = await generateEmbedding(query);

  console.log(`[VectorStore] Searching: "${query}" (topK: ${topK})`);
  console.log(`[VectorStore] QUERY VECTOR DIMENSION: ${queryEmbedding.length}`);

  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    includeValues: false,
  });

  console.log('[VectorStore] RAW PINECONE RESPONSE:', JSON.stringify(results, null, 2));

  const matches: SearchResult[] = (results.matches || []).map((match) => ({
    content: (match.metadata?.content as string) || '',
    metadata: {
      source: (match.metadata?.source as string) || '',
      chunk: Number(match.metadata?.chunk ?? 0),
    },
    score: match.score ?? 0,
  }));

  console.log(`[VectorStore] Found ${matches.length} matches:`);
  for (const m of matches) {
    console.log(`  - ${m.metadata.source} #${m.metadata.chunk} (score: ${m.score.toFixed(4)})`);
  }

  return matches;
}

// ─── Legacy Compat (used by retriever.ts) ───────────────────────────

export async function searchStore(query: string, topK: number = 3): Promise<Chunk[]> {
  const results = await semanticSearch(query, topK);
  return results.map((r) => ({
    content: r.content,
    metadata: r.metadata,
  }));
}
