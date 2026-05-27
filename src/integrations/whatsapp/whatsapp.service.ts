const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '';

export const whatsappService = {
  async sendMessage(to: string, body: string): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
    const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

    const params = new URLSearchParams();
    params.append('From', WHATSAPP_NUMBER);
    params.append('To', to);
    params.append('Body', body);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('WhatsApp send error:', error);
    } else {
      const data = await res.json();
      console.log('Twilio response:', data.sid, data.status);
    }
  },
};
