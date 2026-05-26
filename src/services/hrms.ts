const HRMS_API_URL = process.env.HRMS_API_URL || 'http://localhost:3001';
const HRMS_API_KEY = process.env.HRMS_API_KEY || '';

async function hrmsGet(path: string): Promise<any> {
  const res = await fetch(`${HRMS_API_URL}${path}`, {
    headers: { 'x-api-key': HRMS_API_KEY },
  });
  const text = await res.text();
  console.log(`HRMS GET ${path}:`, text);
  return JSON.parse(text);
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
  const data = await res.json();
  console.log(`HRMS POST ${path}:`, data);
  return { ok: res.ok, status: res.status, data };
}

export async function getEmployeeByPhone(phone: string) {
  return hrmsGet(`/api/employee/me?phone=${encodeURIComponent(phone)}`);
}

export async function getLeaveBalance(employee_id: number) {
  return hrmsGet(`/api/leave/balance?employee_id=${employee_id}`);
}

export async function getLeaveApplications(employee_id: number, limit: number) {
  return hrmsGet(`/api/leave/applications?employee_id=${employee_id}&limit=${limit}`);
}

export async function applyLeave(payload: {
  employee_id: number;
  leave_type: string;
  from_date: string;
  to_date: string;
  duration: number;
  reason: string;
}) {
  return hrmsPost('/api/leave/apply', payload);
}

export async function getAttendanceSummary(employee_id: number, month: string) {
  return hrmsGet(`/api/attendance/summary?employee_id=${employee_id}&month=${month}`);
}

export async function getRecentAttendance(employee_id: number, days: number) {
  return hrmsGet(`/api/attendance/recent?employee_id=${employee_id}&days=${days}`);
}

export async function getPayrollSlip(employee_id: number, month: string) {
  return hrmsGet(`/api/payroll/slip?employee_id=${employee_id}&month=${month}`);
}

export async function getRecentPayroll(employee_id: number, limit: number) {
  return hrmsGet(`/api/payroll/recent?employee_id=${employee_id}&limit=${limit}`);
}