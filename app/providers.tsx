"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { UiProvider } from "../contexts/UiContext";
import { WalletProvider } from "../contexts/WalletContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <UiProvider>
        <WalletProvider>
          {children}
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