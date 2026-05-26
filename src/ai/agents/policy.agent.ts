import { AgentContext } from '../orchestrator/router.agent';
import { searchPolicyTool } from '../tools/searchPolicy.tool';
import { openaiService } from '../../services/openai.service';
import { buildPolicyRAGPrompt } from '../prompts/policy.prompt';

export const policyAgent = {
  async handleQuery(ctx: AgentContext): Promise<string> {
    console.log(`[PolicyAgent] Question: "${ctx.message}"`);

    // Step 1: Retrieve relevant policy chunks from Pinecone
    const context = await searchPolicyTool(ctx.message);

    // Step 2: Handle no results
    if (!context) {
      console.log('[PolicyAgent] No context found, returning fallback.');
      return 'I could not find this policy information. Please contact HR directly.';
    }

    // Step 3: Build RAG prompt with context injected
    const systemPrompt = buildPolicyRAGPrompt(context);

    console.log('[PolicyAgent] Sending to LLM with context...');

    // Step 4: Generate answer from Groq
    const answer = await openaiService.chatCompletion(
      systemPrompt,
      ctx.message,
      { temperature: 0.3, maxTokens: 300 },
    );

    console.log('[PolicyAgent] Answer generated.');
    return answer;
  },
};
