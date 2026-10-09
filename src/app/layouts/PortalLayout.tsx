import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/organisms/AppShell";
import { navStaff } from "@/app/navigation";

/**
 * Layout del portal del dueño â€” ya no se usa en Kahvi (no hay portal).
 * Se mantiene para evitar errores de compilación si queda referenciado.
 */
export function PortalLayout() {
  return (
    <AppShell nav={navStaff} titulo="Portal">
      <Outlet />
    </AppShell>
  );
}




