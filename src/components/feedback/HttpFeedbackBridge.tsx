import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/http";
import toast from "react-hot-toast";

/**
 * Muestra un toast cuando una MUTACIÀ“N (acción del usuario: crear, editar, cobrar…)
 * falla por permiso (403) u otro error de negocio. Las QUERIES de fondo NO generan
 * toast: si una consulta de estado devuelve 403 se maneja en silencio (la UI ya
 * oculta lo que el rol no puede ver). Así evitamos ruido de errores no accionados.
 */
export function HttpFeedbackBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const cache = queryClient.getMutationCache();
    const unsub = cache.subscribe((event) => {
      // Solo reaccionar cuando una mutación termina en error.
      if (event?.type !== "updated") return;
      const mutation = event.mutation;
      if (mutation?.state.status !== "error") return;

      const error = mutation.state.error;
      if (error instanceof ApiError) {
        if (error.status === 403) {
          toast.error("No tienes permiso para esta acción.");
        } else if (error.status !== 401) {
          // 401 lo maneja auth (logout). El resto muestra el mensaje del backend.
          toast.error(error.message);
        }
      }
    });
    return unsub;
  }, [queryClient]);

  return null;
}




