import { AgentContext } from '../orchestrator/router.agent';
import { getLeaveBalanceTool } from '../tools/getLeaveBalance.tool';
import { applyLeaveTool } from '../tools/applyLeave.tool';
import { hrmsApiService } from '../../services/hrms-api.service';
import { getSession, setSession, SessionData } from '../memory/redis.memory';
import { openaiService } from '../../services/openai.service';
import { buildLeaveExtractionPrompt } from '../prompts/leave.prompt';
import { normalizeDate } from '../../shared/utils/date';
import {
  validateLeaveBalance,
  buildInsufficientBalanceMessage,
  calculateDaysRequired,
} from '../services/leave-validation.service';

interface ExtractedLeave {
  leaveType: string | null;
  fromDate: string | null;
  toDate: string | null;
  duration: number | null;
  reason: string | null;
}

const MISSING_FIELD_QUESTIONS: Record<string, string> = {
  leaveType: 'What type of leave? (casual/sick/earned)',
  fromDate: 'From which date? (YYYY-MM-DD)',
  toDate: 'To which date? (YYYY-MM-DD)',
  duration: 'Half day or full day? (0.5/1)',
  reason: 'Reason for leave?',
};

function findFirstMissing(temp: Record<string, any>): string | null {
  const required: Array<[string, string]> = [
    ['leaveType', 'leave_type'],
    ['fromDate', 'from_date'],
    ['toDate', 'to_date'],
    ['duration', 'duration'],
    ['reason', 'reason'],
  ];
  for (const [key, tempKey] of required) {
    if (temp[tempKey] == null) return key;
  }
  return null;
}

function parseExtraction(raw: string): ExtractedLeave | null {
  try {
    let cleaned = raw
      .replace(/```json?\s*/gi, '')
      .replace(/```/g, '')
      .trim();

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      cleaned = cleaned.substring(start, end + 1);
    }

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('JSON PARSE FAILED:', err);
    console.error('RAW STRING WAS:', raw);
    return null;
  }
}

async function extractLeaveDetails(message: string): Promise<ExtractedLeave | null> {
  const today = new Date().toISOString().split('T')[0];
  const systemPrompt = buildLeaveExtractionPrompt(today);
  const raw = await openaiService.chatCompletion(systemPrompt, message, { temperature: 0, maxTokens: 200 });

  console.log('RAW AI:', raw);

  const extracted = parseExtraction(raw);
  console.log('EXTRACTED:', extracted);
  return extracted;
}

function buildNormalizedTemp(extracted: ExtractedLeave | null): Record<string, any> {
  const temp: Record<string, any> = {
    leave_type: extracted?.leaveType?.toLowerCase() ?? null,
    from_date: extracted?.fromDate ? normalizeDate(extracted.fromDate) : null,
    to_date: extracted?.toDate ? normalizeDate(extracted.toDate) : null,
    duration: extracted?.duration ?? null,
    reason: extracted?.reason ?? null,
  };

  if (temp.leave_type && !['casual', 'sick', 'earned'].includes(temp.leave_type)) {
    temp.leave_type = null;
  }

  if (temp.duration != null && temp.duration !== 0.5 && temp.duration !== 1) {
    temp.duration = null;
  }

  return temp;
}

/**
 * Validates balance and either applies leave or enters alternative-suggestion flow.
 * Returns the bot reply string.
 */
async function validateAndApply(
  phone: string,
  employeeId: number,
  temp: Record<string, any>,
): Promise<string> {
  const daysRequired = calculateDaysRequired(temp.from_date, temp.to_date, temp.duration);

  console.log('BALANCE CHECK:', { type: temp.leave_type, daysRequired });

  const validation = await validateLeaveBalance(employeeId, temp.leave_type, daysRequired);

  console.log('VALIDATION RESULT:', {
    valid: validation.valid,
    requestedBalance: validation.requestedBalance,
    alternatives: validation.alternatives.map((a) => `${a.leave_type}:${a.remaining}`),
  });

  if (validation.valid) {
    // Sufficient balance — apply directly
    const result = await applyLeaveTool({
      employee_id: employeeId,
      leave_type: temp.leave_type,
      from_date: temp.from_date,
      to_date: temp.to_date,
      duration: temp.duration,
      reason: temp.reason,
    });

    setSession(phone, { step: null, temp: {} });
    return result.message;
  }

  // Insufficient balance — save temp and suggest alternatives
  if (validation.alternatives.length > 0) {
    setSession(phone, { step: 'choose_alternative', temp });
    return buildInsufficientBalanceMessage(validation);
  }

  // No alternatives available
  setSession(phone, { step: null, temp: {} });
  return buildInsufficientBalanceMessage(validation);
}

