import { Router, Request, Response } from 'express';
import { executeMessage } from '../../ai/orchestrator/executor';
import { whatsappService } from './whatsapp.service';

const router = Router();

router.get('/webhook', (req: Request, res: Response) => {
  res.status(200).send('Webhook is active');
});

router.post('/webhook', async (req: Request, res: Response) => {
  console.log('--- WEBHOOK HIT ---');
  console.log('Body:', JSON.stringify(req.body));

  // Respond to Twilio immediately to avoid timeout
  res.status(200).send('OK');

  try {
    const from: string = req.body.From || '';
    const body: string = req.body.Body || '';
    const phone = from.replace('whatsapp:', '');

    console.log(`Message from ${phone}: ${body}`);

    const reply = await executeMessage(phone, body);
    console.log(`Reply: ${reply}`);

    await whatsappService.sendMessage(from, reply);
    console.log('Message sent successfully');
  } catch (error) {
    console.error('Webhook error:', error);
  }
});

export default router;
