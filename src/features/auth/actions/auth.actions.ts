'use server';

import 'server-only';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/features/auth/schemas/auth.schema';

export type ActionState = {
  error?: {
    message?: string;
    fieldErrors?: {
      name?: string[];
      email?: string[];
      password?: string[];
    };
  };
  values?: {
    name?: string;
    email?: string;
  };
};

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const result = loginSchema.safeParse(rawData);

  if (!result.success) {
    return {
      error: {
        fieldErrors: result.error.flatten().fieldErrors,
      },
      values: {
        email: String(rawData.email || ''),
      },
    };
  }

  let loginSucceeded = false;

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error) {
      return {
        error: {
          message: error.message,
        },
        values: {
          email: result.data.email,
        },
      };
    }

    loginSucceeded = true;
  } catch (err) {
    console.error('[loginAction] Error:', err);

    return {
      error: {
        message: 'Unable to login. Please try again.',
      },
      values: {
        email: result.data.email,
      },
    };
  }

  if (loginSucceeded) {
    redirect('/chat');
  }

  return {};
}

export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[logoutAction] Error:', err);
  }

  redirect('/login');
}

