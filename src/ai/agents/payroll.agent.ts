import { AgentContext } from '../orchestrator/router.agent';
import { getPayrollTool } from '../tools/getPayroll.tool';

export const payrollAgent = {
  async handleSlip(ctx: AgentContext): Promise<string> {
    return getPayrollTool(ctx.employeeId, 'slip');
  },

  async handleRecent(ctx: AgentContext): Promise<string> {
    return getPayrollTool(ctx.employeeId, 'recent');
  },
};
