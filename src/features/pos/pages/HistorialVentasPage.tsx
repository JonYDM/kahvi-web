import { useMemo, useState } from "react";
import { Money, CalendarDots, CreditCard, DownloadSimple, Package, Receipt, DeviceMobile, Storefront } from "@phosphor-icons/react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { Button, SkeletonFila } from "@/components/ui";
import { descargarCsv } from "@/lib/csv";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { metodoPagoLabel } from "@/lib/enums";
import { MetodoPago } from "@/types/api";
import { useResumenVentas, useVentas } from "../hooks";

function mesActual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function rangoDelMes(mes: string): { desde: string; hasta: string } {
  const [y, m] = mes.split("-").map(Number);
  const desde = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const hasta = new Date(y, m, 0, 23, 59, 59, 999);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

const ICONO_METODO = {
  [MetodoPago.Efectivo]: Money,
  [MetodoPago.Tarjeta]: CreditCard,
  [MetodoPago.Transferencia]: DeviceMobile,
} as const;

export function HistorialVentasPage() {
  const [mes, setMes] = useState(mesActual());
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const { desde, hasta } = useMemo(() => rangoDelMes(mes), [mes]);

  const { data: ventas, isLoading, isError } = useVentas(desde, hasta);
  const { data: resumen } = useResumenVentas(desde, hasta);

  const ventasFiltradas = useMemo(
    () => (metodo === null ? ventas ?? [] : (ventas ?? []).filter((v) => v.metodoPago === metodo)),
    [ventas, metodo],
  );

  function exportar() {
    if (!ventas) return;
    const filas = ventas.map((v) => [
      formatDateTime(v.fechaHora),
      metodoPagoLabel[v.metodoPago],
      v.lineas.map((l) => `${l.cantidad}x ${l.nombreProducto}`).join(" | "),
      v.total,
    ]);
    descargarCsv(`ventas-${mes}.csv`, ["Fecha", "Método", "Productos", "Total (MXN)"], filas);
  }

  return (
    <PantallaConHeader
      titulo="Historial de ventas"
      subtitulo={
        <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
          <Receipt weight='light' className="h-4 w-4 text-primary-container" aria-hidden />
          {ventas ? `${ventas.length} venta${ventas.length === 1 ? "" : "s"} en el mes` : "Ventas del negocio"}
        </p>
      }
      accion={
        <Button variant="soft" size="sm" onClick={exportar} disabled={!ventas || ventas.length === 0}>
          <DownloadSimple weight='light' className="h-4 w-4" aria-hidden />
          CSV
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Filtro por mes */}
        <label className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-3 shadow-soft">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-caramelo/20 text-cafe-principal">
            <CalendarDots weight='light' className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body-sm text-on-surface-variant">Mostrando ventas de</span>
            <input
              type="month"
              aria-label="Mes"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="w-full bg-transparent text-headline-sm font-bold text-on-surface outline-none"
            />
          </span>
        </label>

        {/* Resumen del período */}
        {resumen && (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-center justify-between rounded-2xl bg-primary-container p-4 text-on-primary shadow-soft">
              <span className="flex items-center gap-1.5 text-label-md font-bold">
                <Storefront weight='light' className="h-[18px] w-[18px]" aria-hidden />
                Total del mes
              </span>
              <span className="tabular text-headline-md font-bold">{formatCurrency(resumen.total)}</span>
            </div>
            <ResumenChip icon={Money} label="Efectivo" valor={resumen.efectivo} className="bg-verde-menta/20 text-cafe-intenso" iconWrap="bg-verde-menta/30 text-cafe-principal" />
            <ResumenChip icon={CreditCard} label="Tarjeta" valor={resumen.tarjeta} className="bg-caramelo/20 text-cafe-intenso" iconWrap="bg-caramelo/30 text-cafe-principal" />
            <ResumenChip icon={DeviceMobile} label="Transferencia" valor={resumen.transferencia} className="bg-cafe-principal/10 text-cafe-intenso" iconWrap="bg-cafe-principal/20 text-cafe-principal" />
            <div className="flex flex-col gap-1 rounded-2xl bg-surface-container p-3.5 shadow-soft">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container-high">
                <Package weight='light' className="h-5 w-5 text-on-surface-variant" aria-hidden />
              </span>
              <span className="tabular mt-1 text-label-lg font-bold leading-none text-on-surface">{resumen.numeroVentas}</span>
              <span className="text-body-sm text-on-surface-variant">Número de ventas</span>
            </div>
          </div>
        )}

        {/* Chips de método */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { valor: null, label: "Todos" },
            { valor: MetodoPago.Efectivo, label: "Efectivo" },
            { valor: MetodoPago.Tarjeta, label: "Tarjeta" },
            { valor: MetodoPago.Transferencia, label: "Transferencia" },
          ].map((chip) => {
            const activo = metodo === chip.valor;
            return (
              <button
                key={chip.label}
                onClick={() => setMetodo(chip.valor)}
                className={
                  "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-label-md font-semibold transition-colors " +
                  (activo
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:text-on-surface")
                }
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Lista de ventas */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonFila key={i} />)}
          </div>
        ) : isError ? (
          <div className="rounded-2xl bg-surface-container-lowest p-8 text-center text-body-sm text-error-st shadow-soft">
            No se pudieron cargar las ventas.
          </div>
        ) : ventasFiltradas.length > 0 ? (
          <div className="flex flex-col gap-3">
            {ventasFiltradas.map((v) => {
              const IconoMetodo = ICONO_METODO[v.metodoPago] ?? Receipt;
              return (
                <div
                  key={v.id}
                  className="flex flex-col gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-caramelo/20 text-cafe-principal">
                      <IconoMetodo weight='light' className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-label-lg font-bold text-on-surface">{metodoPagoLabel[v.metodoPago]}</p>
                      <p className="truncate text-body-sm text-on-surface-variant">{formatDateTime(v.fechaHora)}</p>
                    </div>
                    <span className="tabular shrink-0 text-headline-sm font-bold text-primary-container">
                      {formatCurrency(v.total)}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-1 rounded-xl bg-surface-container-low px-3 py-2.5">
                    {v.lineas.map((l, i) => (
                      <li key={i} className="flex justify-between gap-2 text-body-md">
                        <span className="min-w-0 truncate text-on-surface">{l.cantidad}À— {l.nombreProducto}</span>
                        <span className="tabular shrink-0 text-on-surface-variant">{formatCurrency(l.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            titulo={metodo !== null ? "Sin ventas con ese método" : "Sin ventas"}
            descripcion={
              metodo !== null
                ? "No hay ventas con ese método de pago en el mes."
                : "No hay ventas registradas en el mes seleccionado."
            }
          />
        )}
      </div>
    </PantallaConHeader>
  );
}

function ResumenChip({
  icon: Icon,
  label,
  valor,
  className,
  iconWrap,
}: {
  icon: typeof Money;
  label: string;
  valor: number;
  className: string;
  iconWrap: string;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded-2xl p-3.5 shadow-soft ${className}`}>
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${iconWrap}`}>
        <Icon weight='light' className="h-5 w-5" aria-hidden />
      </span>
      <span className="tabular mt-1 text-label-lg font-bold leading-none">{formatCurrency(valor)}</span>
      <span className="text-body-sm opacity-80">{label}</span>
    </div>
  );
}





