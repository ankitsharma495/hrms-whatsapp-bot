import { openaiService } from '../../services/openai.service';

const SYSTEM_PROMPT = 'You are a helpful HR assistant. Reply in a friendly, concise way. Use simple english. Keep replies under 100 words.';

export async function generateResponse(prompt: string): Promise<string> {
  return openaiService.chatCompletion(SYSTEM_PROMPT, prompt);
}
