'use client';

import { useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const QueryProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
