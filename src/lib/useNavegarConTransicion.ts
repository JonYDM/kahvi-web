import { useCallback } from "react";
import { useNavigate, type NavigateOptions } from "react-router-dom";

/**
 * Navegación con la View Transitions API del navegador (transición suave entre
 * vistas). Si el navegador no la soporta, hace la navegación normal (fallback).
 * Progressive enhancement: mejora donde se puede, funciona siempre.
 */
export function useNavegarConTransicion() {
  const navigate = useNavigate();

  return useCallback(
    (to: string, options?: NavigateOptions) => {
      if (typeof document !== "undefined" && "startViewTransition" in document) {
        (document as Document & {
          startViewTransition: (cb: () => void) => void;
        }).startViewTransition(() => navigate(to, options));
      } else {
        navigate(to, options);
      }
    },
    [navigate],
  );
}




