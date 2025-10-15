'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"



const queryClient = new QueryClient();

export default function AppContainer({ children }) {
    return (
        <QueryClientProvider client={queryClient}>
            <div>
                {children}
            </div>
        </QueryClientProvider>
    );
}