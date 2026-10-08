import { useAuth } from "@/features/auth";

/**
 * Devuelve el cafeteriaId de la sesión (tenant actual).
 * Lanza si no existe (no debería pasar dentro de rutas protegidas de staff).
 */
export function useCafeteriaId(): string {
  const { sesion } = useAuth();
  if (!sesion?.cafeteriaId) {
    throw new Error("La sesión no tiene cafeteriaId.");
  }
  return sesion.cafeteriaId;
}
