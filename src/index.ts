import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { executeMessage } from './ai/orchestrator/executor';
import { whatsappService } from './integrations/whatsapp/whatsapp.service';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/webhook', async (req, res) => {
  try {
    const from: string = req.body.From || '';
    const body: string = req.body.Body || '';
    const phone = from.replace('whatsapp:', '');

    console.log('RAW FROM:', from);
    console.log('RAW BODY:', body);

    const reply = await executeMessage(phone, body);
    await whatsappService.sendMessage(from, reply);
  } catch (error) {
    console.error('Webhook error:', error);
  }

  return res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`WhatsApp bot running on port ${PORT}`);
});
