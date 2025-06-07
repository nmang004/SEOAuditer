'use client';

import { useState, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

// Dynamically import devtools only in development
const ReactQueryDevtools = dynamic(
  () => 
    process.env.NODE_ENV === 'development'
      ? import('@tanstack/react-query-devtools').then(mod => ({ default: mod.ReactQueryDevtools }))
      : Promise.resolve({ default: () => null }),
  {
    ssr: false,
    loading: () => null,
  }
);

const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
};

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // Create a stable QueryClient instance
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Suspense fallback={null}>
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      </Suspense>
    </QueryClientProvider>
  );
}

// Export the query client creation function for testing
export { createQueryClient }; 