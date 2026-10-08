import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/organisms/AppShell";
import { navMesero } from "@/app/navigation";

/** Layout del área de mesero (/mesero/*). */
export function MeseroLayout() {
  return (
    <AppShell nav={navMesero} titulo="Comanda">
      <Outlet />
    </AppShell>
  );
}