export const leaveAgent = {
  async handleBalance(ctx: AgentContext): Promise<string> {
    return getLeaveBalanceTool(ctx.employeeId);
  },

  async handleHistory(ctx: AgentContext): Promise<string> {
    const data = await hrmsApiService.getLeaveApplications(ctx.employeeId, 5);
    const applications = Array.isArray(data) ? data : data.applications || [];

    if (applications.length === 0) return 'No recent leave applications found.';

    let reply = 'Recent leave applications:\n';
    for (const a of applications) {
      reply += `• ${a.leave_type} | ${a.from_date} to ${a.to_date} | ${a.status}\n`;
    }
    return reply.trim();
  },

  async handleApply(ctx: AgentContext): Promise<string> {
    // AI extraction — one-shot from the user's natural language message
    const extracted = await extractLeaveDetails(ctx.message);
    const temp = buildNormalizedTemp(extracted);

    console.log('NORMALIZED TEMP:', temp);

    // Check if all fields are present
    const missingField = findFirstMissing(temp);

    if (!missingField) {
      // All fields extracted — validate balance before applying
      return validateAndApply(ctx.phone, ctx.employeeId, temp);
    }

    // Some fields missing — save what we have and ask only for the first missing one
    setSession(ctx.phone, { step: `collect_${missingField}`, temp });
    return MISSING_FIELD_QUESTIONS[missingField];
  },

  async continueApply(phone: string, message: string, session: SessionData): Promise<string> {
    const text = message.trim();
    const temp: Record<string, any> = { ...session.temp };
    const step = session.step || '';

    // Handle alternative leave type selection
    if (step === 'choose_alternative') {
      return handleAlternativeChoice(phone, text, temp, session.employee_id!);
    }

    if (step === 'collect_leaveType') {
      const leaveType = text.toLowerCase();
      if (!['casual', 'sick', 'earned'].includes(leaveType)) {
        return 'Please choose: casual, sick, or earned';
      }
      temp.leave_type = leaveType;
    } else if (step === 'collect_fromDate') {
      temp.from_date = normalizeDate(text);
    } else if (step === 'collect_toDate') {
      temp.to_date = normalizeDate(text);
    } else if (step === 'collect_duration') {
      const duration = parseFloat(text);
      if (isNaN(duration) || (duration !== 0.5 && duration !== 1)) {
        return 'Please enter 0.5 for half day or 1 for full day.';
      }
      temp.duration = duration;
    } else if (step === 'collect_reason') {
      temp.reason = text;
    } else {
      setSession(phone, { step: null, temp: {} });
      return 'Something went wrong. Please try again.';
    }

    // Check if there's still a missing field
    const nextMissing = findFirstMissing(temp);

    if (nextMissing) {
      setSession(phone, { step: `collect_${nextMissing}`, temp });
      return MISSING_FIELD_QUESTIONS[nextMissing];
    }

    // All fields collected — validate balance before applying
    console.log('FINAL LEAVE PAYLOAD:', temp);
    return validateAndApply(phone, session.employee_id!, temp);
  },
};

/**
 * Handles the user's response when asked to choose an alternative leave type.
 * Understands natural language like "use casual", "casual", "yes use earned leave", "no", "cancel".
 */
async function handleAlternativeChoice(
  phone: string,
  message: string,
  temp: Record<string, any>,
  employeeId: number,
): Promise<string> {
  const lower = message.toLowerCase();

  // User wants to cancel
  if (['no', 'cancel', 'nah', 'nahi', 'nope', 'forget it', 'leave it'].some((w) => lower.includes(w))) {
    setSession(phone, { step: null, temp: {} });
    return 'No worries! Leave application cancelled. Let me know if you need anything else.';
  }

  // Try to extract leave type from the response
  const leaveTypes = ['casual', 'sick', 'earned'];
  const chosen = leaveTypes.find((t) => lower.includes(t));

  if (!chosen) {
    return 'Please specify a leave type: casual, sick, or earned. Or say "cancel" to abort.';
  }

  // Update leave type and re-validate
  temp.leave_type = chosen;
  console.log('ALTERNATIVE CHOSEN:', chosen);

  return validateAndApply(phone, employeeId, temp);
}
