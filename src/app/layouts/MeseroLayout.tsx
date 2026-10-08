import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/organisms/AppShell";

/**
 * Layout del mesero: pantalla única, sin barra de navegación inferior.
 * Pasamos nav=[] para que AppShell no renderice la tab bar.
 * El footer de MeseroPage (botón Continuar) queda siempre visible.
 */
export function MeseroLayout() {
  return (
    <AppShell nav={[]} titulo="Comanda">
      <Outlet />
    </AppShell>
  );
}
