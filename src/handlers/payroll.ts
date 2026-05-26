import { SessionData } from '../services/session';
import { getPayrollSlip, getRecentPayroll } from '../services/hrms';
import { sendWhatsAppMessage } from '../utils/twilio';

export async function handlePayroll(
  phone: string,
  message: string,
  session: SessionData,
  intent: string
): Promise<void> {
  const to = `whatsapp:${phone}`;

  if (intent === 'payroll_slip') {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const data = await getPayrollSlip(session.employee_id!, month);
    const slip = data.slip || data;

    const reply =
      `Salary slip for ${month}:\n` +
      `Basic: ₹${slip.basic ?? 0}\n` +
      `HRA: ₹${slip.hra ?? 0}\n` +
      `LOP Deduction: ₹${slip.lop_deduction ?? 0} (${slip.lop_days ?? 0} days)\n` +
      `─────────────────\n` +
      `Net Salary: ₹${slip.net_salary ?? 0}`;

    await sendWhatsAppMessage(to, reply);
    return;
  }

  if (intent === 'payroll_recent') {
    const data = await getRecentPayroll(session.employee_id!, 3);
    const slips = data.slips || data;

    if (!Array.isArray(slips) || slips.length === 0) {
      await sendWhatsAppMessage(to, 'No recent payroll records found.');
      return;
    }

    let reply = 'Recent payroll:\n';
    for (const s of slips) {
      reply += `• ${s.month} → ₹${s.net_salary} (LOP: ${s.lop_days} days)\n`;
    }

    await sendWhatsAppMessage(to, reply.trim());
    return;
  }
}
