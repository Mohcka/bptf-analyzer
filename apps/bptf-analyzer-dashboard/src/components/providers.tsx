"use client";

import { QueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 5 * 60 * 1000, // 5 minutes cache
        },
      },
    })
  );
  
  const [persister, setPersister] = useState<ReturnType<typeof createSyncStoragePersister> | undefined>(undefined);
  
  // Initialize persister on the client side to avoid SSR issues
  useEffect(() => {
    setPersister(createSyncStoragePersister({
      storage: window.localStorage,
    }));
  }, []);

  // Only render PersistQueryClientProvider after persister is initialized
  if (!persister) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister }}
    >
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </PersistQueryClientProvider>
  );
}
