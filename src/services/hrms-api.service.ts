const HRMS_API_URL = process.env.HRMS_API_URL || 'http://localhost:3001';
const HRMS_API_KEY = process.env.HRMS_API_KEY || '';

async function hrmsGet(path: string): Promise<any> {
  const res = await fetch(`${HRMS_API_URL}${path}`, {
    headers: { 'x-api-key': HRMS_API_KEY },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error(`HRMS API returned non-JSON (${res.status}):`, text.substring(0, 200));
    throw new Error('HRMS backend is unavailable. Please try again in a moment.');
  }
}

async function hrmsPost(path: string, body: any): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(`${HRMS_API_URL}${path}`, {
    method: 'POST',
    headers: {
      'x-api-key': HRMS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(`HRMS API returned non-JSON (${res.status}):`, text.substring(0, 200));
    throw new Error('HRMS backend is unavailable. Please try again in a moment.');
  }
  return { ok: res.ok, status: res.status, data };
}

export const hrmsApiService = {
  async getEmployeeByPhone(phone: string) {
    return hrmsGet(`/api/employee/me?phone=${encodeURIComponent(phone)}`);
  },

  async getLeaveBalance(employeeId: number) {
    return hrmsGet(`/api/leave/balance?employee_id=${employeeId}`);
  },

  async getLeaveApplications(employeeId: number, limit: number) {
    return hrmsGet(`/api/leave/applications?employee_id=${employeeId}&limit=${limit}`);
  },

  async applyLeave(payload: { employee_id: number; leave_type: string; from_date: string; to_date: string; duration: number; reason: string }) {
    return hrmsPost('/api/leave/apply', payload);
  },

  async getAttendanceSummary(employeeId: number, month: string) {
    return hrmsGet(`/api/attendance/summary?employee_id=${employeeId}&month=${month}`);
  },

  async getRecentAttendance(employeeId: number, days: number) {
    return hrmsGet(`/api/attendance/recent?employee_id=${employeeId}&days=${days}`);
  },

  async getPayrollSlip(employeeId: number, month: string) {
    return hrmsGet(`/api/payroll/slip?employee_id=${employeeId}&month=${month}`);
  },

  async getRecentPayroll(employeeId: number, limit: number) {
    return hrmsGet(`/api/payroll/recent?employee_id=${employeeId}&limit=${limit}`);
  },
};
