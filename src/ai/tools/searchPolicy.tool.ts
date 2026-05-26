import { policySearch } from '../rag/policy.search';

export async function searchPolicyTool(query: string): Promise<string> {
  const results = await policySearch(query);

  if (results.length === 0) {
    return "I don't have information about that policy. Please contact HR directly.";
  }

  return results.map((r) => r.content).join('\n\n');
}
