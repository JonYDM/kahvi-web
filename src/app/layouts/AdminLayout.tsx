import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/organisms/AppShell";
import { navAdmin } from "@/app/navigation";

/** Layout del panel SuperAdmin (/admin/*). */
export function AdminLayout() {
  return (
    <AppShell nav={navAdmin} titulo="SuperAdmin">
      <Outlet />
    </AppShell>
  );
}




