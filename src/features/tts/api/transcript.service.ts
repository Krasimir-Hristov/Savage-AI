import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type TranscriptMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export class TranscriptSaveError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'TranscriptSaveError';
  }
}

export const saveVoiceTranscript = async (
  userId: string,
  conversationId: string,
  messages: TranscriptMessage[]
): Promise<void> => {
  const supabase = await createClient();

  // Verify conversation ownership
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('user_id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();

  if (convError || !conversation) {
    throw new TranscriptSaveError('Conversation not found', 404);
  }

  // Insert transcript messages
  const rows = messages.map((m) => ({
    conversation_id: conversationId,
    role: m.role,
    content: m.content,
    model: null,
    image_url: null,
  }));

  const { error: insertError } = await supabase.from('messages').insert(rows);

  if (insertError) {
    console.error('[tts/transcript] Failed to insert messages:', insertError.message);
    throw new TranscriptSaveError('Failed to save transcript', 500);
  }

  const { error: updateError } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (updateError) {
    console.error('[tts/transcript] Failed to update conversation timestamp:', conversationId, updateError.message);
  }
};
