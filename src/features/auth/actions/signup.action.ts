'use server';

import 'server-only';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { signupSchema } from '@/features/auth/schemas/auth.schema';
import { type ActionState } from '@/features/auth/actions/auth.actions';

export async function signupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const result = signupSchema.safeParse(rawData);

  if (!result.success) {
    return {
      error: {
        fieldErrors: result.error.flatten().fieldErrors,
      },
      values: {
        name: String(rawData.name || ''),
        email: String(rawData.email || ''),
      },
    };
  }

  let signupSucceeded = false;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          display_name: result.data.name,
        },
      },
    });

    if (error) {
      return {
        error: {
          message: error.message,
        },
        values: {
          name: result.data.name,
          email: result.data.email,
        },
      };
    }

    signupSucceeded = true;
  } catch (err) {
    console.error('[signupAction] Error:', err);

    return {
      error: {
        message: 'Unable to create account. Please try again.',
      },
      values: {
        name: result.data.name,
        email: result.data.email,
      },
    };
  }

  if (signupSucceeded) {
    redirect('/chat');
  }

  return {};
}
