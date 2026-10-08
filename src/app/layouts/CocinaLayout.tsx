import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/organisms/AppShell";
import { navCocina } from "@/app/navigation";

/** Layout del área de cocina (/cocina/*). */
export function CocinaLayout() {
  return (
    <AppShell nav={navCocina} titulo="Cocina">
      <Outlet />
    </AppShell>
  );
}


