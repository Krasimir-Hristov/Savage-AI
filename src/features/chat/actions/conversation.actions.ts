'use server';
import 'server-only';

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
  try {
    const { userId } = await verifySession();
    const supabase = await createClient();

    const title = firstMessage.trim().slice(0, 60) + (firstMessage.trim().length > 60 ? '…' : '');

    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId)
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
  try {
    const { userId } = await verifySession();
    const supabase = await createClient();

    const trimmed = title.trim().slice(0, 100);
    if (!trimmed) return { error: 'Title cannot be empty' };

    const { error } = await supabase
      .from('conversations')
      .update({ title: trimmed })
      .eq('id', conversationId)
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
