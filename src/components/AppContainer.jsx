'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"



const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            gcTime: 5 * 60_000,
        },
        mutations: { retry: 0 },
    },
});

export default function AppContainer({ children }) {
    return (
        <QueryClientProvider client={queryClient}>
            <div>
                {children}
            </div>
        </QueryClientProvider>
    );
}