import { policySearch, buildContextFromResults } from '../rag/policy.search';

/**
 * Retrieves policy chunks and returns a formatted context string for LLM injection.
 * Returns empty string if no relevant documents found.
 */
export async function searchPolicyTool(query: string, topK: number = 3): Promise<string> {
  const results = await policySearch(query, topK);

  if (results.length === 0) {
    console.log('[PolicyTool] No matching documents found.');
    return '';
  }

  const context = buildContextFromResults(results);
  console.log(`[PolicyTool] Context length: ${context.length} chars`);

  return context;
}
