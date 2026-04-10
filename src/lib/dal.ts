// Data Access Layer

import 'server-only';

import { cache } from 'react';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import type { Conversation, Message } from '@/types/chat';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export async function verifySession(): Promise<{ userId: string; email: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      redirect('/login');
    }

    return { userId: user.id, email: user.email ?? '' };
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw error;
    throw new Error(
      `verifySession failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getUser(): Promise<ProfileRow> {
  try {
    const { userId } = await verifySession();
    const supabase = await createClient();

    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error || !data) {
      throw new Error(`Failed to fetch user profile: ${error?.message ?? 'Not found'}`);
    }

    return data;
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw error;
    throw new Error(`getUser failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Returns the authenticated user without redirecting (for public pages like landing)
export async function getOptionalUser(): Promise<{
  userId: string;
  email: string;
  displayName: string | null;
} | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    return {
      userId: user.id,
      email: user.email ?? '',
      displayName: profile?.display_name ?? null,
    };
  } catch {
    return null;
  }
}

// cache() deduplicates calls within a single server request (React 19, stable)
export const getConversations = cache(async (userId: string): Promise<Conversation[]> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('conversations')
      .select('id, user_id, character_id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    return data ?? [];
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw error;
    throw new Error(
      `getConversations failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

export async function getConversation(conversationId: string): Promise<Conversation> {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('conversations')
    .select('id, user_id, character_id, title, created_at, updated_at')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Conversation not found or access denied');
  }

  return data;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    const { userId } = await verifySession();
    const supabase = await createClient();

    // Verify ownership — prevent users from accessing other users' conversations
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.user_id !== userId) {
      throw new Error('Unauthorized: conversation does not belong to this user');
    }

    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, role, content, model, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return (data ?? []).map((msg) => ({
      ...msg,
      role: msg.role as Message['role'],
    }));
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw error;
    throw new Error(
      `getMessages failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
