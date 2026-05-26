import { whatsappService } from '../integrations/whatsapp/whatsapp.service';

export const notificationService = {
  async notifyEmployee(phone: string, message: string): Promise<void> {
    await whatsappService.sendMessage(`whatsapp:${phone}`, message);
  },

  async notifyManager(managerPhone: string, employeeName: string, action: string): Promise<void> {
    const message = `📋 ${employeeName} has ${action}. Please review in the HRMS system.`;
    await whatsappService.sendMessage(`whatsapp:${managerPhone}`, message);
  },
};
