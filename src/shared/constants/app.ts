export const APP_NAME = 'whatsapp-hr-bot';

export const INTENTS = [
  'leave_balance',
  'leave_apply',
  'leave_history',
  'attendance_summary',
  'attendance_recent',
  'payroll_slip',
  'payroll_recent',
  'policy_query',
  'analytics_query',
  'greeting',
  'unknown',
] as const;

export const LEAVE_TYPES = ['casual', 'sick', 'earned'] as const;
