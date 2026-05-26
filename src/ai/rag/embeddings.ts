import { pipeline } from '@xenova/transformers';
import { Chunk } from './chunking';

// ─── Embedding Provider Interface ───────────────────────────────────
// Swap this implementation to switch from local to OpenAI/Cohere/etc.

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// ─── Local Embedding Provider (Xenova/Transformers.js) ──────────────

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2'; // 384-dim, fast, good quality
let pipelineInstance: any = null;

async function getPipeline(): Promise<any> {
  if (!pipelineInstance) {
    console.log(`[Embeddings] Loading model: ${MODEL_NAME}...`);
    pipelineInstance = await pipeline('feature-extraction', MODEL_NAME);
    console.log(`[Embeddings] Model loaded.`);
  }
  return pipelineInstance;
}

export const localEmbeddingProvider: EmbeddingProvider = {
  async embed(text: string): Promise<number[]> {
    const extractor = await getPipeline();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array);
  },

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  },
};

// ─── Active Provider ────────────────────────────────────────────────
// Change this to swap embedding providers globally.

let activeProvider: EmbeddingProvider = localEmbeddingProvider;

export function setEmbeddingProvider(provider: EmbeddingProvider): void {
  activeProvider = provider;
}

// ─── Public API ─────────────────────────────────────────────────────

export interface EmbeddedChunk {
  embedding: number[];
  content: string;
  metadata: {
    source: string;
    chunk: number;
  };
}

/**
 * Generate embedding for a single text string.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  return activeProvider.embed(text);
}

/**
 * Generate embeddings for an array of chunks.
 * Returns EmbeddedChunk[] with embedding + original content/metadata.
 */
export async function generateEmbeddings(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
  const results: EmbeddedChunk[] = [];

  console.log(`[Embeddings] Generating embeddings for ${chunks.length} chunks...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      const embedding = await activeProvider.embed(chunk.content);

      results.push({
        embedding,
        content: chunk.content,
        metadata: chunk.metadata,
      });

      if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
        console.log(`[Embeddings] Progress: ${i + 1}/${chunks.length} (${chunk.metadata.source})`);
      }
    } catch (err) {
      console.error(`[Embeddings] Failed chunk ${i} from ${chunk.metadata.source}:`, err);
    }
  }

  console.log(`[Embeddings] Total embeddings generated: ${results.length}`);
  return results;
}

// ─── Utility ────────────────────────────────────────────────────────

export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}
