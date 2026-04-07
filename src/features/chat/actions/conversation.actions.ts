'use server';
import 'server-only';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { verifySession } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';

export async function createConversationAction(
  characterId: string
): Promise<{ id: string } | { error: string }> {
  try {
    const { userId } = await verifySession();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, character_id: characterId })
      .select('id')
      .single();

    if (error || !data) {
      return { error: error?.message ?? 'Failed to create conversation' };
    }

    return { id: data.id };
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
    return { error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function updateConversationTitleAction(
  conversationId: string,
  firstMessage: string
): Promise<{ error?: string }> {
  const schema = z.object({
    conversationId: z.string().uuid(),
    firstMessage: z.string().max(500),
  });
  const parsed = schema.safeParse({ conversationId, firstMessage });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const { userId } = await verifySession();
    const supabase = await createClient();

    const trimmed = parsed.data.firstMessage.trim();
    const title = trimmed.slice(0, 60) + (trimmed.length > 60 ? '…' : '');

    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', parsed.data.conversationId)
      .eq('user_id', userId);

    if (error) return { error: error.message };

    return {};
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
    return { error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function renameConversationAction(
  conversationId: string,
  title: string
): Promise<{ error?: string }> {
  const schema = z.object({
    conversationId: z.string().uuid(),
    title: z.string().min(1, 'Title cannot be empty').max(100),
  });
  const parsed = schema.safeParse({ conversationId, title: title.trim() });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const { userId } = await verifySession();
    const supabase = await createClient();

    const { error } = await supabase
      .from('conversations')
      .update({ title: parsed.data.title })
      .eq('id', parsed.data.conversationId)
      .eq('user_id', userId);

    if (error) return { error: error.message };

    return {};
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
    return { error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function deleteConversationAction(
  conversationId: string
): Promise<{ error?: string }> {
  try {
    const { userId } = await verifySession();
    const supabase = await createClient();

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/chat');
    return {};
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
    return { error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
