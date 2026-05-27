const HRMS_API_URL = process.env.HRMS_API_URL || 'http://localhost:3001';
const HRMS_API_KEY = process.env.HRMS_API_KEY || '';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<any> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return { parsed: JSON.parse(text), status: res.status, ok: res.ok };
    } catch {
      console.error(`HRMS API attempt ${attempt}/${MAX_RETRIES} returned non-JSON (${res.status}):`, text.substring(0, 200));
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY / 1000}s...`);
        await delay(RETRY_DELAY);
      } else {
        throw new Error('HRMS backend is unavailable. Please try again in a moment.');
      }
    }
  }
}

async function hrmsGet(path: string): Promise<any> {
  const result = await fetchWithRetry(`${HRMS_API_URL}${path}`, {
    headers: { 'x-api-key': HRMS_API_KEY },
  });
  return result.parsed;
}

async function hrmsPost(path: string, body: any): Promise<{ ok: boolean; status: number; data: any }> {
  const result = await fetchWithRetry(`${HRMS_API_URL}${path}`, {
    method: 'POST',
    headers: {
      'x-api-key': HRMS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return { ok: result.ok, status: result.status, data: result.parsed };
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
