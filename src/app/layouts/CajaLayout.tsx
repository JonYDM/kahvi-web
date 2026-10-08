import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/organisms/AppShell";
import { navCaja } from "@/app/navigation";

/** Layout del área de caja (/caja/*). */
export function CajaLayout() {
  return (
    <AppShell nav={navCaja} titulo="Caja">
      <Outlet />
    </AppShell>
  );
}
