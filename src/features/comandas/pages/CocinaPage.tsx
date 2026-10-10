import { useState, useRef, useEffect } from "react";
import { ArrowsClockwise, Clock, Fire, CheckCircle } from "@phosphor-icons/react";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { Drawer, SkeletonFila } from "@/components/ui";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import { estadoComandaLabel } from "@/lib/enums";
import type { ComandaDto, EstadoComanda } from "@/types/api";
import { useComandasActivas, useAvanzarComanda } from "../hooks";

// ─── Tipos de filtro ──────────────────────────────────────────────────────────

type FiltroChip = "Recibida" | "EnPreparacion" | "Lista" | "Cancelada";

interface ChipDef {
  id: FiltroChip;
  label: string;
}

const CHIPS: ChipDef[] = [
  { id: "Recibida", label: "Pendiente" },
  { id: "EnPreparacion", label: "Preparando" },
  { id: "Lista", label: "Lista" },
  { id: "Cancelada", label: "Canceladas" },
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
    outerFrom: "from-surface-container/60",
    badgeBg: "bg-error-container/60",
    badgeText: "text-error-st",
  },
};

function textoVacioFiltro(filtro: FiltroChip): string {
  switch (filtro) {
    case "Recibida": return "No hay comandas pendientes.";
    case "EnPreparacion": return "Nada en preparacion ahora.";
    case "Lista": return "Ninguna comanda lista para caja.";
    case "Cancelada": return "Sin cancelaciones recientes.";
    default: return "No hay comandas activas.";
  }
}

// ─── Pagina principal ─────────────────────────────────────────────────────────

