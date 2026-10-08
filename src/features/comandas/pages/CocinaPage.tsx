import { useState } from "react";
import { ArrowsClockwise, Clock, Fire, CheckCircle } from "@phosphor-icons/react";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { SkeletonFila } from "@/components/ui";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import { estadoComandaLabel } from "@/lib/enums";
import type { ComandaDto, EstadoComanda } from "@/types/api";
import { useComandasActivas, useAvanzarComanda } from "../hooks";

// ─── Tipos de filtro ──────────────────────────────────────────────────────────

type FiltroChip = "Todos" | "Recibida" | "EnPreparacion" | "Lista";

interface ChipDef {
  id: FiltroChip;
  label: string;
}

const CHIPS: ChipDef[] = [
  { id: "Todos", label: "Todos" },
  { id: "Recibida", label: "Pendiente" },
  { id: "EnPreparacion", label: "Preparando" },
  { id: "Lista", label: "Lista" },
];

// ─── Helpers de tiempo ────────────────────────────────────────────────────────

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

// ─── Mapa de estilos por estado ───────────────────────────────────────────────

interface EstiloEstado {
  outerFrom: string;
  badgeBg: string;
  badgeText: string;
}

const ESTILOS: Record<EstadoComanda, EstiloEstado> = {
  Recibida: {
    outerFrom: "from-[#FFF8E7]/80",
    badgeBg: "bg-caramelo/20",
    badgeText: "text-cafe-intenso",
  },
  EnPreparacion: {
    outerFrom: "from-orange-50/80",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-800",
  },
  Lista: {
    outerFrom: "from-[#E8F5F0]/80",
    badgeBg: "bg-verde-menta/20",
    badgeText: "text-cafe-intenso",
  },
  Entregada: {
    outerFrom: "from-surface-container/40",
    badgeBg: "bg-surface-container",
    badgeText: "text-on-surface-variant",
  },
  Cancelada: {
    outerFrom: "from-error-container/30",
    badgeBg: "bg-error-container",
    badgeText: "text-on-error-container",
  },
};

function textoVacioFiltro(filtro: FiltroChip): string {
  switch (filtro) {
    case "Recibida":
      return "No hay comandas pendientes.";
    case "EnPreparacion":
      return "Nada en preparacion ahora.";
    case "Lista":
      return "Ninguna comanda lista para caja.";
    default:
      return "No hay comandas activas. El sistema actualiza cada 5 segundos.";
  }
}

// ─── Pagina principal ─────────────────────────────────────────────────────────

/** Vista de cocina: chips de filtro + lista vertical de comandas. Mobile-first. */
export function CocinaPage() {
  const { data: comandas, isLoading, isError, refetch, dataUpdatedAt } =
    useComandasActivas();
  const avanzar = useAvanzarComanda();
  const toast = useToast();

  const [filtro, setFiltro] = useState<FiltroChip>("Todos");

  const activas = (comandas ?? []).filter(
    (c) =>
      c.estado === "Recibida" ||
      c.estado === "EnPreparacion" ||
      c.estado === "Lista",
  );

  const listaMostrada =
    filtro === "Todos"
      ? activas
      : activas.filter((c) => c.estado === filtro);

  const ultimaActualizacion =
    dataUpdatedAt > 0
      ? new Date(dataUpdatedAt).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : null;

  async function handleAvanzar(comanda: ComandaDto) {
    try {
      const res = await avanzar.mutateAsync(comanda.id);
      toast.exito(
        `Comanda #${comanda.folio} -> ${estadoComandaLabel[res.nuevoEstado]}`,
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "No se pudo avanzar la comanda.",
      );
    }
  }

  return (
    <PantallaConHeader
      titulo="Cocina"
      subtitulo={
        <p className="flex flex-wrap items-center gap-x-1.5 text-body-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">{activas.length}</span>
          {" "}comanda{activas.length !== 1 ? "s" : ""} activa
          {activas.length !== 1 ? "s" : ""}
          {ultimaActualizacion && (
            <span className="text-on-surface-variant/60">
              &middot; {ultimaActualizacion}
            </span>
          )}
        </p>
      }
      accion={
        <button
          onClick={() => void refetch()}
          aria-label="Actualizar"
          className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <ArrowsClockwise weight="light" className="h-5 w-5" aria-hidden />
        </button>
      }
    >
      {/* ── Chips de filtro ── */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CHIPS.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFiltro(chip.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-label-md font-semibold transition-colors",
              filtro === chip.id
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Estado: cargando ── */}
      {isLoading && (
        <div className="flex flex-col gap-3 mt-4">
          {[1, 2, 3].map((i) => (
            <SkeletonFila key={i} />
          ))}
        </div>
      )}

      {/* ── Estado: error ── */}
      {isError && (
        <div className="mt-4 rounded-2xl bg-error-container/40 p-6 text-center text-body-sm text-on-error-container">
          No se pudieron cargar las comandas.
        </div>
      )}

      {/* ── Estado: vacio ── */}
      {!isLoading && !isError && listaMostrada.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center mt-4">
          <img
            src="/spil.webp"
            alt="Sin comandas"
            className="h-32 w-32 object-contain"
          />
          <div>
            <p className="text-headline-sm font-bold text-cafe-intenso">
              Todo listo
            </p>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {textoVacioFiltro(filtro)}
            </p>
          </div>
        </div>
      )}

      {/* ── Lista vertical de comandas ── */}
      {!isLoading && !isError && listaMostrada.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {listaMostrada.map((comanda) => (
            <ComandaCard
              key={comanda.id}
              comanda={comanda}
              onAvanzar={() => handleAvanzar(comanda)}
              avanzando={avanzar.isPending}
            />
          ))}
        </div>
      )}
    </PantallaConHeader>
  );
}

