import { Router, Request, Response } from 'express';
import { executeMessage } from '../../ai/orchestrator/executor';
import { whatsappService } from './whatsapp.service';

const router = Router();

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const from: string = req.body.From || '';
    const body: string = req.body.Body || '';
    const phone = from.replace('whatsapp:', '');

    const reply = await executeMessage(phone, body);
    await whatsappService.sendMessage(from, reply);
  } catch (error) {
    console.error('Webhook error:', error);
  }

  res.status(200).send('OK');
});

export default router;
