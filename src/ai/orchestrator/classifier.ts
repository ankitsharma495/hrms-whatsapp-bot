import { openaiService } from '../../services/openai.service';
import { classifierPrompt } from '../prompts/classifier.prompt';

export type Intent =
  | 'leave_balance'
  | 'leave_apply'
  | 'leave_history'
  | 'attendance_summary'
  | 'attendance_recent'
  | 'payroll_slip'
  | 'payroll_recent'
  | 'policy_query'
  | 'analytics_query'
  | 'greeting'
  | 'unknown';

const VALID_INTENTS: Intent[] = [
  'leave_balance', 'leave_apply', 'leave_history',
  'attendance_summary', 'attendance_recent',
  'payroll_slip', 'payroll_recent',
  'policy_query', 'analytics_query',
  'greeting', 'unknown',
];

export async function classifyIntent(message: string): Promise<Intent> {
  const raw = await openaiService.chatCompletion(classifierPrompt, message, { temperature: 0, maxTokens: 50 });
  console.log('RAW CLASSIFIER:', JSON.stringify(raw));

  // Strip punctuation, whitespace, quotes
  const cleaned = raw.toLowerCase().replace(/[^a-z_]/g, '').trim();

  // Direct match
  if (VALID_INTENTS.includes(cleaned as Intent)) {
    return cleaned as Intent;
  }

  // Fallback: find any valid intent inside the response
  for (const intent of VALID_INTENTS) {
    if (raw.toLowerCase().includes(intent)) {
      return intent;
    }
  }

  return 'unknown';
}
