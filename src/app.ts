import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import webhookRouter from './integrations/whatsapp/webhook';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', webhookRouter);

app.listen(PORT, () => {
  console.log(`WhatsApp bot running on port ${PORT}`);
});

export default app;
