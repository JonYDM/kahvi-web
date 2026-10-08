import { useState } from "react";
import {
  Buildings,
  CheckCircle,
  Coffee,
  Plus,
  ArrowsClockwise,
  XCircle,
} from "@phosphor-icons/react";
import { Badge, Button, SkeletonFila } from "@/components/ui";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { formatCurrency } from "@/lib/format";
import { useCafeterias, useCambiarEstadoCafeteria } from "../hooks";
import toast from "react-hot-toast";
import type { Cafeteria } from "@/types/api";

export function CafeteriasPage() {
  const { data: cafeterias, isLoading, isError } = useCafeterias();
  const cambiarEstado = useCambiarEstadoCafeteria();
  const [busqueda, setBusqueda] = useState("");

  const filtradas = (cafeterias ?? []).filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  async function toggleEstado(c: Cafeteria) {
    try {
      await cambiarEstado.mutateAsync({ id: c.id, activar: !c.activa });
      toast.success(`Cafetería ${!c.activa ? "activada" : "desactivada"}`);
    } catch {
      toast.error("No se pudo cambiar el estado");
    }
  }

  return (
    <PantallaConHeader
      titulo="Cafeterías"
      subtitulo={
        <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
          <Coffee weight='light' className="h-4 w-4 text-primary-container" aria-hidden />
          Gestión de tenants
        </p>
      }
      accion={
        <Button size="sm" className="gap-1.5">
          <Plus weight='light' className="h-4 w-4" aria-hidden />
          Nueva
        </Button>
      }
    >
      {/* Búsqueda */}
      <input
        type="search"
        placeholder="Buscar cafeteríaâ€¦"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary-container"
      />

      {isLoading && (
        <div className="mt-4 flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <SkeletonFila key={i} />
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-4 rounded-2xl bg-error-container/40 p-4 text-body-sm text-on-error-container">
          No se pudieron cargar las cafeterías. Intenta de nuevo.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="mt-4 flex flex-col gap-3">
          {filtradas.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Buildings weight='light' className="h-10 w-10 text-on-surface-variant/40" aria-hidden />
              <p className="text-body-md text-on-surface-variant">
                {busqueda ? "Sin resultados para esa búsqueda" : "No hay cafeterías registradas"}
              </p>
            </div>
          )}
          {filtradas.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-xs"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-container">
                <Buildings weight='light' className="h-5 w-5 text-on-surface-variant" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-lg font-semibold text-on-surface">{c.nombre}</p>
                <p className="text-body-sm text-on-surface-variant">{c.telefono}</p>
                {c.sucursales && c.sucursales.length > 0 && (
                  <p className="mt-0.5 text-body-sm text-on-surface-variant">
                    {c.sucursales.length} sucursal{c.sucursales.length !== 1 ? "es" : ""}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge tone={c.activa ? "success" : "danger"}>
                  {c.activa ? (
                    <><CheckCircle weight='light' className="h-3 w-3" aria-hidden /> Activa</>
                  ) : (
                    <><XCircle weight='light' className="h-3 w-3" aria-hidden /> Inactiva</>
                  )}
                </Badge>
                <button
                  onClick={() => toggleEstado(c)}
                  disabled={cambiarEstado.isPending}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
                >
                  <ArrowsClockwise weight='light' className="h-3 w-3" aria-hidden />
                  {c.activa ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PantallaConHeader>
  );
}

// Helper: si el componente Badge no acepta tone "success"/"danger", usamos clases directas.
// Este archivo asume que Badge tiene la prop tone. Si no, cambiar a span con clases.

function formatCurrencyLocal(n: number) {
  return formatCurrency(n);
}
void formatCurrencyLocal;



