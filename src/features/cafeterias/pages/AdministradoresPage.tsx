import { Users } from "lucide-react";
import { SkeletonFila } from "@/components/ui";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { useAdministradores } from "@/features/usuarios/hooks";
import { rolLabel } from "@/lib/enums";

export function AdministradoresPage() {
  const { data: admins, isLoading, isError } = useAdministradores();

  return (
    <PantallaConHeader
      titulo="Administradores"
      subtitulo={
        <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
          <Users className="h-4 w-4 text-primary-container" aria-hidden />
          Admins de todas las cafeterías
        </p>
      }
    >
      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => <SkeletonFila key={i} />)}
        </div>
      )}

      {isError && (
        <p className="rounded-2xl bg-error-container/40 p-4 text-body-sm text-on-error-container">
          No se pudieron cargar los administradores.
        </p>
      )}

      {admins && admins.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Users className="h-10 w-10 text-on-surface-variant/40" aria-hidden />
          <p className="text-body-md text-on-surface-variant">No hay administradores registrados</p>
        </div>
      )}

      {admins && admins.length > 0 && (
        <div className="flex flex-col gap-3">
          {admins.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-xs"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-container/15 font-bold text-primary-container">
                {a.nombre.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-lg font-semibold text-on-surface">{a.nombre}</p>
                <p className="text-body-sm text-on-surface-variant">{a.nombreUsuario}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-label-sm font-semibold ${
                  a.activo
                    ? "bg-verde-menta/20 text-cafe-intenso"
                    : "bg-error-container text-on-error-container"
                }`}
              >
                {a.activo ? rolLabel[a.rol] : "Inactivo"}
              </span>
            </div>
          ))}
        </div>
      )}
    </PantallaConHeader>
  );
}
