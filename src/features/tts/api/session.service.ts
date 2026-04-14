import 'server-only';

import { getCharacter } from '@/features/characters/data';
import { createClient } from '@/lib/supabase/server';

const VOICE_MODE_INSTRUCTIONS = `\n\n--- VOICE MODE RULES (HIGHEST PRIORITY — OVERRIDE EVERYTHING ELSE) ---
You are in a LIVE VOICE CALL. The user hears you speak in real time.
- Keep EVERY response to 1-3 short sentences MAX. Never more.
- No lists, no bullet points, no markdown — speak naturally like a human.
- Do NOT explain everything. Say the key point, stay in character, stop.
- If the answer is complex, give the short version and ask if they want more.
- Silence is better than rambling. Be sharp. Be brief. Be brutal.
--- END VOICE MODE RULES ---`;

export type VoiceSessionResult = {
  signedUrl: string;
  promptOverride: string;
};

export class VoiceSessionError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'VoiceSessionError';
  }
}

export const createVoiceSession = async (
  userId: string,
  characterId: string,
  conversationId: string
): Promise<VoiceSessionResult> => {
  const supabase = await createClient();

  // Verify conversation ownership
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('user_id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();

  if (convError || !conversation) {
    throw new VoiceSessionError('Conversation not found', 404);
  }

  // Resolve character
  let character: ReturnType<typeof getCharacter>;

  try {
    character = getCharacter(characterId);
  } catch {
    throw new VoiceSessionError('Character not found', 404);
  }

  if (!character.elevenLabsAgentId) {
    throw new VoiceSessionError('Voice mode not available for this character', 400);
  }

  // Fetch recent messages for context injection
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(15);

  const messages = (recentMessages ?? []).reverse();

  const contextBlock =
    messages.length > 0
      ? '\n\n--- RECENT CONVERSATION HISTORY ---\n' +
        messages.map((m) => `${m.role === 'user' ? 'User' : 'You'}: ${m.content}`).join('\n') +
        '\n--- END OF HISTORY ---\nContinue the conversation naturally based on this context.'
      : '';

  const promptOverride = character.systemPrompt + VOICE_MODE_INSTRUCTIONS + contextBlock;

  // Get signed URL from ElevenLabs
  let signedUrl: string;

  try {
    const elevenLabsRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${character.elevenLabsAgentId}`,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY ?? '',
        },
      }
    );

    if (!elevenLabsRes.ok) {
      const errText = await elevenLabsRes.text();
      console.error('[tts/session] ElevenLabs API error:', elevenLabsRes.status, errText);
      throw new VoiceSessionError('Failed to create voice session', 502);
    }

    const data = (await elevenLabsRes.json()) as { signed_url: string };
    signedUrl = data.signed_url;
  } catch (err) {
    if (err instanceof VoiceSessionError) throw err;
    console.error('[tts/session] ElevenLabs request failed:', character.elevenLabsAgentId, err);
    throw new VoiceSessionError('Failed to create voice session', 502);
  }

  return { signedUrl, promptOverride };
};
