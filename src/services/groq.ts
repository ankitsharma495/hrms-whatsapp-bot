const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function chatCompletion(systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0,
      max_tokens: 100,
    }),
  });

  const data = await res.json();
  console.log('GROQ RAW:', JSON.stringify(data));
  return (data.choices?.[0]?.message?.content || '').trim();
}

export async function classifyIntent(message: string): Promise<string> {
  const systemPrompt = `You are an HR assistant intent classifier. Classify the user message into exactly one of these intents:
- leave_balance
- leave_apply
- leave_history
- attendance_summary
- attendance_recent
- payroll_slip
- payroll_recent
- greeting
- unknown

Reply with only the intent string, nothing else.`;

  const result = await chatCompletion(systemPrompt, message);
  const intent = result.toLowerCase().trim();
  console.log('INTENT CLASSIFIED:', intent);
  return intent;
}

export async function generateResponse(prompt: string): Promise<string> {
  const systemPrompt = 'You are a helpful HR assistant. Reply in a friendly, concise way. Use simple english. Keep replies under 100 words.';
  return chatCompletion(systemPrompt, prompt);
}
