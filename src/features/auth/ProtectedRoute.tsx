import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { rutaInicialPorRol } from "./roles";
import type { RolUsuario } from "@/types/api";
import { Spinner } from "@/components/ui";
import { PaginaError } from "@/components/organisms/PaginaError";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Si se especifica, solo estos roles pueden entrar. */
  roles?: RolUsuario[];
}

/**
 * Guarda de ruta:
 * - Sin sesión â†’ redirige a /login (recordando a dónde iba).
 * - Con sesión pero rol no permitido â†’ redirige a su home por rol.
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { sesion, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="grid min-h-full place-items-center">
        <Spinner label="Cargando sesión…" />
      </div>
    );
  }

  if (!sesion) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(sesion.rol)) {
    return (
      <PaginaError
        codigo="403"
        titulo="Sin acceso"
        descripcion="No tienes permiso para ver esta sección con tu rol."
        irA={rutaInicialPorRol(sesion.rol)}
      />
    );
  }

  return <>{children}</>;
}




