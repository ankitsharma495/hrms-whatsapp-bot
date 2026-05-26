import { SessionData } from '../services/session';
import { getAttendanceSummary, getRecentAttendance } from '../services/hrms';
import { sendWhatsAppMessage } from '../utils/twilio';

export async function handleAttendance(
  phone: string,
  message: string,
  session: SessionData,
  intent: string
): Promise<void> {
  const to = `whatsapp:${phone}`;

  if (intent === 'attendance_summary') {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const data = await getAttendanceSummary(session.employee_id!, month);
    const s = data.summary || data;

    const reply =
      `Attendance for ${month}:\n` +
      `Present: ${s.present ?? 0} | Absent: ${s.absent ?? 0}\n` +
      `WFO: ${s.wfo ?? 0} | WFH: ${s.wfh ?? 0}\n` +
      `Late: ${s.late ?? 0} times | LOP: ${s.lop ?? 0} days`;

    await sendWhatsAppMessage(to, reply);
    return;
  }

  if (intent === 'attendance_recent') {
    const data = await getRecentAttendance(session.employee_id!, 7);
    const records = data.records || data;

    if (!Array.isArray(records) || records.length === 0) {
      await sendWhatsAppMessage(to, 'No recent attendance records found.');
      return;
    }

    let reply = 'Recent attendance (last 7 days):\n';
    for (const r of records) {
      reply += `• ${r.date} | ${r.type} | In: ${r.check_in || '-'} Out: ${r.check_out || '-'}\n`;
    }

    await sendWhatsAppMessage(to, reply.trim());
    return;
  }
}
