export interface Chunk {
  id: string;
  content: string;
  metadata: Record<string, string>;
}

export function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

export function chunkDocument(id: string, content: string, metadata: Record<string, string>): Chunk[] {
  const textChunks = chunkText(content);
  return textChunks.map((text, index) => ({
    id: `${id}_chunk_${index}`,
    content: text,
    metadata,
  }));
}
