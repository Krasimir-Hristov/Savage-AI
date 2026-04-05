'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const AuthError = ({ error, reset }: ErrorProps): React.JSX.Element => {
  return (
    <Card className="w-full max-w-sm border-[#1E1E1E] bg-[#141414]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-red-400">Something went wrong</CardTitle>
        <CardDescription className="text-zinc-400">
          An error occurred while processing your request
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-400">
          {error.message || 'Unknown error. Please try again.'}
        </p>

        <Button
          onClick={reset}
          className="w-full bg-[#DC2626] text-white hover:bg-[#B91C1C]"
        >
          Try again
        </Button>
      </CardContent>
    </Card>
  );
};

export default AuthError;
