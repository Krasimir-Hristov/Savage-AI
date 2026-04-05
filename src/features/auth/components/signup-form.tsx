'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ArrowRight, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { signupAction } from '@/features/auth/actions/signup.action';
import { type ActionState } from '@/features/auth/actions/auth.actions';

const initialState: ActionState = {};

export const SignupForm = (): React.JSX.Element => {
  const [state, formAction, isPending] = useActionState(signupAction, initialState);

  return (
    <Card className='relative overflow-hidden border-border/70 bg-card/85 shadow-[0_24px_120px_oklch(0_0_0/0.55)] backdrop-blur-sm'>
      <div className='absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,oklch(0.596_0.2387_41.12),transparent)]' />

      <CardHeader className='space-y-5 border-b border-border/70 pb-6'>
        <div className='flex items-center justify-between gap-3'>
          <Badge className='bg-character-dad-muted px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-character-dad'>
            Create account
          </Badge>
          <span className='flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-amber'>
            <Sparkles className='size-3.5' />
            Fresh Entry
          </span>
        </div>

        <div className='space-y-3'>
          <CardTitle className='font-heading text-3xl font-semibold leading-tight text-foreground sm:text-4xl'>
            Join the chaos.
          </CardTitle>
          <CardDescription className='max-w-md text-sm leading-7 text-muted-foreground sm:text-[0.95rem]'>
            Create your SavageAI account and unlock conversations that are brutally honest, sharp,
            and unexpectedly useful.
          </CardDescription>
        </div>

        <div className='flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/45 px-4 py-3 text-sm text-muted-foreground'>
          <span className='flex size-9 items-center justify-center rounded-full bg-character-dad-muted text-character-dad'>
            <UserRound className='size-4.5' />
          </span>
          <p>Pick a name, get inside, and let the AI judge you properly.</p>
        </div>
      </CardHeader>

      <form action={formAction} className='space-y-6'>
        <CardContent className='space-y-5 pt-6'>
          {state.error?.message && (
            <p
              role='alert'
              aria-live='assertive'
              className='rounded-2xl border border-character-grandpa/30 bg-character-grandpa-muted px-4 py-3 text-sm text-character-grandpa'
            >
              {state.error.message}
            </p>
          )}

          <div className='space-y-2'>
            <label
              htmlFor='name'
              className='text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground'
            >
              Display name
            </label>
            <div className='relative'>
              <UserRound className='pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                id='name'
                name='name'
                type='text'
                placeholder='Your legendary nickname'
                autoComplete='nickname'
                defaultValue={state.values?.name || ''}
                required
                aria-invalid={!!state.error?.fieldErrors?.name}
                aria-describedby={state.error?.fieldErrors?.name ? 'name-error' : undefined}
                className='h-12 rounded-2xl border-border/70 bg-background/80 pl-11 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/30'
              />
            </div>
            {state.error?.fieldErrors?.name?.map((err) => (
              <p id='name-error' key={err} className='text-xs text-character-grandpa'>
                {err}
              </p>
            ))}
          </div>

          <div className='space-y-2'>
            <label
              htmlFor='signup-email'
              className='text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground'
            >
              Email
            </label>
            <div className='relative'>
              <Mail className='pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                id='signup-email'
                name='email'
                type='email'
                placeholder='you@example.com'
                autoComplete='email'
                defaultValue={state.values?.email || ''}
                required
                aria-invalid={!!state.error?.fieldErrors?.email}
                aria-describedby={
                  state.error?.fieldErrors?.email ? 'signup-email-error' : undefined
                }
                className='h-12 rounded-2xl border-border/70 bg-background/80 pl-11 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/30'
              />
            </div>
            {state.error?.fieldErrors?.email?.map((err) => (
              <p id='signup-email-error' key={err} className='text-xs text-character-grandpa'>
                {err}
              </p>
            ))}
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between gap-3'>
              <label
                htmlFor='signup-password'
                className='text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground'
              >
                Password
              </label>
              <span className='text-xs text-muted-foreground'>Minimum 8 characters</span>
            </div>
            <div className='relative'>
              <LockKeyhole className='pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                id='signup-password'
                name='password'
                type='password'
                placeholder='••••••••'
                autoComplete='new-password'
                required
                aria-invalid={!!state.error?.fieldErrors?.password}
                aria-describedby={
                  state.error?.fieldErrors?.password ? 'signup-password-error' : undefined
                }
                className='h-12 rounded-2xl border-border/70 bg-background/80 pl-11 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/30'
              />
            </div>
            {state.error?.fieldErrors?.password?.map((err) => (
              <p id='signup-password-error' key={err} className='text-xs text-character-grandpa'>
                {err}
              </p>
            ))}
          </div>
        </CardContent>

        <CardFooter className='flex flex-col gap-4 border-t border-border/70 bg-secondary/35 p-4 sm:p-5'>
          <Button
            type='submit'
            disabled={isPending}
            size='lg'
            className='h-12 w-full rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 cursor-pointer'
          >
            {isPending ? 'Creating account...' : 'Create SavageAI account'}
            <ArrowRight className='size-4' />
          </Button>

          <div className='flex w-full items-center justify-between gap-4 text-sm text-muted-foreground'>
            <span>Already inside?</span>
            <Link
              href='/login'
              className='font-medium text-character-dad transition-colors hover:text-character-grandpa'
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};
