import { useMemo, useState } from "react";
import {
  Money,
  CreditCard,
  DownloadSimple,
  DeviceMobile,
  X,
  ArrowRight,
} from "@phosphor-icons/react";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { SkeletonFila } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { MetodoPago, type ComandaDto } from "@/types/api";
import { useComandasActivas, useCobrarComanda, useCancelarComanda } from "../hooks";
import { useVentas, useResumenVentas } from "@/features/pos/hooks";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";

// Helpers
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

type Tab = "cobrar" | "corte";

// Main
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
      {/* Chips de tab */}
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

// Tab Cobrar
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

// Card de comanda para cobrar — double-bezel
function ComandaCobro({ comanda: c }: { comanda: ComandaDto }) {
  const cobrar = useCobrarComanda();
  const cancelar = useCancelarComanda();
  const toast = useToast();

  const [modoEfectivo, setModoEfectivo] = useState(false);
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

  return (
    /* Outer shell — double-bezel verde menta (lista para cobrar) */
    <div
      className="rounded-[1.25rem] p-[3px] bg-gradient-to-b from-verde-menta/20 to-transparent"
      style={{ boxShadow: "0 2px 16px -4px rgba(43,31,25,0.10), 0 1px 3px -1px rgba(43,31,25,0.06)" }}
    >
      {/* Inner core */}
      <div className="rounded-[calc(1.25rem-3px)] overflow-hidden bg-surface-container-lowest">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-verde-menta/20 text-label-lg font-black text-cafe-intenso">
              #{c.folio}
            </span>
            <div>
              <p className="text-label-md font-bold text-on-surface">
                {c.esParaLlevar ? "Para llevar" : c.mesa}
              </p>
              {c.esParaLlevar && c.nombreCliente && (
                <p className="text-body-sm text-primary-container font-medium">{c.nombreCliente}</p>
              )}
            </div>
          </div>
          <span className="text-headline-sm font-black text-cafe-intenso tabular-nums">
            {formatCurrency(c.total)}
          </span>
        </div>

        {/* Items */}
        <ul className="mx-4 mb-3 flex flex-col gap-1 rounded-xl bg-surface-container/40 px-3 py-2.5">
          {c.items.map((it, i) => (
            <li key={i} className="flex items-start justify-between gap-2 text-body-sm">
              <span className="text-on-surface">
                <span className="font-black text-cafe-intenso">{it.cantidad}x</span> {it.nombre}
                {it.nota && <span className="ml-1 italic text-on-surface-variant">"{it.nota}"</span>}
              </span>
              <span className="shrink-0 tabular-nums text-on-surface-variant">{formatCurrency(it.precioUnitario * it.cantidad)}</span>
            </li>
          ))}
        </ul>

        {/* Acciones */}
        <div className="border-t border-outline-variant/20 px-4 pb-4 pt-3">
          {!modoEfectivo ? (
            <div className="flex flex-col gap-2">
              {/* Metodos de pago */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setModoEfectivo(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-cafe-intenso py-3 text-label-md font-bold text-crema transition-all active:scale-95"
                >
                  <Money weight="light" className="h-4 w-4" /> Efectivo
                </button>
                <button
                  onClick={() => handleCobrar(MetodoPago.Tarjeta)}
                  disabled={cobrar.isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-cafe-intenso py-3 text-label-md font-bold text-crema transition-all active:scale-95 disabled:opacity-50"
                >
                  <CreditCard weight="light" className="h-4 w-4" /> Tarjeta
                </button>
              </div>
              <button
                onClick={() => handleCobrar(MetodoPago.Transferencia)}
                disabled={cobrar.isPending}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant/50 bg-surface-container py-2.5 text-label-md font-semibold text-on-surface transition-all active:scale-95 disabled:opacity-50"
              >
                <DeviceMobile weight="light" className="h-4 w-4" /> Transferencia
              </button>
              <button
                onClick={handleCancelar}
                disabled={cancelar.isPending}
                className="flex items-center justify-center gap-1 py-1.5 text-body-sm font-medium text-error-st transition-colors hover:opacity-80 disabled:opacity-40"
              >
                <X weight="light" className="h-3.5 w-3.5" /> Cancelar comanda
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-label-md font-bold text-on-surface">Pago en efectivo</p>
                <button onClick={() => { setModoEfectivo(false); setRecibido(""); }} className="text-body-sm text-on-surface-variant hover:text-on-surface">
                  Cambiar
                </button>
              </div>

              {/* Sugerencias */}
              <div className="flex flex-wrap gap-2">
                {sugerenciasEfectivo(c.total).map((m) => (
                  <button
                    key={m}
                    onClick={() => setRecibido(String(m))}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-label-md font-semibold transition-colors",
                      recibidoNum === m ? "bg-primary-container text-on-primary" : "bg-surface-container text-on-surface"
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
                  type="number" min="0" inputMode="decimal" placeholder="0" autoFocus
                  className="h-12 w-full rounded-xl border-0 bg-surface-container px-3 text-xl font-bold text-on-surface outline-none ring-2 ring-transparent focus:ring-primary-container/30"
                />
              </div>

              {/* Cambio */}
              <div className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3",
                recibidoNum === 0 ? "bg-surface-container text-on-surface-variant/50"
                  : puedeCobrarEfectivo ? "bg-verde-menta/15 text-cafe-intenso"
                    : "bg-error-container/30 text-error-st"
              )}>
                <span className="text-label-md font-semibold">
                  {recibidoNum === 0 ? "Cambio" : puedeCobrarEfectivo ? "Cambio a devolver" : "Falta"}
                </span>
                <span className="text-headline-sm font-black tabular-nums">
                  {recibidoNum === 0 ? formatCurrency(0) : formatCurrency(Math.abs(cambio))}
                </span>
              </div>

              {/* Cobrar */}
              <button
                onClick={() => handleCobrar(MetodoPago.Efectivo)}
                disabled={!puedeCobrarEfectivo || cobrar.isPending}
                className="group flex items-center justify-between rounded-xl bg-cafe-intenso px-4 py-3 text-crema transition-all active:scale-[0.98] disabled:opacity-40"
              >
                <span className="text-label-md font-bold">{cobrar.isPending ? "Procesando..." : "Cobrar y registrar"}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                  <ArrowRight weight="light" className="h-4 w-4" />
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Tab Corte
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
