'use server';
import 'server-only';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { verifySession } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import { deleteImagesFromStorage } from '@/lib/supabase/storage';

export async function createConversationAction(
  characterId: string
): Promise<{ id: string } | { error: string }> {
  const schema = z.object({ characterId: z.string().min(1) });
  const parsed = schema.safeParse({ characterId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid characterId' };
  }

  try {
    const { userId } = await verifySession();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, character_id: parsed.data.characterId })
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
  const schema = z.object({ conversationId: z.string().uuid() });
  const parsed = schema.safeParse({ conversationId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid conversationId' };
  }

  try {
    const { userId } = await verifySession();
    const supabase = await createClient();

    // 1. Fetch image URLs before cascade delete removes the messages
    const { data: imageMessages, error: imgQueryError } = await supabase
      .from('messages')
      .select('image_url')
      .eq('conversation_id', parsed.data.conversationId)
      .not('image_url', 'is', null);

    if (imgQueryError) {
      console.error('[deleteConversation] Failed to fetch image URLs:', imgQueryError.message);
    }

    // 2. Delete conversation — cascade removes messages via FK
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', parsed.data.conversationId)
      .eq('user_id', userId);

    if (error) {
      return { error: error.message };
    }

    // 3. Delete storage files after DB succeeds (failure here only leaves orphan files, not broken UI)
    const imageUrls = (imageMessages ?? [])
      .map((m) => m.image_url)
      .filter((url): url is string => url !== null);

    if (imageUrls.length > 0) {
      await deleteImagesFromStorage(imageUrls);
    }

    revalidatePath('/chat');
    return {};
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
    return { error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
