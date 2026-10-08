import { ChefHat, Clock, Fire, ArrowsClockwise } from "@phosphor-icons/react";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { Button, SkeletonFila } from "@/components/ui";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import { estadoComandaColor, estadoComandaLabel } from "@/lib/enums";
import type { ComandaDto, EstadoComanda } from "@/types/api";
import { useComandasActivas, useAvanzarComanda } from "../hooks";

/** Calcula el tiempo transcurrido desde una fecha ISO en formato legible. */
function tiempoTranscurrido(creadaEn: string): string {
  const diff = Math.floor((Date.now() - new Date(creadaEn).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m`;
}

/** Ordena: Recibida primero, luego EnPreparacion, luego Lista. */
const ORDEN_ESTADO: Record<EstadoComanda, number> = {
  Recibida: 0,
  EnPreparacion: 1,
  Lista: 2,
  Entregada: 3,
  Cancelada: 4,
};

/** Tablero de cocina: comandas activas con polling cada 5s. */
export function CocinaPage() {
  const { data: comandas, isLoading, isError, dataUpdatedAt } = useComandasActivas();
  const avanzar = useAvanzarComanda();
  const toast = useToast();

  // Solo las que le importan a cocina
  const activas = (comandas ?? [])
    .filter((c) => c.estado === "Recibida" || c.estado === "EnPreparacion" || c.estado === "Lista")
    .sort((a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado]);

  async function handleAvanzar(comanda: ComandaDto) {
    try {
      const res = await avanzar.mutateAsync(comanda.id);
      toast.exito(`Comanda #${comanda.folio} â†’ ${estadoComandaLabel[res.nuevoEstado]}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo avanzar la comanda.");
    }
  }

  const ultimaActualizacion = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <PantallaConHeader
      titulo="Cocina"
      subtitulo={
        <p className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
          <ArrowsClockwise weight='light' className="h-3.5 w-3.5 text-primary-container" aria-hidden />
          {ultimaActualizacion ? `Actualizado ${ultimaActualizacion}` : "Cargandoâ€¦"}
          <span className="mx-1">Â·</span>
          <span className="font-semibold text-on-surface">{activas.length}</span> comanda{activas.length !== 1 ? "s" : ""}
        </p>
      }
    >
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <SkeletonFila key={i} />)}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl bg-error-container/40 p-6 text-center text-body-sm text-on-error-container">
          No se pudieron cargar las comandas.
        </div>
      )}

      {!isLoading && !isError && activas.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-6xl" aria-hidden>â˜•</span>
          <div>
            <p className="text-headline-sm font-bold text-cafe-intenso">Todo listo</p>
            <p className="mt-1 text-body-md text-on-surface-variant">
              No hay comandas pendientes. El sistema actualiza cada 5 segundos.
            </p>
          </div>
        </div>
      )}

      {/* Tablero de comandas */}
      <div className="flex flex-col gap-4">
        {activas.map((comanda) => (
          <ComandaCard
            key={comanda.id}
            comanda={comanda}
            onAvanzar={() => handleAvanzar(comanda)}
            avanzando={avanzar.isPending}
          />
        ))}
      </div>
    </PantallaConHeader>
  );
}

function ComandaCard({
  comanda,
  onAvanzar,
  avanzando,
}: {
  comanda: ComandaDto;
  onAvanzar: () => void;
  avanzando: boolean;
}) {
  const esLista = comanda.estado === "Lista";
  const tiempo = tiempoTranscurrido(comanda.creadaEn);
  const esUrgente = (() => {
    const min = Math.floor((Date.now() - new Date(comanda.creadaEn).getTime()) / 60000);
    return min >= 10;
  })();

  const etiquetaBoton: Record<EstadoComanda, string> = {
    Recibida: "â–¶ Iniciar preparación",
    EnPreparacion: "âœ“ Marcar como lista",
    Lista: "âœ” Entregada",
    Entregada: "",
    Cancelada: "",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border-2 p-4 shadow-soft transition-all",
        esLista
          ? "border-verde-menta bg-verde-menta/10"
          : comanda.estado === "Recibida"
            ? "border-caramelo/50 bg-surface-container-lowest"
            : "border-orange-300 bg-orange-50",
      )}
    >
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Número de folio destacado */}
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-label-lg font-black",
              esLista ? "bg-verde-menta text-cafe-intenso" : "bg-cafe-intenso text-crema",
            )}
          >
            #{comanda.folio}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-headline-sm font-bold text-cafe-intenso">
                {comanda.esParaLlevar ? "Para llevar" : comanda.mesa}
              </p>
              {comanda.esParaLlevar && (
                <span className="rounded-full bg-caramelo/20 px-2 py-0.5 text-label-sm font-bold text-cafe-intenso">
                  ðŸ›ï¸ Llevar
                </span>
              )}
              {comanda.esParaLlevar && comanda.nombreCliente && (
                <span className="text-body-sm font-semibold text-primary-container">
                  {comanda.nombreCliente}
                </span>
              )}
            </div>
            <p className="text-body-sm text-on-surface-variant">{comanda.meseroNombre}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-label-sm font-bold border",
              estadoComandaColor(comanda.estado),
            )}
          >
            {estadoComandaLabel[comanda.estado]}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 text-label-sm",
              esUrgente ? "text-red-600 font-bold" : "text-on-surface-variant",
            )}
          >
            {esUrgente ? <Fire weight='light' className="h-3.5 w-3.5" aria-hidden /> : <Clock weight='light' className="h-3.5 w-3.5" aria-hidden />}
            {tiempo}
          </span>
        </div>
      </div>

      {/* Àtems */}
      <ul className="flex flex-col gap-1.5 rounded-xl bg-white/60 px-3 py-2.5">
        {comanda.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="shrink-0 min-w-[1.5rem] text-label-md font-black text-cafe-principal">
              {item.cantidad}À—
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-label-md font-semibold text-cafe-intenso">{item.nombre}</span>
              {item.nota && (
                <p className="text-body-sm italic text-cafe-principal mt-0.5">
                  "{item.nota}"
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Acción */}
      {comanda.estado !== "Entregada" && comanda.estado !== "Cancelada" && (
        <Button
          fullWidth
          size="sm"
          onClick={onAvanzar}
          loading={avanzando}
          className={cn(
            "font-bold",
            esLista
              ? "bg-verde-menta text-cafe-intenso hover:bg-verde-menta/80"
              : "bg-cafe-intenso text-crema hover:bg-cafe-intenso/90",
          )}
        >
          <ChefHat weight='light' className="h-4 w-4" aria-hidden />
          {etiquetaBoton[comanda.estado]}
        </Button>
      )}
    </div>
  );
}



