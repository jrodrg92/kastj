"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "../contexts/LanguageContext";
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
      <LanguageProvider>
        <WalletProvider>
          {children}
          <Toaster position="top-right" />
        </WalletProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}