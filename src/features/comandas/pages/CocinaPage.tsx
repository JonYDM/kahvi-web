import { ArrowsClockwise, Clock, Fire } from "@phosphor-icons/react";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { SkeletonFila } from "@/components/ui";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import { estadoComandaLabel } from "@/lib/enums";
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

function esUrgente(creadaEn: string): boolean {
  const min = Math.floor((Date.now() - new Date(creadaEn).getTime()) / 60000);
  return min >= 10;
}

// Columnas del tablero
interface Columna {
  id: EstadoComanda;
  label: string;
  badgeClass: string;
  cardBg: string;
  cardBorder: string;
  boton?: string;
}

const COLUMNAS: Columna[] = [
  {
    id: "Recibida",
    label: "Pendiente",
    badgeClass: "bg-caramelo/20 text-cafe-intenso border-caramelo/40",
    cardBg: "bg-caramelo/10",
    cardBorder: "border-caramelo/40",
    boton: "Preparar",
  },
  {
    id: "EnPreparacion",
    label: "Preparando",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
    cardBg: "bg-orange-50",
    cardBorder: "border-orange-200",
    boton: "Lista",
  },
  {
    id: "Lista",
    label: "Lista",
    badgeClass: "bg-verde-menta/20 text-cafe-intenso border-verde-menta/50",
    cardBg: "bg-verde-menta/10",
    cardBorder: "border-verde-menta/40",
  },
];

/** Tablero Kanban de cocina: 3 columnas con polling cada 5s. */
export function CocinaPage() {
  const { data: comandas, isLoading, isError, refetch } = useComandasActivas();
  const avanzar = useAvanzarComanda();
  const toast = useToast();

  const activas = (comandas ?? []).filter(
    (c) => c.estado === "Recibida" || c.estado === "EnPreparacion" || c.estado === "Lista",
  );

  async function handleAvanzar(comanda: ComandaDto) {
    try {
      const res = await avanzar.mutateAsync(comanda.id);
      toast.exito(`Comanda #${comanda.folio} -> ${estadoComandaLabel[res.nuevoEstado]}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo avanzar la comanda.");
    }
  }

  return (
    <PantallaConHeader
      titulo="Cocina"
      subtitulo={
        <p className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">{activas.length}</span>
          {" "}comanda{activas.length !== 1 ? "s" : ""} activa{activas.length !== 1 ? "s" : ""}
        </p>
      }
      accion={
        <button
          onClick={() => refetch()}
          aria-label="Actualizar"
          className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <ArrowsClockwise weight="light" className="h-5 w-5" aria-hidden />
        </button>
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
          <img
            src="/spil.webp"
            alt="Sin comandas"
            className="h-32 w-32 object-contain"
          />
          <div>
            <p className="text-headline-sm font-bold text-cafe-intenso">Todo listo</p>
            <p className="mt-1 text-body-md text-on-surface-variant">
              No hay comandas pendientes. El sistema actualiza cada 5 segundos.
            </p>
          </div>
        </div>
      )}

      {/* Tablero Kanban */}
      {!isLoading && !isError && activas.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-3 min-w-max pb-4">
            {COLUMNAS.map((col) => {
              const cards = activas.filter((c) => c.estado === col.id);
              return (
                <div
                  key={col.id}
                  className="flex w-[85vw] max-w-xs flex-col gap-3 sm:w-72"
                >
                  {/* Header columna */}
                  <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2">
                    <span className="text-label-md font-bold text-on-surface">
                      {col.label}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-label-sm font-bold",
                        col.badgeClass,
                      )}
                    >
                      {cards.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2">
                    {cards.length === 0 && (
                      <div className="rounded-xl border border-dashed border-outline-variant/40 px-4 py-6 text-center text-body-sm text-on-surface-variant/50">
                        {col.id === "Lista" ? "Para caja" : "Vacio"}
                      </div>
                    )}
                    {cards.map((comanda) => (
                      <ComandaCard
                        key={comanda.id}
                        comanda={comanda}
                        col={col}
                        onAvanzar={() => handleAvanzar(comanda)}
                        avanzando={avanzar.isPending}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PantallaConHeader>
  );
}

function ComandaCard({
  comanda,
  col,
  onAvanzar,
  avanzando,
}: {
  comanda: ComandaDto;
  col: Columna;
  onAvanzar: () => void;
  avanzando: boolean;
}) {
  const urgente = esUrgente(comanda.creadaEn);
  const tiempo = tiempoTranscurrido(comanda.creadaEn);

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border-2 p-3 transition-all",
        col.cardBg,
        col.cardBorder,
      )}
    >
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-label-md font-black text-cafe-intenso">
            #{comanda.folio}
          </p>
          <p className="text-body-sm font-semibold text-cafe-intenso">
            {comanda.esParaLlevar ? "Para llevar" : comanda.mesa}
            {comanda.esParaLlevar && comanda.nombreCliente
              ? ` \u00B7 ${comanda.nombreCliente}`
              : ""}
          </p>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-label-sm font-bold",
            urgente ? "bg-red-100 text-red-600" : "bg-white/60 text-on-surface-variant",
          )}
        >
          {urgente ? (
            <Fire weight="fill" className="h-3 w-3" aria-hidden />
          ) : (
            <Clock weight="light" className="h-3 w-3" aria-hidden />
          )}
          {tiempo}
        </span>
      </div>

      {/* Items */}
      <ul className="flex flex-col gap-1 rounded-lg bg-white/50 px-2.5 py-2">
        {comanda.items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="shrink-0 min-w-[1.25rem] text-label-sm font-black text-cafe-principal">
              {item.cantidad}x
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-label-sm font-semibold text-cafe-intenso">
                {item.nombre}
              </span>
              {item.nota && (
                <p className="text-body-xs italic text-cafe-principal mt-0.5">
                  &ldquo;{item.nota}&rdquo;
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Boton de accion */}
      {col.boton && (
        <button
          onClick={onAvanzar}
          disabled={avanzando}
          className={cn(
            "w-full rounded-lg py-2 text-label-sm font-bold transition-all active:scale-95 disabled:opacity-50",
            col.id === "Recibida"
              ? "bg-cafe-intenso text-crema hover:bg-cafe-intenso/90"
              : "bg-verde-menta text-cafe-intenso hover:bg-verde-menta/80",
          )}
        >
          {col.boton}
        </button>
      )}
    </div>
  );
}
