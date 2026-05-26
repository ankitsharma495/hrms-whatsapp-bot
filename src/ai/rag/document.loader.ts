// Document loader for HR policy documents
// Reads policy files and returns raw text content

import * as fs from 'fs';
import * as path from 'path';

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, string>;
}

export function loadDocuments(dirPath: string): Document[] {
  const docs: Document[] = [];

  if (!fs.existsSync(dirPath)) return docs;

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (!file.endsWith('.txt') && !file.endsWith('.md')) continue;

    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    docs.push({
      id: file,
      content,
      metadata: { source: file },
    });
  }

  return docs;
}
