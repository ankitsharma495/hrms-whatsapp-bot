import { Intent } from './classifier';
import { leaveAgent } from '../agents/leave.agent';
import { attendanceAgent } from '../agents/attendance.agent';
import { payrollAgent } from '../agents/payroll.agent';
import { policyAgent } from '../agents/policy.agent';
import { analyticsAgent } from '../agents/analytics.agent';

export interface AgentContext {
  phone: string;
  employeeId: number;
  employeeName: string;
  message: string;
}

type AgentHandler = (ctx: AgentContext) => Promise<string>;

const agentMap: Record<string, AgentHandler> = {
  leave_balance: leaveAgent.handleBalance,
  leave_apply: leaveAgent.handleApply,
  leave_history: leaveAgent.handleHistory,
  attendance_summary: attendanceAgent.handleSummary,
  attendance_recent: attendanceAgent.handleRecent,
  payroll_slip: payrollAgent.handleSlip,
  payroll_recent: payrollAgent.handleRecent,
  policy_query: policyAgent.handleQuery,
  analytics_query: analyticsAgent.handleQuery,
};

export function routeToAgent(intent: Intent): AgentHandler | null {
  return agentMap[intent] || null;
}
