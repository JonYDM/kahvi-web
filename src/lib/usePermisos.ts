import { useAuth } from "@/features/auth";
import { puede, type Accion } from "@/lib/permisos";

/**
 * Hook de permisos: devuelve una función `puede(accion)` ligada a la sesión actual.
 * Uso: const p = usePermisos(); if (p("usar_pos")) { ... }
 */
export function usePermisos() {
  const { sesion } = useAuth();
  return (accion: Accion) => puede(sesion, accion);
}