/** Vista de cocina: chips de filtro + lista vertical de comandas. Mobile-first. */
export function CocinaPage() {
  const { data: comandas, isLoading, isError, refetch, dataUpdatedAt } =
    useComandasActivas();
  const avanzar = useAvanzarComanda();
  const toast = useToast();

  const [filtro, setFiltro] = useState<FiltroChip>("Recibida");
  const [banner, setBanner] = useState<number>(0); // cuantas nuevas comandas
  const idsAnteriores = useRef<Set<string>>(new Set());

  // Detectar nuevas comandas Recibidas y mostrar banner + sonido
  useEffect(() => {
    if (!comandas) return;
    const nuevas = comandas.filter(
      (c) => c.estado === "Recibida" && !idsAnteriores.current.has(c.id),
    );
    if (nuevas.length > 0) {
      setBanner(nuevas.length);
      // Sonido corto con AudioContext — sin dependencias externas
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        osc.onended = () => ctx.close();
      } catch { /* AudioContext no disponible */ }
      // Auto-ocultar el banner tras 4s
      setTimeout(() => setBanner(0), 4000);
    }
    // Actualizar el set de ids conocidos
    const nuevosIds = new Set<string>(comandas.map((c) => c.id));
    idsAnteriores.current = nuevosIds;
  }, [comandas]);

  const activas = (comandas ?? [])
    .filter((c) =>
      c.estado === "Recibida" ||
      c.estado === "EnPreparacion" ||
      c.estado === "Lista",
    )
    .sort((a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime());

  // Canceladas recientes (ultimos 2 min) — para avisar al cocinero
  const canceladasRecientes = (comandas ?? []).filter((c) => {
    if (c.estado !== "Cancelada") return false;
    const min = (Date.now() - new Date(c.creadaEn).getTime()) / 60000;
    return min < 2;
  });

  const listaMostrada =
    filtro === "Cancelada"
      ? canceladasRecientes
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
      {/* ── Notificacion estilo iOS — baja desde arriba ── */}
      {banner > 0 && (
        <div
          className="fixed inset-x-0 top-0 z-50 flex justify-center"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)" }}
        >
          <div
            className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl shadow-[0_8px_32px_-8px_rgba(43,31,25,0.30)]"
            style={{
              background: "rgba(43,31,25,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              animation: "slideDown 0.4s cubic-bezier(0.32,0.72,0,1) forwards",
            }}
          >
            <style>{`
              @keyframes slideDown {
                from { transform: translateY(-110%); opacity: 0; }
                to   { transform: translateY(0);     opacity: 1; }
              }
            `}</style>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-caramelo/20 text-label-lg font-black text-caramelo">
                {banner}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-label-md font-bold text-crema">
                  Nuevo{banner !== 1 ? "s" : ""} pedido{banner !== 1 ? "s" : ""}
                </p>
                <p className="text-body-sm text-crema/60">
                  {banner === 1 ? "Una comanda llego a cocina" : `${banner} comandas llegaron`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Chips de filtro — solo en mobile ── */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
        {CHIPS.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFiltro(chip.id)}
            className={cn(
              "relative shrink-0 rounded-full px-3.5 py-1.5 text-label-md font-semibold transition-colors",
              filtro === chip.id
                ? chip.id === "Cancelada"
                  ? "bg-error-st text-white"
                  : "bg-primary-container text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            {chip.label}
            {chip.id === "Cancelada" && canceladasRecientes.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-st px-0.5 text-[9px] font-black text-white">
                {canceladasRecientes.length}
              </span>
            )}
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

      {/* ── Lista mobile / Kanban desktop ── */}
      {!isLoading && !isError && (activas.length > 0 || canceladasRecientes.length > 0) && (
        <>
          {/* MOBILE: lista vertical filtrada por chip */}
          <div className="mt-4 flex flex-col gap-3 md:hidden">
            {listaMostrada.map((comanda) => (
              <ComandaCard
                key={comanda.id}
                comanda={comanda}
                onAvanzar={() => handleAvanzar(comanda)}
                avanzando={avanzar.isPending}
              />
            ))}
            {listaMostrada.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <img src="/spil.webp" alt="" className="h-28 w-28 object-contain" />
                <p className="text-body-md text-on-surface-variant">{textoVacioFiltro(filtro)}</p>
              </div>
            )}
          </div>

          {/* TABLET/DESKTOP: Kanban 3 columnas */}
          <div
            className="mt-4 hidden md:grid md:grid-cols-3 md:gap-4"
            style={{ width: "90vw", marginLeft: "calc((90vw - 100%) / -2)", paddingLeft: "1rem", paddingRight: "1rem" }}
          >
            {(["Recibida", "EnPreparacion", "Lista"] as const).map((estado) => {
              const cols = estado === "Lista"
                ? activas.filter((c) => c.estado === "Lista")
                : activas.filter((c) => c.estado === estado);
              const labelCol = estado === "Recibida" ? "Pendiente" : estado === "EnPreparacion" ? "Preparando" : "Lista";
              const colorHeader = estado === "Recibida"
                ? "bg-caramelo/20 text-cafe-intenso"
                : estado === "EnPreparacion"
                  ? "bg-orange-100 text-orange-800"
                  : "bg-verde-menta/20 text-cafe-intenso";
              return (
                <div key={estado} className="flex flex-col gap-3">
                  {/* Header columna */}
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-3 py-1 text-label-sm font-bold", colorHeader)}>
                      {labelCol}
                    </span>
                    <span className="text-label-sm text-on-surface-variant/60">{cols.length}</span>
                  </div>
                  {/* Cards */}
                  {cols.map((comanda) => (
                    <ComandaCard
                      key={comanda.id}
                      comanda={comanda}
                      onAvanzar={() => handleAvanzar(comanda)}
                      avanzando={avanzar.isPending}
                    />
                  ))}
                  {cols.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-outline-variant/30 py-8 text-center">
                      <p className="text-body-sm text-on-surface-variant/40">Sin comandas</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state global — cuando no hay nada activo */}
      {!isLoading && !isError && activas.length === 0 && canceladasRecientes.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center mt-4">
          <img src="/spil.webp" alt="" className="h-32 w-32 object-contain" />
          <p className="text-headline-sm font-bold text-cafe-intenso">Todo listo</p>
          <p className="text-body-md text-on-surface-variant">Sin comandas activas. Actualiza cada 5s.</p>
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
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  const MAX_VISIBLE = 4;
  const itemsVisibles = comanda.items.slice(0, MAX_VISIBLE);
  const hayMas = comanda.items.length > MAX_VISIBLE;
  const tieneNotas = comanda.items.some((it) => it.nota);

  return (
    <>
      {/* Outer shell — double-bezel */}
      <div
        className={cn(
          "rounded-[1.25rem] p-[3px]",
          "bg-gradient-to-b to-transparent",
          estilos.outerFrom,
          "shadow-[0_2px_16px_-4px_rgba(43,31,25,0.12)]",
          "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          comanda.estado === "Cancelada" && "opacity-60 grayscale",
        )}
      >
        <div className="overflow-hidden rounded-[calc(1.25rem-3px)] bg-surface-container-lowest">

          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
            <div className="min-w-0 flex-1 flex flex-col gap-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant/50">No. Comanda</span>
                <span className="text-xl font-black leading-none text-cafe-intenso">{comanda.folio}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant/50">
                  {comanda.esParaLlevar ? "Para" : "Mesa"}
                </span>
                <span className="text-label-md font-semibold text-on-surface truncate">
                  {comanda.esParaLlevar ? (comanda.nombreCliente ?? "llevar") : comanda.mesa}
                </span>
              </div>
            </div>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", estilos.badgeBg, estilos.badgeText)}>
              {estadoComandaLabel[comanda.estado]}
            </span>
          </div>

          <div className="border-t border-outline-variant/20" />

          {/* Items — 2 por fila */}
          <div className="bg-surface-container/30 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant/50">Pedido</p>
              <span className={cn("flex items-center gap-1 text-[10px] font-semibold",
                urgente ? "text-red-500" : "text-on-surface-variant/60",
              )}>
                {urgente ? <Fire weight="fill" className="h-3 w-3" /> : <Clock weight="light" className="h-3 w-3" />}
                {tiempo}
              </span>
            </div>

            {/* Grid 2 columnas — cantidad circular + nombre, sin bordes */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {itemsVisibles.map((item, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-2",
                  comanda.estado === "Cancelada" && "opacity-50",
                )}>
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-md font-black mt-0.5",
                    comanda.estado === "Cancelada"
                      ? "bg-surface-container text-on-surface-variant"
                      : "bg-cafe-intenso text-crema",
                  )}>
                    {item.cantidad}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-[0.9rem] font-bold leading-snug text-cafe-intenso",
                      comanda.estado === "Cancelada" && "line-through text-on-surface-variant",
                    )}>
                      {item.nombre}
                    </p>
                    {item.nota && (
                      <p className="text-[10px] italic text-primary-container truncate">"{item.nota}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Sin notas o ver mas */}
            <div className="mt-1.5 flex items-center justify-between">
              {!tieneNotas ? (
                <p className="text-[10px] text-on-surface-variant/35 italic">Sin notas</p>
              ) : <div />}
              {hayMas && (
                <button
                  onClick={() => setDrawerAbierto(true)}
                  className="text-[10px] font-semibold text-primary-container hover:underline"
                >
                  +{comanda.items.length - MAX_VISIBLE} mas...
                </button>
              )}
            </div>
          </div>

          {/* Accion */}
          {!esLista && comanda.estado !== "Entregada" ? (
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
              <CheckCircle weight="fill" className="h-4 w-4 shrink-0 text-verde-menta" />
              <span className="text-label-sm font-semibold text-on-surface-variant">Lista para caja</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Drawer de detalles completos */}
      <Drawer
        open={drawerAbierto}
        onClose={() => setDrawerAbierto(false)}
        title={`Comanda #${comanda.folio}`}
        descripcion={comanda.esParaLlevar ? "Para llevar" : `Mesa ${comanda.mesa}`}
      >
        <div className="flex flex-col gap-3 pt-2">
          {comanda.items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3 shadow-soft">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-container text-label-lg font-black text-cafe-intenso">
                {item.cantidad}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-lg font-bold text-on-surface">{item.nombre}</p>
                {item.nota ? (
                  <p className="mt-0.5 text-body-sm italic text-primary-container">"{item.nota}"</p>
                ) : (
                  <p className="mt-0.5 text-body-sm text-on-surface-variant/40 italic">Sin nota</p>
                )}
              </div>
            </div>
          ))}
          {/* Boton accion dentro del drawer */}
          {!esLista && comanda.estado !== "Entregada" && comanda.estado !== "Cancelada" && (
            <button
              onClick={() => { onAvanzar(); setDrawerAbierto(false); }}
              disabled={avanzando}
              className={cn(
                "mt-2 w-full rounded-full py-3 text-label-md font-bold transition-all active:scale-[0.98] disabled:opacity-50",
                comanda.estado === "Recibida"
                  ? "border border-caramelo/40 bg-caramelo/20 text-cafe-intenso"
                  : "bg-cafe-intenso text-crema",
              )}
            >
              {comanda.estado === "Recibida" ? "Preparar" : "Marcar como lista"}
            </button>
          )}
        </div>
      </Drawer>
    </>
  );
}


