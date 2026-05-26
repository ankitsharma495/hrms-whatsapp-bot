import { hrmsApiService } from '../../services/hrms-api.service';

export interface LeaveBalanceEntry {
  leave_type: string;
  total: number;
  used: number;
  remaining: number;
}

export interface ValidationResult {
  valid: boolean;
  requestedType: string;
  requestedBalance: number;
  alternatives: LeaveBalanceEntry[];
  allBalances: LeaveBalanceEntry[];
}

/**
 * Fetches leave balances and checks if the requested leave type has sufficient balance.
 * If not, returns available alternatives with remaining > 0.
 */
export async function validateLeaveBalance(
  employeeId: number,
  leaveType: string,
  daysRequired: number = 1,
): Promise<ValidationResult> {
  const data = await hrmsApiService.getLeaveBalance(employeeId);
  const balances: LeaveBalanceEntry[] = Array.isArray(data) ? data : data.balances || [];

  const requested = balances.find(
    (b) => b.leave_type.toLowerCase() === leaveType.toLowerCase(),
  );

  const requestedBalance = requested?.remaining ?? 0;
  const valid = requestedBalance >= daysRequired;

  const alternatives = balances.filter(
    (b) =>
      b.leave_type.toLowerCase() !== leaveType.toLowerCase() && b.remaining > 0,
  );

  return {
    valid,
    requestedType: leaveType,
    requestedBalance,
    alternatives,
    allBalances: balances,
  };
}

/**
 * Builds a human-friendly message showing insufficient balance + alternatives.
 */
export function buildInsufficientBalanceMessage(result: ValidationResult): string {
  let msg = `❌ Insufficient ${result.requestedType} leave balance. You have only ${result.requestedBalance} day(s) remaining.\n`;

  if (result.alternatives.length > 0) {
    msg += '\nAvailable balances:\n';
    for (const alt of result.alternatives) {
      msg += `• ${capitalize(alt.leave_type)} Leave: ${alt.remaining} day(s)\n`;
    }
    msg += '\nWould you like to use another leave type?';
  } else {
    msg += '\nNo other leave types have remaining balance. Please contact HR.';
  }

  return msg.trim();
}

/**
 * Calculates the number of working days between two dates (inclusive).
 */
export function calculateDaysRequired(fromDate: string, toDate: string, duration: number): number {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  let days = 0;

  const current = new Date(from);
  while (current <= to) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }

  // If duration is 0.5 (half day) and it's a single day, count as 0.5
  if (days === 1 && duration === 0.5) {
    return 0.5;
  }

  return days;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
