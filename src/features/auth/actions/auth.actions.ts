'use server';

import 'server-only';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/features/auth/schemas/auth.schema';

export type ActionState = {
  error?: {
    message?: string;
    fieldErrors?: {
      email?: string[];
      password?: string[];
    };
  };
  values?: {
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

    redirect('/chat');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('[loginAction] Error:', errorMessage);

    return {
      error: {
        message: errorMessage,
      },
      values: {
        email: result.data.email,
      },
    };
  }
}
