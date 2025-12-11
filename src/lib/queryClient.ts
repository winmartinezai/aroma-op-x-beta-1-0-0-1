/**
 * QueryClient Provider Setup
 * 
 * Configures TanStack Query for the entire app
 * Provides caching, offline support, and real-time sync capabilities
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with optimized settings for offline-first app
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Garbage collection time - how long to keep unused data in cache
            gcTime: 30 * 60 * 1000, // 30 minutes
            // Consider data fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Refetch on window focus
            refetchOnWindowFocus: true,
            // Refetch when reconnecting
            refetchOnReconnect: true,
            // Retry failed requests 3 times
            retry: 3,
            // Don't refetch on mount if data is fresh
            refetchOnMount: false
        },
        mutations: {
            // Retry failed mutations once
            retry: 1
        }
    }
});

export { QueryClientProvider };
