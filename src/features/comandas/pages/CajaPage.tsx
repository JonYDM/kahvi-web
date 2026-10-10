import { useMemo, useRef, useState } from "react";
import {
  Money,
  CreditCard,
  DownloadSimple,
  DeviceMobile,
  ArrowRight,
  CopySimple,
  CircleNotch,
} from "@phosphor-icons/react";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { SkeletonFila, Drawer } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { MetodoPago, type ComandaDto } from "@/types/api";
import { useComandasActivas, useCobrarComanda, useCancelarComanda } from "../hooks";
import { useVentas, useResumenVentas } from "@/features/pos/hooks";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rangoHoy(): { desde: string; hasta: string } {
  const inicio = new Date(); inicio.setHours(0, 0, 0, 0);
  const fin = new Date(); fin.setHours(23, 59, 59, 999);
  return { desde: inicio.toISOString(), hasta: fin.toISOString() };
}

function sugerenciasEfectivo(total: number): number[] {
  const opciones = new Set<number>();
  for (const d of [20, 50, 100, 200, 500]) {
    const arriba = Math.ceil(total / d) * d;
    if (arriba >= total) opciones.add(arriba);
  }
  return [...opciones].sort((a, b) => a - b).slice(0, 4);
}

function descargarCSV(ventas: ReturnType<typeof useVentas>["data"]) {
  if (!ventas?.length) return;
  const fecha = new Date().toISOString().slice(0, 10);
  const enc = "Folio,Hora,Productos,Metodo,Total\n";
  const filas = ventas.slice()
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
    .map((v) => {
      const hora = new Date(v.fechaHora).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
      const prods = v.lineas.map((l) => `${l.cantidad}x ${l.nombreProducto}`).join(" | ");
      const m = v.metodoPago === MetodoPago.Efectivo ? "Efectivo" : v.metodoPago === MetodoPago.Tarjeta ? "Tarjeta" : "Transferencia";
      return `${v.id.slice(0, 8)},${hora},"${prods}",${m},${v.total}`;
    }).join("\n");
  const blob = new Blob([enc + filas], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `corte-kahvi-${fecha}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// SwipeToConfirm
// ---------------------------------------------------------------------------

interface SwipeToConfirmProps {
  onConfirm: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
}

function SwipeToConfirm({ onConfirm, label, disabled, loading }: SwipeToConfirmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0..1
  const [confirmed, setConfirmed] = useState(false);
  const startXRef = useRef(0);
  const draggingRef = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || loading || confirmed) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || !containerRef.current) return;
    const containerW = containerRef.current.offsetWidth;
    const handleW = 40; // w-10 = 2.5rem = 40px
    const maxTravel = containerW - handleW - 16; // 8px left pad + 8px right pad
    const dx = e.clientX - startXRef.current;
    const clamped = Math.max(0, Math.min(dx, maxTravel));
    setProgress(clamped / maxTravel);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (progress >= 0.8) {
      setProgress(1);
      setConfirmed(true);
      onConfirm();
    } else {
      setProgress(0);
    }
  }

  // Max translate for the handle
  const maxTravel = containerRef.current ? containerRef.current.offsetWidth - 40 - 16 : 0;
  const translateX = progress * maxTravel;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-14 overflow-hidden rounded-2xl bg-surface-container select-none",
        (disabled || confirmed) && "opacity-40 pointer-events-none",
      )}
    >
      {/* Green fill track */}
      <div
        className="absolute inset-y-0 left-0 rounded-2xl bg-verde-menta/30 transition-none"
        style={{ width: `${progress * 100}%` }}
        aria-hidden
      />
      {/* Label */}
      <span className="absolute inset-0 flex items-center justify-center text-label-md text-on-surface-variant pointer-events-none">
        {confirmed ? "Listo" : label}
      </span>
      {/* Handle */}
      <div
        ref={handleRef}
        className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-cafe-intenso text-crema cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${translateX}px) translateY(-50%)`,
          transition: draggingRef.current ? "none" : "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {loading ? (
          <CircleNotch className="h-5 w-5 animate-spin" weight="bold" />
        ) : (
          <ArrowRight className="h-5 w-5" weight="bold" />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type Tab = "cobrar" | "corte";

// ---------------------------------------------------------------------------
// CajaPage
// ---------------------------------------------------------------------------

export function CajaPage() {
  const [tab, setTab] = useState<Tab>("cobrar");
  const { data: comandas = [] } = useComandasActivas();
  const porCobrar = comandas.filter((c) => c.estado === "Lista");

  return (
    <PantallaConHeader
      titulo="Caja"
      subtitulo={
        <p className="text-body-sm text-on-surface-variant">
          {porCobrar.length > 0 ? `${porCobrar.length} lista${porCobrar.length !== 1 ? "s" : ""} para cobrar` : "Sin pendientes"}
        </p>
      }
    >
      {/* Tab chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-4">
        <button
          onClick={() => setTab("cobrar")}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-label-md font-semibold transition-colors",
            tab === "cobrar"
              ? "bg-primary-container text-on-primary"
              : "bg-surface-container text-on-surface-variant",
          )}
        >
          Cobrar {porCobrar.length > 0 && `(${porCobrar.length})`}
        </button>
        <button
          onClick={() => setTab("corte")}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-label-md font-semibold transition-colors",
            tab === "corte"
              ? "bg-primary-container text-on-primary"
              : "bg-surface-container text-on-surface-variant",
          )}
        >
          Corte del dia
        </button>
      </div>

      {tab === "cobrar" ? <Cobrar porCobrar={porCobrar} /> : <Corte />}
    </PantallaConHeader>
  );
}

// ---------------------------------------------------------------------------
// Tab Cobrar
// ---------------------------------------------------------------------------

function Cobrar({ porCobrar }: { porCobrar: ComandaDto[] }) {
  if (porCobrar.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <img src="/spil.webp" alt="" aria-hidden className="h-36 w-36 object-contain" />
        <p className="mt-4 text-label-lg font-bold text-on-surface">Sin pedidos por cobrar</p>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Cuando cocina marque un pedido como listo, aparecera aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {porCobrar.map((c) => <ComandaCobro key={c.id} comanda={c} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComandaCobro — compact card + payment drawers
// ---------------------------------------------------------------------------

function ComandaCobro({ comanda: c }: { comanda: ComandaDto }) {
  const cobrar = useCobrarComanda();
  const cancelar = useCancelarComanda();
  const toast = useToast();

  // Drawer open states
  const [drawerEfectivo, setDrawerEfectivo] = useState(false);
  const [drawerTarjeta, setDrawerTarjeta] = useState(false);
  const [drawerTransfer, setDrawerTransfer] = useState(false);

  // Cash payment state
  const [recibido, setRecibido] = useState("");
  const recibidoNum = parseFloat(recibido) || 0;
  const cambio = recibidoNum - c.total;
  const puedeCobrarEfectivo = recibidoNum >= c.total;

  async function handleCobrar(metodo: MetodoPago) {
    try {
      await cobrar.mutateAsync({
        id: c.id,
        data: { metodoPago: metodo, montoRecibido: metodo === MetodoPago.Efectivo ? recibidoNum || undefined : undefined },
      });
      toast.exito(`Comanda #${c.folio} cobrada`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cobrar.");
    }
  }

  async function handleCancelar() {
    try {
      await cancelar.mutateAsync(c.id);
      toast.exito(`Comanda #${c.folio} cancelada`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cancelar.");
    }
  }

  function closeEfectivo() {
    setDrawerEfectivo(false);
    setRecibido("");
  }

  return (
    <>
      {/* ---- Compact card ---- */}
      <div
        className="rounded-[1.25rem] p-[3px] bg-gradient-to-b from-verde-menta/20 to-transparent"
        style={{ boxShadow: "0 2px 16px -4px rgba(43,31,25,0.10), 0 1px 3px -1px rgba(43,31,25,0.06)" }}
      >
        <div className="rounded-[calc(1.25rem-3px)] overflow-hidden bg-surface-container-lowest">

          {/* Header — compact */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-baseline gap-2">
              <span className="text-label-lg font-black text-cafe-intenso">#{c.folio}</span>
              <span className="text-body-sm text-on-surface-variant">
                {c.esParaLlevar ? (c.nombreCliente ? c.nombreCliente : "Para llevar") : c.mesa}
              </span>
            </div>
            <span className="text-headline-sm font-black text-primary-container tabular-nums">
              {formatCurrency(c.total)}
            </span>
          </div>

          {/* Auditoria — mesero + hora */}
          <div className="flex items-center gap-1.5 px-4 pb-2">
            <span className="text-[10px] text-on-surface-variant/50">por</span>
            <span className="text-[10px] font-semibold text-on-surface-variant">{c.meseroNombre}</span>
            <span className="text-[10px] text-on-surface-variant/30">·</span>
            <span className="text-[10px] text-on-surface-variant/50">
              {new Date(c.creadaEn).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Items — compact, no extra background */}
          <ul className="px-4 pb-2 flex flex-col gap-0.5">
            {c.items.map((it, i) => (
              <li key={i} className="text-body-sm text-on-surface leading-snug">
                <span className="font-bold text-cafe-intenso">{it.cantidad}x</span> {it.nombre}
                {it.nota && <span className="ml-1 text-[0.7rem] italic text-on-surface-variant">"{it.nota}"</span>}
              </li>
            ))}
          </ul>

          {/* Actions — 3 buttons in one row */}
          <div className="border-t border-outline-variant/20 px-4 pb-3 pt-2.5">
            <div className="flex gap-2">
              <button
                onClick={() => setDrawerEfectivo(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cafe-intenso py-2.5 text-label-sm font-bold text-crema transition-all active:scale-95"
              >
                <Money weight="light" className="h-4 w-4 shrink-0" /> Efectivo
              </button>
              <button
                onClick={() => setDrawerTarjeta(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cafe-intenso py-2.5 text-label-sm font-bold text-crema transition-all active:scale-95"
              >
                <CreditCard weight="light" className="h-4 w-4 shrink-0" /> Tarjeta
              </button>
              <button
                onClick={() => setDrawerTransfer(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-outline-variant/50 bg-surface-container py-2.5 text-label-sm font-semibold text-on-surface transition-all active:scale-95"
              >
                <DeviceMobile weight="light" className="h-4 w-4 shrink-0" /> Transfer
              </button>
            </div>
            {/* Cancel — small text below */}
            <button
              onClick={handleCancelar}
              disabled={cancelar.isPending}
              className="text-body-sm text-error-st/60 hover:text-error-st mt-1 w-full py-1 disabled:opacity-40"
            >
              Cancelar comanda
            </button>
          </div>
        </div>
      </div>

      {/* ---- Drawer: Efectivo ---- */}
      <Drawer
        open={drawerEfectivo}
        onClose={closeEfectivo}
        title="Pago en efectivo"
        descripcion={`Comanda #${c.folio} - Total: ${formatCurrency(c.total)}`}
      >
        <div className="flex flex-col gap-4 pt-3">
          {/* Monto grande */}
          <p className="text-center text-4xl font-black text-cafe-intenso tabular-nums">
            {formatCurrency(c.total)}
          </p>

          {/* Sugerencias de billetes */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sugerenciasEfectivo(c.total).map((m) => (
              <button
                key={m}
                onClick={() => setRecibido(String(m))}
                className={cn(
                  "shrink-0 rounded-xl px-3 py-1.5 text-label-md font-semibold transition-colors",
                  recibidoNum === m
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container text-on-surface",
                )}
              >
                {formatCurrency(m)}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant/60">
              Con cuanto paga
            </label>
            <input
              value={recibido}
              onChange={(e) => setRecibido(e.target.value)}
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="0"
              autoFocus
              className="h-12 w-full rounded-xl border-0 bg-white/70 px-3 text-xl font-bold text-on-surface outline-none ring-2 ring-cafe-intenso/15 focus:ring-cafe-intenso/30"
            />
          </div>

          {/* Cambio panel */}
          <div
            className={cn(
              "flex items-center justify-between rounded-xl px-4 py-3",
              recibidoNum === 0
                ? "bg-surface-container text-on-surface-variant/50"
                : puedeCobrarEfectivo
                  ? "bg-verde-menta/15 text-cafe-intenso"
                  : "bg-error-container/30 text-error-st",
            )}
          >
            <span className="text-label-md font-semibold">
              {recibidoNum === 0 ? "Cambio" : puedeCobrarEfectivo ? "Cambio a devolver" : "Falta"}
            </span>
            <span className="text-headline-sm font-black tabular-nums">
              {recibidoNum === 0 ? formatCurrency(0) : formatCurrency(Math.abs(cambio))}
            </span>
          </div>

          {/* SwipeToConfirm */}
          <SwipeToConfirm
            onConfirm={() => { void handleCobrar(MetodoPago.Efectivo); }}
            label="Desliza -> para cobrar"
            disabled={!puedeCobrarEfectivo}
            loading={cobrar.isPending}
          />
        </div>
      </Drawer>

      {/* ---- Drawer: Tarjeta ---- */}
      <Drawer
        open={drawerTarjeta}
        onClose={() => setDrawerTarjeta(false)}
        title="Pago con tarjeta"
        descripcion={`Comanda #${c.folio}`}
      >
        <div className="flex flex-col items-center gap-5 pt-3">
          {/* Monto grande */}
          <p className="text-4xl font-black text-cafe-intenso tabular-nums">
            {formatCurrency(c.total)}
          </p>

          {/* Instruccion + icono */}
          <div className="flex flex-col items-center gap-3 text-center">
            <CreditCard weight="thin" className="h-16 w-16 text-cafe-intenso/40" />
            <p className="text-body-md text-on-surface-variant">
              Pasa la tarjeta en la terminal y espera la confirmacion
            </p>
          </div>

          {/* SwipeToConfirm */}
          <div className="w-full">
            <SwipeToConfirm
              onConfirm={() => { void handleCobrar(MetodoPago.Tarjeta); }}
              label="Desliza -> cuando se apruebe en terminal"
              loading={cobrar.isPending}
            />
          </div>
        </div>
      </Drawer>

      {/* ---- Drawer: Transferencia ---- */}
      <Drawer
        open={drawerTransfer}
        onClose={() => setDrawerTransfer(false)}
        title="Transferencia bancaria"
        descripcion={`Comanda #${c.folio}`}
      >
        <div className="flex flex-col gap-4 pt-3">
          {/* Monto grande */}
          <p className="text-center text-4xl font-black text-cafe-intenso tabular-nums">
            {formatCurrency(c.total)}
          </p>

          {/* Datos de cuenta */}
          <div className="flex flex-col gap-2 rounded-2xl bg-surface-container px-4 py-3">
            <CuentaDato label="Nombre" valor="Kahvi Demo" />
            <CuentaDato label="CLABE" valor="012345678901234567" />
          </div>

          {/* Instruccion */}
          <p className="text-center text-body-sm italic text-on-surface-variant">
            Espera a que el cliente confirme la transferencia
          </p>

          {/* SwipeToConfirm */}
          <SwipeToConfirm
            onConfirm={() => { void handleCobrar(MetodoPago.Transferencia); }}
            label="Desliza -> cuando se reciba el pago"
            loading={cobrar.isPending}
          />
        </div>
      </Drawer>
    </>
  );
}

// ---------------------------------------------------------------------------
// CuentaDato — fila copiable para transferencia
// ---------------------------------------------------------------------------

function CuentaDato({ label, valor }: { label: string; valor: string }) {
  const toast = useToast();

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      toast.exito("Copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant/60">{label}</p>
        <p className="text-label-md font-bold text-on-surface tabular-nums truncate">{valor}</p>
      </div>
      <button
        onClick={() => { void copiar(); }}
        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface active:scale-95"
        aria-label={`Copiar ${label}`}
      >
        <CopySimple weight="light" className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab Corte
// ---------------------------------------------------------------------------

function Corte() {
  const { desde, hasta } = rangoHoy();
  const { data: ventas, isLoading } = useVentas(desde, hasta);
  const { data: resumen } = useResumenVentas(desde, hasta);

  const ventasOrdenadas = useMemo(
    () => (ventas ?? []).slice().sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()),
    [ventas],
  );

  const metodoLabel = (m: MetodoPago) =>
    m === MetodoPago.Efectivo ? "Efectivo" : m === MetodoPago.Tarjeta ? "Tarjeta" : "Transferencia";

  const metodoIcon = (m: MetodoPago) =>
    m === MetodoPago.Efectivo ? Money : m === MetodoPago.Tarjeta ? CreditCard : DeviceMobile;

  return (
    <div className="flex flex-col gap-6">
      {/* Tarjeta total */}
      <div
        className="rounded-3xl bg-cafe-intenso p-6 text-crema"
        style={{ boxShadow: "0 8px 32px -8px rgba(43,31,25,0.35)" }}
      >
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-crema/60">Vendido hoy</p>
        <p className="mt-1 text-4xl font-black tracking-[-0.02em] break-all">{formatCurrency(resumen?.total ?? 0)}</p>
        <p className="mt-1 text-body-sm text-crema/50">{resumen?.numeroVentas ?? 0} ventas</p>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-crema/15 pt-4">
          {[
            { label: "Efectivo", valor: resumen?.efectivo ?? 0 },
            { label: "Tarjeta", valor: resumen?.tarjeta ?? 0 },
            { label: "Transfer.", valor: resumen?.transferencia ?? 0 },
          ].map(({ label, valor }) => (
            <div key={label}>
              <p className="text-[10px] text-crema/55">{label}</p>
              <p className="mt-0.5 text-label-lg font-bold text-crema">{formatCurrency(valor)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de ventas */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-label-lg font-bold text-on-surface">Ventas de hoy</h2>
          <button
            onClick={() => descargarCSV(ventas)}
            disabled={!ventas?.length}
            className="flex items-center gap-1.5 rounded-full border border-outline-variant/50 bg-surface-container-lowest px-3 py-1.5 text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container disabled:opacity-40"
          >
            <DownloadSimple weight="light" className="h-3.5 w-3.5" /> Exportar
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">{[1, 2, 3].map((i) => <SkeletonFila key={i} />)}</div>
        ) : ventasOrdenadas.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-8 text-center shadow-soft">
            <p className="text-body-sm text-on-surface-variant">Aun no hay ventas hoy.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {ventasOrdenadas.map((v) => {
              const Icon = metodoIcon(v.metodoPago);
              return (
                <li
                  key={v.id}
                  className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-soft overflow-hidden"
                >
                  {/* Fila principal */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-container/10">
                      <Icon weight="light" className="h-4 w-4 text-primary-container" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-label-md font-semibold text-on-surface">{metodoLabel(v.metodoPago)}</p>
                      <p className="text-body-sm text-on-surface-variant">{formatDateTime(v.fechaHora)}</p>
                    </div>
                    <span className="shrink-0 text-label-lg font-bold text-primary-container tabular-nums">
                      {formatCurrency(v.total)}
                    </span>
                  </div>
                  {/* Items */}
                  <div className="border-t border-outline-variant/15 bg-surface-container/30 px-4 py-2">
                    {v.lineas.map((l, i) => (
                      <div key={i} className="flex justify-between text-body-sm text-on-surface-variant">
                        <span>{l.cantidad}x {l.nombreProducto}</span>
                        <span className="tabular-nums">{formatCurrency(l.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
