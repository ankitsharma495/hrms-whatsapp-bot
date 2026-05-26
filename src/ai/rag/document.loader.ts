// Document loader for HR policy documents
// Reads PDF/text files and extracts raw text content

import * as fs from 'fs';
import * as path from 'path';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

export interface Document {
  content: string;
  metadata: {
    source: string;
    [key: string]: string;
  };
}

/**
 * Loads all supported files (.pdf, .txt, .md) from a directory.
 * Uses LangChain PDFLoader for PDF extraction.
 */
export async function loadDocuments(dirPath: string): Promise<Document[]> {
  const docs: Document[] = [];
  const absolutePath = path.resolve(dirPath);

  if (!fs.existsSync(absolutePath)) {
    console.warn(`[DocumentLoader] Directory not found: ${absolutePath}`);
    return docs;
  }

  const files = fs.readdirSync(absolutePath);
  const supported = files.filter(
    (f) => f.endsWith('.pdf') || f.endsWith('.txt') || f.endsWith('.md'),
  );

  console.log(`[DocumentLoader] Found ${supported.length} files in ${absolutePath}`);

  for (const file of supported) {
    const filePath = path.join(absolutePath, file);

    try {
      let content: string;

      if (file.endsWith('.pdf')) {
        const loader = new PDFLoader(filePath, { splitPages: false });
        const pages = await loader.load();
        content = pages.map((p) => p.pageContent).join('\n');
      } else {
        content = fs.readFileSync(filePath, 'utf-8');
      }

      console.log(`[DocumentLoader] Loaded: ${file} (${content.length} chars)`);

      docs.push({
        content,
        metadata: { source: file },
      });
    } catch (err) {
      console.error(`[DocumentLoader] Failed to load ${file}:`, err);
    }
  }

  console.log(`[DocumentLoader] Total documents loaded: ${docs.length}`);
  return docs;
}
