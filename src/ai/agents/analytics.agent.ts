import { AgentContext } from '../orchestrator/router.agent';
import { analyticsTool } from '../tools/analytics.tool';

export const analyticsAgent = {
  async handleQuery(ctx: AgentContext): Promise<string> {
    return analyticsTool('departments');
  },
};
