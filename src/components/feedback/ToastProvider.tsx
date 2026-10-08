import { type ReactNode } from "react";
import { Toaster } from "react-hot-toast";

/**
 * Provider de toasts basado en react-hot-toast. Monta el <Toaster> global con
 * estilos alineados a nuestros tokens (tarjeta, borde, sombra). El acceso a la
 * API se hace vía el hook useToast (envuelve react-hot-toast).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-center"
        containerStyle={{ bottom: 90 }}
        toastOptions={{
          duration: 3500,
          style: {
            background: "#FFFFFF",
            color: "#0F172A",
            border: "1px solid #E2E8F0",
            borderRadius: "0.875rem",
            boxShadow:
              "0 10px 24px -4px rgba(8,76,76,0.12), 0 4px 10px -2px rgba(15,23,42,0.06)",
            fontSize: "0.875rem",
            fontWeight: 600,
            padding: "0.75rem 1rem",
          },
          success: { iconTheme: { primary: "#0D6E6E", secondary: "#fff" } },
          error: { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
        }}
      />
    </>
  );
}


