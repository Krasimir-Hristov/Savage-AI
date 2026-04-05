'use client';

import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const AuthError = ({ error, reset }: ErrorProps): React.JSX.Element => {
  console.error('[AuthError]', error);

  return (
    <Card className='overflow-hidden border-border/70 bg-card/85 shadow-[0_24px_120px_oklch(0_0_0/0.55)] backdrop-blur-sm'>
      <CardHeader className='space-y-4 border-b border-border/70 pb-6'>
        <div className='w-fit rounded-full border border-character-grandpa/30 bg-character-grandpa-muted px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-character-grandpa'>
          Auth interruption
        </div>
        <CardTitle className='font-heading text-3xl font-semibold text-foreground'>
          Something went wrong
        </CardTitle>
        <CardDescription className='text-sm leading-7 text-muted-foreground'>
          An error occurred while processing your request
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-5 pt-6'>
        <p className='rounded-2xl border border-character-grandpa/30 bg-character-grandpa-muted px-4 py-3 text-sm text-character-grandpa'>
          An unexpected error occurred. Please try again.
        </p>

        <Button
          onClick={reset}
          size='lg'
          className='h-12 w-full cursor-pointer rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90'
        >
          Try again
        </Button>
      </CardContent>
    </Card>
  );
};

export default AuthError;
