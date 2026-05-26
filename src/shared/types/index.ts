export interface SessionData {
  employee_id: number | null;
  name: string | null;
  step: string | null;
  temp: Record<string, any>;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
}

export interface LeaveBalance {
  leave_type: string;
  total: number;
  used: number;
  remaining: number;
}

export interface AttendanceRecord {
  date: string;
  type: string;
  check_in: string | null;
  check_out: string | null;
  is_late: boolean;
}

export interface SalarySlip {
  month: string;
  basic: number;
  hra: number;
  lop_days: number;
  lop_deduction: number;
  net_salary: number;
}
