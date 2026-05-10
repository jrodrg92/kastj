"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { UiProvider } from "../contexts/UiContext";
import { WalletProvider } from "../contexts/WalletContext";
import { TransactionOverlay } from "../components/ui/TransactionOverlay";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 3, // More retries for unstable connections
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <UiProvider>
        <WalletProvider>
          {children}
          <TransactionOverlay />
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'premium-glass !text-foreground !rounded-2xl !border-border !px-6 !py-4 shadow-2xl',
              style: {
                background: 'color-mix(in oklab, var(--card) 80%, transparent)',
                backdropFilter: 'blur(16px)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
            }}
          />
        </WalletProvider>
      </UiProvider>
    </QueryClientProvider>
  );
}