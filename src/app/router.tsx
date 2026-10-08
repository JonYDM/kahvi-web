import { lazy, Suspense, type ReactNode } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { RolUsuario } from "@/types/api";
import { ProtectedRoute, useAuth, rutaInicialPorRol } from "@/features/auth";
import { Spinner } from "@/components/ui";
import { PaginaError } from "@/components/organisms/PaginaError";

/** 404: página no encontrada. Lleva al inicio del rol actual (o al login). */
function PaginaNoEncontrada() {
  const { sesion } = useAuth();
  const inicio = sesion ? rutaInicialPorRol(sesion.rol) : "/login";
  return (
    <PaginaError
      codigo="404"
      titulo="Página no encontrada"
      descripcion="La página que buscas no existe o se movió de lugar."
      irA={inicio}
    />
  );
}

// ── Lazy imports ─────────────────────────────────────────────────────────────
const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const StaffLayout = lazy(() =>
  import("@/app/layouts/StaffLayout").then((m) => ({ default: m.StaffLayout })),
);
const AdminLayout = lazy(() =>
  import("@/app/layouts/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const MeseroLayout = lazy(() =>
  import("@/app/layouts/EstacionLayout").then((m) => ({ default: m.EstacionLayout })),
);
const CocinaLayout = lazy(() =>
  import("@/app/layouts/EstacionLayout").then((m) => ({ default: m.EstacionLayout })),
);
const CajaLayout = lazy(() =>
  import("@/app/layouts/EstacionLayout").then((m) => ({ default: m.EstacionLayout })),
);

// Área Admin
const StaffDashboard = lazy(() =>
  import("@/features/dashboard/StaffDashboard").then((m) => ({ default: m.StaffDashboard })),
);
const AdminPage = lazy(() =>
  import("@/features/admin").then((m) => ({ default: m.AdminPage })),
);
const HistorialVentasPage = lazy(() =>
  import("@/features/pos").then((m) => ({ default: m.HistorialVentasPage })),
);
const EquipoPage = lazy(() =>
  import("@/features/usuarios").then((m) => ({ default: m.StaffPage })),
);
const CategoriasPage = lazy(() =>
  import("@/features/categorias").then((m) => ({ default: m.CategoriasPage })),
);
const ProductosPage = lazy(() =>
  import("@/features/productos").then((m) => ({ default: m.ProductosPage })),
);
const VentasResumenPage = lazy(() =>
  import("@/features/ventas").then((m) => ({ default: m.VentasPage })),
);

// Área Comandas
const MeseroPage = lazy(() =>
  import("@/features/comandas").then((m) => ({ default: m.MeseroPage })),
);
const CocinaPage = lazy(() =>
  import("@/features/comandas").then((m) => ({ default: m.CocinaPage })),
);
const CajaPage = lazy(() =>
  import("@/features/comandas").then((m) => ({ default: m.CajaPage })),
);

// Área SuperAdmin
const ResumenSuperAdminPage = lazy(() =>
  import("@/features/cafeterias").then((m) => ({ default: m.ResumenSuperAdminPage })),
);
const CafeteriasPage = lazy(() =>
  import("@/features/cafeterias").then((m) => ({ default: m.CafeteriasPage })),
);
const AdministradoresPage = lazy(() =>
  import("@/features/cafeterias").then((m) => ({ default: m.AdministradoresPage })),
);

// Roles con acceso al área de staff (Admin)
const STAFF_ROLES = [RolUsuario.Administrador];

/** Redirige la raíz "/" al home del rol actual (o al login si no hay sesión). */
function RootRedirect() {
  const { sesion, cargando } = useAuth();
  if (cargando) return <FullSpinner label="Cargando…" />;
  if (!sesion) return <Navigate to="/login" replace />;
  return <Navigate to={rutaInicialPorRol(sesion.rol)} replace />;
}

function FullSpinner({ label }: { label?: string }) {
  return (
    <div className="grid min-h-full place-items-center">
      <Spinner label={label} />
    </div>
  );
}

/** Envuelve un elemento en Suspense + guarda de roles. */
function Protegida({ roles, children }: { roles?: RolUsuario[]; children: ReactNode }) {
  return (
    <ProtectedRoute roles={roles}>
      <Suspense fallback={<FullSpinner />}>{children}</Suspense>
    </ProtectedRoute>
  );
}

const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  {
    path: "/login",
    element: (
      <Suspense fallback={<FullSpinner />}>
        <LoginPage />
      </Suspense>
    ),
  },

  // ── Área Administrador (/app) ──
  {
    path: "/app",
    element: <Protegida roles={STAFF_ROLES}><StaffLayout /></Protegida>,
    children: [
      { index: true, element: <StaffDashboard /> },
      { path: "admin", element: <AdminPage /> },
      { path: "pos", element: <Navigate to="/app/productos" replace /> },
      { path: "productos", element: <ProductosPage /> },
      {
        path: "ventas",
        element: (
          <ProtectedRoute roles={[RolUsuario.Administrador]}>
            <VentasResumenPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "historico",
        element: (
          <ProtectedRoute roles={[RolUsuario.Administrador]}>
            <HistorialVentasPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "equipo",
        element: (
          <ProtectedRoute roles={[RolUsuario.Administrador]}>
            <EquipoPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "categorias",
        element: (
          <ProtectedRoute roles={[RolUsuario.Administrador]}>
            <CategoriasPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ── Área Mesero (/mesero) ──
  {
    path: "/mesero",
    element: <Protegida roles={[RolUsuario.Mesero, RolUsuario.Administrador]}><MeseroLayout /></Protegida>,
    children: [
      { index: true, element: <MeseroPage /> },
    ],
  },

  // ── Área Cocina (/cocina) ──
  {
    path: "/cocina",
    element: <Protegida roles={[RolUsuario.Cocina, RolUsuario.Administrador]}><CocinaLayout /></Protegida>,
    children: [
      { index: true, element: <CocinaPage /> },
    ],
  },

  // ── Área Caja (/caja) ──
  {
    path: "/caja",
    element: <Protegida roles={[RolUsuario.Caja, RolUsuario.Administrador]}><CajaLayout /></Protegida>,
    children: [
      { index: true, element: <CajaPage /> },
    ],
  },

  // ── Panel SuperAdmin (/admin) ──
  {
    path: "/admin",
    element: <Protegida roles={[RolUsuario.SuperAdmin]}><AdminLayout /></Protegida>,
    children: [
      { index: true, element: <ResumenSuperAdminPage /> },
      { path: "cafeterias", element: <CafeteriasPage /> },
      { path: "administradores", element: <AdministradoresPage /> },
    ],
  },

  { path: "*", element: <PaginaNoEncontrada /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
