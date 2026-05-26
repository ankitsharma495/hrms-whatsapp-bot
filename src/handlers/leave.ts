import { SessionData, setSession } from '../services/session';
import { getLeaveBalance, getLeaveApplications, applyLeave } from '../services/hrms';
import { sendWhatsAppMessage } from '../utils/twilio';

export async function handleLeave(
  phone: string,
  message: string,
  session: SessionData,
  intent: string
): Promise<void> {
  const to = `whatsapp:${phone}`;

  if (intent === 'leave_balance') {
    const data = await getLeaveBalance(session.employee_id!);
    const balances = data.balances || data;

    let reply = 'Your leave balance:\n';
    if (Array.isArray(balances)) {
      for (const b of balances) {
        reply += `${b.leave_type}: ${b.remaining} remaining (${b.used} used)\n`;
      }
    } else {
      reply += `Casual: ${balances.casual?.remaining ?? 0} remaining (${balances.casual?.used ?? 0} used)\n`;
      reply += `Sick: ${balances.sick?.remaining ?? 0} remaining (${balances.sick?.used ?? 0} used)\n`;
      reply += `Earned: ${balances.earned?.remaining ?? 0} remaining (${balances.earned?.used ?? 0} used)\n`;
    }

    await sendWhatsAppMessage(to, reply.trim());
    return;
  }

  if (intent === 'leave_history') {
    const data = await getLeaveApplications(session.employee_id!, 5);
    const applications = data.applications || data;

    if (!Array.isArray(applications) || applications.length === 0) {
      await sendWhatsAppMessage(to, 'No recent leave applications found.');
      return;
    }

    let reply = 'Recent leave applications:\n';
    for (const a of applications) {
      reply += `• ${a.leave_type} | ${a.from_date} to ${a.to_date} | ${a.status}\n`;
    }

    await sendWhatsAppMessage(to, reply.trim());
    return;
  }

  if (intent === 'leave_apply') {
    await handleLeaveApply(phone, message, session);
    return;
  }
}

export async function handleLeaveApply(
  phone: string,
  message: string,
  session: SessionData
): Promise<void> {
  const to = `whatsapp:${phone}`;
  const text = message.trim();

  if (session.step === null) {
    setSession(phone, { step: 'leave_type', temp: {} });
    await sendWhatsAppMessage(to, 'What type of leave? (casual/sick/earned)');
    return;
  }

  if (session.step === 'leave_type') {
    const leaveType = text.toLowerCase();
    if (!['casual', 'sick', 'earned'].includes(leaveType)) {
      await sendWhatsAppMessage(to, 'Please choose: casual, sick, or earned');
      return;
    }
    setSession(phone, {
      step: 'from_date',
      temp: { ...session.temp, leave_type: leaveType },
    });
    await sendWhatsAppMessage(to, 'From date? (YYYY-MM-DD)');
    return;
  }

  if (session.step === 'from_date') {
    setSession(phone, {
      step: 'to_date',
      temp: { ...session.temp, from_date: text },
    });
    await sendWhatsAppMessage(to, 'To date? (YYYY-MM-DD)');
    return;
  }

  if (session.step === 'to_date') {
    setSession(phone, {
      step: 'duration',
      temp: { ...session.temp, to_date: text },
    });
    await sendWhatsAppMessage(to, 'Half day or full day? (0.5/1)');
    return;
  }

  if (session.step === 'duration') {
    const duration = parseFloat(text);
    if (isNaN(duration) || (duration !== 0.5 && duration !== 1)) {
      await sendWhatsAppMessage(to, 'Please enter 0.5 for half day or 1 for full day.');
      return;
    }
    setSession(phone, {
      step: 'reason',
      temp: { ...session.temp, duration },
    });
    await sendWhatsAppMessage(to, 'Reason for leave?');
    return;
  }

  if (session.step === 'reason') {
    const temp: Record<string, any> = { ...session.temp, reason: text };
    const result = await applyLeave({
      employee_id: session.employee_id!,
      leave_type: temp.leave_type,
      from_date: temp.from_date,
      to_date: temp.to_date,
      duration: temp.duration,
      reason: temp.reason,
    });

    setSession(phone, { step: null, temp: {} });

    if (result.ok) {
      await sendWhatsAppMessage(
        to,
        `✅ Leave applied successfully! Your ${temp.leave_type} leave from ${temp.from_date} to ${temp.to_date} is pending approval.`
      );
    } else if (result.status === 400) {
      const remaining = result.data?.remaining ?? 0;
      await sendWhatsAppMessage(
        to,
        `❌ Insufficient ${temp.leave_type} leave balance. You have only ${remaining} days remaining.`
      );
    } else {
      await sendWhatsAppMessage(to, '❌ Failed to apply leave. Please try again later.');
    }
    return;
  }
}
