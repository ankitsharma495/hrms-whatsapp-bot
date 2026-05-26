import { hrmsApiService } from '../../services/hrms-api.service';

export async function getLeaveBalanceTool(employeeId: number): Promise<string> {
  const data = await hrmsApiService.getLeaveBalance(employeeId);
  const balances = Array.isArray(data) ? data : data.balances || [];

  if (balances.length === 0) return 'No leave balance data found.';

  let result = 'Your leave balance:\n';
  for (const b of balances) {
    result += `${b.leave_type}: ${b.remaining} remaining (${b.used} used)\n`;
  }
  return result.trim();
}
