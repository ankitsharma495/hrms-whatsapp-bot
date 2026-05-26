import { hrmsApiService } from '../../services/hrms-api.service';

export async function getPayrollTool(employeeId: number, type: 'slip' | 'recent', params?: { month?: string; limit?: number }): Promise<string> {
  if (type === 'slip') {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const month = params?.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const data = await hrmsApiService.getPayrollSlip(employeeId, month);
    const slip = data.slip || data;

    if (!slip || !slip.basic) return `No salary slip found for ${month}.`;

    return (
      `Salary slip for ${month}:\n` +
      `Basic: ₹${slip.basic}\n` +
      `HRA: ₹${slip.hra}\n` +
      `LOP Deduction: ₹${slip.lop_deduction ?? 0} (${slip.lop_days ?? 0} days)\n` +
      `─────────────────\n` +
      `Net Salary: ₹${slip.net_salary}`
    );
  }

  if (type === 'recent') {
    const limit = params?.limit || 3;
    const data = await hrmsApiService.getRecentPayroll(employeeId, limit);
    const slips = Array.isArray(data) ? data : data.slips || [];

    if (slips.length === 0) return 'No recent payroll records found.';

    let result = 'Recent payroll:\n';
    for (const s of slips) {
      result += `• ${s.month} → ₹${s.net_salary} (LOP: ${s.lop_days} days)\n`;
    }
    return result.trim();
  }

  return 'Invalid payroll request.';
}
