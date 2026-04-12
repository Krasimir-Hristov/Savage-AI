'use server';

import { createClient } from '@/lib/supabase/server';
import { verifySession } from '@/lib/dal';

interface WaitlistResult {
  success: boolean;
  error?: string;
  alreadyJoined?: boolean;
}

export async function joinWaitlistAction(): Promise<WaitlistResult> {
  try {
    const { userId } = await verifySession();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return { success: false, error: 'No email found for your account.' };
    }

    const { error } = await supabase.from('waitlist').insert({
      email: user.email,
      user_id: userId,
      source: 'savage-tier',
    });

    if (error) {
      // Unique constraint violation = already on waitlist
      if (error.code === '23505') {
        return { success: true, alreadyJoined: true };
      }
      return { success: false, error: 'Failed to join waitlist. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw error;
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
