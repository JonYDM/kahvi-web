import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { ConfirmProvider } from "@/components/feedback/ConfirmProvider";
import { HttpFeedbackBridge } from "@/components/feedback/HttpFeedbackBridge";
import { ApiError } from "@/lib/http";

/**
 * Providers globales de la app: TanStack Query (estado de servidor) + Auth +
 * feedback (toasts y confirmaciones).
 * El QueryClient se crea una sola vez con useState para que sea estable.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // No reintentar errores de permiso/sesión (no cambian con reintentos).
            retry: (fallos, error) => {
              if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
                return false;
              }
              return fallos < 1;
            },
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <HttpFeedbackBridge />
        <ConfirmProvider>
          <AuthProvider>{children}</AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}




