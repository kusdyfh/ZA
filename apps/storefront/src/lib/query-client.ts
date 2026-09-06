import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      dehydrate: {
        // Include pending queries in the dehydrated state too, so a
        // server-side prefetch that's still resolving can still stream
        // to the client instead of being dropped (ADR 0022 §1).
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * On the server, a fresh `QueryClient` per request — request state must
 * never leak between users. In the browser, one singleton for the
 * whole session, matching every prior epic's client-side React Query
 * setup (ADR 0019 §1, ADR 0022 §1).
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
