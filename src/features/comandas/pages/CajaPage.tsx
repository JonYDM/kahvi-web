import { useMemo, useState } from "react";
import {
  Money,
  Check,
  CreditCard,
  DownloadSimple,
  ChartPie,
  Receipt,
  DeviceMobile,
  XCircle,
} from "@phosphor-icons/react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { MetodoPago, type ComandaDto } from "@/types/api";
import { useComandasActivas, useCobrarComanda, useCancelarComanda } from "../hooks";
import { useVentas, useResumenVentas } from "@/features/pos/hooks";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Tab = "cobrar" | "corte";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function rangoHoy(): { desde: string; hasta: string } {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);
  return { desde: inicio.toISOString(), hasta: fin.toISOString() };
}

/** Redondea hacia arriba a los billetes/monedas comunes para sugerencias. */
function sugerenciasEfectivo(total: number): number[] {
  const opciones = new Set<number>();
  const denominaciones = [20, 50, 100, 200, 500];
  for (const d of denominaciones) {
    const arriba = Math.ceil(total / d) * d;
    if (arriba >= total) opciones.add(arriba);
  }
  return [...opciones].sort((a, b) => a - b).slice(0, 4);
}

function descargarCSV(ventas: ReturnType<typeof useVentas>["data"]) {
  if (!ventas || ventas.length === 0) return;
  const fecha = new Date().toISOString().slice(0, 10);
  const encabezado = "Folio,Hora,Productos,Método,Total\n";
  const filas = ventas
    .slice()
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
    .map((v) => {
      const hora = new Date(v.fechaHora).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const productos = v.lineas
        .map((l) => `${l.cantidad}x ${l.nombreProducto}`)
        .join(" | ");
      const metodo =
        v.metodoPago === MetodoPago.Efectivo
          ? "Efectivo"
          : v.metodoPago === MetodoPago.Tarjeta
            ? "Tarjeta"
            : "Transferencia";
      return `${v.id.slice(0, 8)},${hora},"${productos}",${metodo},${v.total}`;
    })
    .join("\n");
  const blob = new Blob([encabezado + filas], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `corte-kahvi-${fecha}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function CajaPage() {
  const [tab, setTab] = useState<Tab>("cobrar");
  const [toast, setToast] = useState<string | null>(null);

  const { data: comandas = [] } = useComandasActivas();
  const porCobrar = comandas.filter((c) => c.estado === "Lista");

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="min-h-screen bg-crema pb-10">
      {/* Header con tabs */}
      <header className="sticky top-0 z-20 bg-crema/90 backdrop-blur-sm px-4 py-3 shadow-[0_1px_0_0_rgba(43,31,25,0.08)]">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-1 rounded-full bg-white/60 p-1">
            <TabBtn
              activo={tab === "cobrar"}
              onClick={() => setTab("cobrar")}
              icon={Money}
              label="Cobrar"
              badge={porCobrar.length}
            />
            <TabBtn
              activo={tab === "corte"}
              onClick={() => setTab("corte")}
              icon={ChartPie}
              label="Corte"
            />
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-cafe-intenso px-5 py-3 text-sm font-medium text-crema shadow-xl">
            <Check weight='light' className="h-4 w-4 text-verde-menta" /> {toast}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {tab === "cobrar" ? (
          <Cobrar porCobrar={porCobrar} onToast={mostrarToast} />
        ) : (
          <Corte />
        )}
      </main>
    </div>
  );
}

// â”€â”€â”€ Tab button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TabBtn({
  activo,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  activo: boolean;
  onClick: () => void;
  icon: typeof Money;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
        activo ? "bg-cafe-intenso text-crema shadow-sm" : "text-cafe-intenso/60 hover:text-cafe-intenso"
      }`}
    >
      <Icon weight='light' className="h-4 w-4" /> {label}
      {typeof badge === "number" && badge > 0 && (
        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
            activo ? "bg-crema text-cafe-intenso" : "bg-verde-menta text-cafe-intenso"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// â”€â”€â”€ Cobrar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Cobrar({
  porCobrar,
  onToast,
}: {
  porCobrar: ComandaDto[];
  onToast: (msg: string) => void;
}) {
  if (porCobrar.length === 0) {
    return (
      <div className="flex flex-col items-center py-28 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-cafe-principal/20 text-cafe-intenso/40">
          <Receipt weight='light' className="h-10 w-10" />
        </span>
        <p className="mt-5 text-lg text-cafe-intenso/60">No hay pedidos por cobrar.</p>
        <p className="text-sm text-cafe-intenso/40">
          Cuando cocina marque un pedido como listo, aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {porCobrar.map((c) => (
        <ComandaCobro key={c.id} comanda={c} onToast={onToast} />
      ))}
    </div>
  );
}

// â”€â”€â”€ Tarjeta de comanda con UX de cobro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ComandaCobro({
  comanda: c,
  onToast,
}: {
  comanda: ComandaDto;
  onToast: (msg: string) => void;
}) {
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
        data: {
          metodoPago: metodo,
          montoRecibido: metodo === MetodoPago.Efectivo ? recibidoNum || undefined : undefined,
        },
      });
      onToast(`Venta #${c.folio} registrada`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cobrar.");
    }
  }

  async function handleCancelar() {
    try {
      await cancelar.mutateAsync(c.id);
      onToast(`Comanda #${c.folio} cancelada`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cancelar.");
    }
  }

  return (
    <div className="rounded-3xl border border-verde-menta/30 bg-white/70 p-5 shadow-sm">
      {/* Header de comanda */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-cafe-intenso">#{c.folio}</span>
        <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-cafe-intenso">
          {c.esParaLlevar
            ? c.nombreCliente
              ? `Para llevar \u00B7 ${c.nombreCliente}`
              : "Para llevar"
            : c.mesa}
        </span>
      </div>

      {/* Items */}
      <ul className="mt-3 space-y-1 border-t border-cafe-intenso/10 pt-3 text-sm text-cafe-intenso/80">
        {c.items.map((it, i) => (
          <li key={i} className="flex justify-between">
            <span>
              {it.cantidad}x {it.nombre}
            </span>
            <span>{formatCurrency(it.precioUnitario * it.cantidad)}</span>
          </li>
        ))}
      </ul>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between border-t border-cafe-intenso/10 pt-3">
        <span className="text-sm text-cafe-intenso/60">Total</span>
        <span className="shrink-0 text-xl font-bold text-cafe-intenso tabular-nums">{formatCurrency(c.total)}</span>
      </div>

      {/* Acciones */}
      {!modoEfectivo ? (
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setModoEfectivo(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-cafe-intenso py-3 text-sm font-semibold text-crema transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Money weight='light' className="h-4 w-4" /> Efectivo
            </button>
            <button
              onClick={() => handleCobrar(MetodoPago.Tarjeta)}
              disabled={cobrar.isPending}
              className="flex items-center justify-center gap-2 rounded-xl bg-cafe-intenso py-3 text-sm font-semibold text-crema transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <CreditCard weight='light' className="h-4 w-4" /> Tarjeta
            </button>
          </div>
          <button
            onClick={() => handleCobrar(MetodoPago.Transferencia)}
            disabled={cobrar.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-cafe-intenso/20 py-2.5 text-sm font-semibold text-cafe-intenso transition-colors hover:bg-cafe-principal/10 disabled:opacity-50"
          >
            <DeviceMobile weight='light' className="h-4 w-4" /> Transferencia
          </button>
          <button
            onClick={handleCancelar}
            disabled={cancelar.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          >
            <XCircle weight='light' className="h-3.5 w-3.5" /> Cancelar comanda
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-crema/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-cafe-intenso">Pago en efectivo</p>
            <button
              onClick={() => {
                setModoEfectivo(false);
                setRecibido("");
              }}
              className="text-xs text-cafe-intenso/50 hover:text-cafe-intenso"
            >
              Cambiar método
            </button>
          </div>

          {/* Sugerencias de billetes */}
          <div className="mt-3 flex flex-wrap gap-2">
            {sugerenciasEfectivo(c.total).map((m) => (
              <button
                key={m}
                onClick={() => setRecibido(String(m))}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  recibidoNum === m
                    ? "bg-verde-menta text-crema"
                    : "bg-white text-cafe-intenso hover:bg-cafe-principal/20"
                }`}
              >
                {formatCurrency(m)}
              </button>
            ))}
          </div>

          {/* Input monto recibido */}
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cafe-intenso/50">
              Con cuánto paga
            </span>
            <input
              value={recibido}
              onChange={(e) => setRecibido(e.target.value)}
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="0"
              autoFocus
              className="w-full rounded-xl border border-cafe-intenso/10 bg-white px-3 py-2.5 text-lg font-semibold text-cafe-intenso outline-none focus:border-verde-menta"
            />
          </label>

          {/* Cambio */}
          <div
            className={`mt-3 flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
              recibidoNum === 0
                ? "bg-white/60 text-cafe-intenso/40"
                : puedeCobrarEfectivo
                  ? "bg-verde-menta/15 text-cafe-intenso"
                  : "bg-red-50 text-red-600"
            }`}
          >
            <span className="text-sm font-medium">
              {recibidoNum === 0
                ? "Cambio"
                : puedeCobrarEfectivo
                  ? "Cambio a devolver"
                  : "Falta"}
            </span>
            <span className="text-xl font-bold">
              {recibidoNum === 0 ? formatCurrency(0) : formatCurrency(Math.abs(cambio))}
            </span>
          </div>

          <button
            onClick={() => handleCobrar(MetodoPago.Efectivo)}
            disabled={!puedeCobrarEfectivo || cobrar.isPending}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-verde-menta py-3 text-sm font-semibold text-crema shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check weight='light' className="h-4 w-4" /> Cobrar y registrar
          </button>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Corte â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Corte() {
  const { desde, hasta } = rangoHoy();
  const { data: ventas, isLoading } = useVentas(desde, hasta);
  const { data: resumen } = useResumenVentas(desde, hasta);

  const ventasOrdenadas = useMemo(
    () =>
      (ventas ?? [])
        .slice()
        .sort(
          (a, b) =>
            new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
        ),
    [ventas],
  );

  const metodoLabel = (m: MetodoPago) =>
    m === MetodoPago.Efectivo
      ? "Efectivo"
      : m === MetodoPago.Tarjeta
        ? "Tarjeta"
        : "Transferencia";

  return (
    <div className="space-y-8">
      {/* Tarjeta total del día */}
      <div className="rounded-3xl bg-cafe-intenso p-8 text-crema shadow-sm">
        <p className="text-sm text-crema/70">Vendido hoy</p>
        <p className="mt-1 text-4xl font-bold tracking-tight break-all">
          {formatCurrency(resumen?.total ?? 0)}
        </p>
        <p className="mt-2 text-sm text-crema/60">{resumen?.numeroVentas ?? 0} ventas</p>
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-crema/15 pt-6">
          <div>
            <p className="text-xs text-crema/60">Efectivo</p>
            <p className="mt-0.5 text-lg font-bold text-crema">
              {formatCurrency(resumen?.efectivo ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-crema/60">Tarjeta</p>
            <p className="mt-0.5 text-lg font-bold text-crema">
              {formatCurrency(resumen?.tarjeta ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-crema/60">Transfer.</p>
            <p className="mt-0.5 text-lg font-bold text-crema">
              {formatCurrency(resumen?.transferencia ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de ventas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-cafe-intenso">Ventas de hoy</h2>
          <button
            onClick={() => descargarCSV(ventas)}
            disabled={!ventas || ventas.length === 0}
            className="flex items-center gap-1.5 rounded-full border border-cafe-intenso/20 px-3 py-1.5 text-xs font-semibold text-cafe-intenso transition-colors hover:bg-cafe-principal/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <DownloadSimple weight='light' className="h-3.5 w-3.5" /> Exportar CSV
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/50" />
            ))}
          </div>
        ) : ventasOrdenadas.length === 0 ? (
          <p className="py-8 text-center text-sm text-cafe-intenso/45">
            Aún no hay ventas hoy.
          </p>
        ) : (
          <div className="divide-y divide-cafe-intenso/5 rounded-2xl bg-white/70 px-5 shadow-sm">
            {ventasOrdenadas.map((v) => {
              const hora = new Date(v.fechaHora).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const numProductos = v.lineas.reduce((s, l) => s + l.cantidad, 0);
              return (
                <div key={v.id} className="flex items-center gap-3 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cafe-intenso">
                      {formatDateTime(v.fechaHora).slice(0, 16)}
                      <span className="ml-2 text-xs font-normal text-cafe-intenso/45">
                        {hora}
                      </span>
                    </p>
                    <p className="text-xs text-cafe-intenso/45">
                      {numProductos} productos \u00B7 {metodoLabel(v.metodoPago)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-cafe-intenso">
                    {formatCurrency(v.total)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}






