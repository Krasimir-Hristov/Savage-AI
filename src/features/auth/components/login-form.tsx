'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { loginAction, type ActionState } from '@/features/auth/actions/auth.actions';

const initialState: ActionState = {};

export const LoginForm = (): React.JSX.Element => {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <Card className='w-full max-w-sm border-[#1E1E1E] bg-[#141414]'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-bold text-white'>Welcome back</CardTitle>
        <CardDescription className='text-zinc-400'>
          Sign in to get roasted by your favourite character
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className='space-y-4'>
          {state.error?.message && (
            <p className='rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-400'>
              {state.error.message}
            </p>
          )}

          <div className='space-y-1.5'>
            <label htmlFor='email' className='text-sm font-medium text-zinc-300'>
              Email
            </label>
            <Input
              id='email'
              name='email'
              type='email'
              placeholder='you@example.com'
              autoComplete='email'
              defaultValue={state.values?.email || ''}
              required
              className='border-[#1E1E1E] bg-[#0A0A0A] text-white placeholder:text-zinc-600 focus-visible:ring-[#DC2626]'
            />
            {state.error?.fieldErrors?.email?.map((err) => (
              <p key={err} className='text-xs text-red-400'>
                {err}
              </p>
            ))}
          </div>

          <div className='space-y-1.5'>
            <label htmlFor='password' className='text-sm font-medium text-zinc-300'>
              Password
            </label>
            <Input
              id='password'
              name='password'
              type='password'
              placeholder='••••••••'
              autoComplete='current-password'
              required
              className='border-[#1E1E1E] bg-[#0A0A0A] text-white placeholder:text-zinc-600 focus-visible:ring-[#DC2626]'
            />
            {state.error?.fieldErrors?.password?.map((err) => (
              <p key={err} className='text-xs text-red-400'>
                {err}
              </p>
            ))}
          </div>
        </CardContent>

        <CardFooter className='flex flex-col gap-3'>
          <Button
            type='submit'
            disabled={isPending}
            className='w-full bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:opacity-50'
          >
            {isPending ? 'Signing in...' : 'Sign in'}
          </Button>

          <p className='text-center text-sm text-zinc-500'>
            Don&apos;t have an account?{' '}
            <Link href='/signup' className='font-medium text-[#DC2626] hover:text-[#B91C1C]'>
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};