// ─── ComandaCard premium double-bezel ────────────────────────────────────────

function ComandaCard({
  comanda,
  onAvanzar,
  avanzando,
}: {
  comanda: ComandaDto;
  onAvanzar: () => void;
  avanzando: boolean;
}) {
  const urgente = esUrgente(comanda.creadaEn);
  const tiempo = tiempoTranscurrido(comanda.creadaEn);
  const estilos = ESTILOS[comanda.estado] ?? ESTILOS.Recibida;

  const esLista = comanda.estado === "Lista";
  const esEntregada = comanda.estado === "Entregada";
  const mostrarAccion = !esLista && !esEntregada;

  const ubicacion = comanda.esParaLlevar
    ? comanda.nombreCliente
      ? `Para llevar - ${comanda.nombreCliente}`
      : "Para llevar"
    : comanda.mesa;

  return (
    /* Outer shell — double-bezel */
    <div
      className={cn(
        "rounded-[1.25rem] p-[3px]",
        "bg-gradient-to-b to-transparent",
        estilos.outerFrom,
        "shadow-[0_2px_16px_-4px_rgba(43,31,25,0.12)]",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
      )}
    >
      {/* Inner core */}
      <div className="overflow-hidden rounded-[calc(1.25rem-3px)] bg-surface-container-lowest">

        {/* ── Fila superior ── */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          {/* Izquierda: folio + ubicacion */}
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-black leading-none text-cafe-intenso">
              #{comanda.folio}
            </p>
            <p className="mt-1 truncate text-body-sm font-medium text-on-surface-variant">
              {ubicacion}
            </p>
          </div>

          {/* Derecha: badge estado + tiempo */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-label-sm font-bold",
                estilos.badgeBg,
                estilos.badgeText,
              )}
            >
              {estadoComandaLabel[comanda.estado]}
            </span>
            <span
              className={cn(
                "flex items-center gap-1 text-label-sm font-semibold",
                urgente ? "text-red-500" : "text-on-surface-variant/70",
              )}
            >
              {urgente ? (
                <Fire weight="fill" className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <Clock weight="light" className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              {tiempo}
            </span>
          </div>
        </div>

        {/* ── Divisor ── */}
        <div className="border-t border-outline-variant/20" />

        {/* ── Items ── */}
        <ul className="flex flex-col gap-1.5 bg-surface-container/30 px-4 py-3">
          {comanda.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="shrink-0 font-black text-cafe-intenso text-label-md leading-snug">
                {item.cantidad}x
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-on-surface text-label-md leading-snug">
                  {item.nombre}
                </span>
                {item.nota ? (
                  <p className="mt-0.5 text-body-xs italic text-on-surface-variant">
                    {item.nota}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {/* ── Accion ── */}
        {mostrarAccion ? (
          <div className="px-4 pb-4 pt-3">
            <button
              onClick={onAvanzar}
              disabled={avanzando}
              className={cn(
                "w-full rounded-full py-2.5 text-label-md font-bold transition-all active:scale-[0.98] disabled:opacity-50",
                comanda.estado === "Recibida"
                  ? "border border-caramelo/40 bg-caramelo/20 text-cafe-intenso hover:bg-caramelo/30"
                  : "bg-cafe-intenso text-crema",
              )}
            >
              {comanda.estado === "Recibida" ? "Preparar" : "Marcar como lista"}
            </button>
          </div>
        ) : esLista ? (
          <div className="flex items-center justify-center gap-1.5 px-4 pb-4 pt-3">
            <CheckCircle
              weight="fill"
              className="h-4 w-4 shrink-0 text-verde-menta"
              aria-hidden
            />
            <span className="text-label-sm font-semibold text-on-surface-variant">
              Lista para caja
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
