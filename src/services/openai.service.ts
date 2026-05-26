const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export const openaiService = {
  async chatCompletion(systemPrompt: string, userMessage: string, options?: ChatOptions): Promise<string> {
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
        temperature: options?.temperature ?? 0,
        max_tokens: options?.maxTokens ?? 100,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      console.error('GROQ API ERROR:', res.status, JSON.stringify(data.error || data));
    }

    const content = data.choices?.[0]?.message?.content || '';
    return content.trim();
  },
};
