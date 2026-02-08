/**
 * TanStack Query provider configuration
 * Wraps the application with React Query for server state management
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * Query client configuration with optimized defaults
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 5 minutes
        staleTime: 5 * 60 * 1000,
        // Cache time: 10 minutes
        gcTime: 10 * 60 * 1000,
        // Refetch on window focus for fresh data
        refetchOnWindowFocus: true,
        // Retry failed requests
        retry: 1,
        // Refetch on mount if stale
        refetchOnMount: true,
      },
    },
  });
}

// Browser: create singleton query client
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create new query client
    return makeQueryClient();
  } else {
    // Browser: use singleton pattern
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Query provider component
 * Provides TanStack Query context to the entire application
 * 
 * @param props - Component props
 * @returns Provider component
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may
  // suspend because React will throw away the client on the initial
  // render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  // Register QueryClient with sync service for cache invalidation
  if (typeof window !== 'undefined') {
    // Expose query client globally for logout utility (Security Fix - Feb 8, 2026)
    (window as any).__REACT_QUERY_CLIENT__ = queryClient;
    
    import('@/lib/services/sync').then(({ getSyncService }) => {
      const syncService = getSyncService();
      syncService.setQueryClient(queryClient);
    }).catch(console.error);
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

