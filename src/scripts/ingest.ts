import 'dotenv/config';
import path from 'path';
import { loadDocuments } from '../ai/rag/document.loader';
import { splitDocuments } from '../ai/rag/chunking';
import { generateEmbeddings } from '../ai/rag/embeddings';
import { storeEmbeddings } from '../ai/rag/vector.store';

const DOCS_DIR = path.resolve(__dirname, '../../docs');

async function runIngestion(): Promise<void> {
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════');
  console.log('  RAG Ingestion Pipeline - Starting');
  console.log('═══════════════════════════════════════════');
  console.log(`  Docs directory: ${DOCS_DIR}`);
  console.log('');

  // Step 1: Load documents
  console.log('── Step 1: Loading documents ──');
  const docs = await loadDocuments(DOCS_DIR);
  if (docs.length === 0) {
    console.error('No documents found. Place PDF/TXT/MD files in docs/ and retry.');
    process.exit(1);
  }
  console.log(`✅ Loaded ${docs.length} document(s)\n`);

  // Step 2: Split into chunks
  console.log('── Step 2: Splitting documents ──');
  const chunks = await splitDocuments(docs);
  console.log(`✅ Created ${chunks.length} chunk(s)\n`);

  // Step 3: Generate embeddings
  console.log('── Step 3: Generating embeddings ──');
  const embedded = await generateEmbeddings(chunks);
  console.log(`✅ Generated ${embedded.length} embedding(s)\n`);

  // Step 4: Upload to Pinecone
  console.log('── Step 4: Uploading to Pinecone ──');
  await storeEmbeddings(embedded);
  console.log(`✅ Uploaded ${embedded.length} vector(s)\n`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('═══════════════════════════════════════════');
  console.log('  RAG ingestion completed successfully');
  console.log(`  Documents: ${docs.length}`);
  console.log(`  Chunks:    ${chunks.length}`);
  console.log(`  Vectors:   ${embedded.length}`);
  console.log(`  Time:      ${elapsed}s`);
  console.log('═══════════════════════════════════════════');
}

runIngestion().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
