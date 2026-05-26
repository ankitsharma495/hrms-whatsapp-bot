import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from './document.loader';

export interface Chunk {
  content: string;
  metadata: {
    source: string;
    chunk: number;
  };
}

/**
 * Splits an array of Documents into smaller chunks using LangChain's
 * RecursiveCharacterTextSplitter with configurable size and overlap.
 */
export async function splitDocuments(
  docs: Document[],
  chunkSize: number = 1000,
  chunkOverlap: number = 200,
): Promise<Chunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const allChunks: Chunk[] = [];

  for (const doc of docs) {
    const textChunks = await splitter.splitText(doc.content);

    for (let i = 0; i < textChunks.length; i++) {
      allChunks.push({
        content: textChunks[i],
        metadata: {
          source: doc.metadata.source,
          chunk: i,
        },
      });
    }

    console.log(`[Chunking] ${doc.metadata.source} → ${textChunks.length} chunks`);
  }

  console.log(`[Chunking] Total chunks created: ${allChunks.length}`);
  return allChunks;
}
