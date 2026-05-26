import { whatsappService } from '../../integrations/whatsapp/whatsapp.service';

export async function notifyManagerTool(managerPhone: string, message: string): Promise<void> {
  await whatsappService.sendMessage(`whatsapp:${managerPhone}`, message);
}
