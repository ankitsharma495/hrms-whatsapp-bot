import { AgentContext } from '../orchestrator/router.agent';
import { getAttendanceTool } from '../tools/getAttendance.tool';

export const attendanceAgent = {
  async handleSummary(ctx: AgentContext): Promise<string> {
    return getAttendanceTool(ctx.employeeId, 'summary');
  },

  async handleRecent(ctx: AgentContext): Promise<string> {
    return getAttendanceTool(ctx.employeeId, 'recent');
  },
};
