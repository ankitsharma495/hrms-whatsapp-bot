import { hrmsApiService } from '../../services/hrms-api.service';

export async function getAttendanceTool(employeeId: number, type: 'summary' | 'recent', params?: { month?: string; days?: number }): Promise<string> {
  if (type === 'summary') {
    const now = new Date();
    const month = params?.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const data = await hrmsApiService.getAttendanceSummary(employeeId, month);
    const s = data.summary || data;

    return (
      `Attendance for ${month}:\n` +
      `Present: ${s.present ?? 0} | Absent: ${s.absent ?? 0}\n` +
      `WFO: ${s.wfo ?? 0} | WFH: ${s.wfh ?? 0}\n` +
      `Late: ${s.late_count ?? s.late ?? 0} times | LOP: ${s.lop_days ?? s.lop ?? 0} days`
    );
  }

  if (type === 'recent') {
    const days = params?.days || 7;
    const data = await hrmsApiService.getRecentAttendance(employeeId, days);
    const records = Array.isArray(data) ? data : data.records || [];

    if (records.length === 0) return 'No recent attendance records found.';

    let result = `Recent attendance (last ${days} days):\n`;
    for (const r of records) {
      result += `• ${r.date} | ${r.type} | In: ${r.check_in || '-'} Out: ${r.check_out || '-'}\n`;
    }
    return result.trim();
  }

  return 'Invalid attendance request.';
}
