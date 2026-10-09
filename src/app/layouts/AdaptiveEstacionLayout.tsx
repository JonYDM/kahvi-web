import { Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { RolUsuario } from "@/types/api";
import { AppShell } from "@/components/organisms/AppShell";
import { EstacionLayout } from "./EstacionLayout";
import { navStaff } from "@/app/navigation";

/**
 * Layout adaptivo para estaciones (Mesero, Cocina, Caja).
 * - Si el usuario es Administrador: usa AppShell con navStaff para que
 *   pueda navegar entre todos los módulos sin quedar atrapado.
 * - Si es el rol nativo de la estación: usa EstacionLayout (sin nav, pantalla completa).
 */
export function AdaptiveEstacionLayout() {
  const { sesion } = useAuth();

  if (sesion?.rol === RolUsuario.Administrador) {
    return (
      <AppShell nav={navStaff} titulo="">
        <Outlet />
      </AppShell>
    );
  }

  return <EstacionLayout />;
}


