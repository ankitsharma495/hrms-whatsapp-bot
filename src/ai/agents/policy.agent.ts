import { AgentContext } from '../orchestrator/router.agent';
import { searchPolicyTool } from '../tools/searchPolicy.tool';
import { openaiService } from '../../services/openai.service';
import { policyPrompt } from '../prompts/policy.prompt';

export const policyAgent = {
  async handleQuery(ctx: AgentContext): Promise<string> {
    const context = await searchPolicyTool(ctx.message);
    const prompt = `User question: ${ctx.message}\n\nPolicy context:\n${context}`;
    return openaiService.chatCompletion(policyPrompt, prompt);
  },
};
