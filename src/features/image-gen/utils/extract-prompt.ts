import 'server-only';

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

export async function extractImagePrompt(userMessage: string, llm: ChatOpenAI): Promise<string> {
  try {
    const response = await llm.invoke([
      new SystemMessage(
        'You are a prompt engineer. Extract the image description from the user message and rewrite it as a clear, detailed English prompt for an AI image generator. Reply ONLY with the prompt text — no explanations, no quotes, nothing else.'
      ),
      new HumanMessage(userMessage),
    ]);
    const text = typeof response.content === 'string' ? response.content.trim() : '';
    return text || userMessage;
  } catch {
    return userMessage;
  }
}
