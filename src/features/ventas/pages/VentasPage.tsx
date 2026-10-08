import { useMemo } from "react";
import { CreditCard, CurrencyDollar, Receipt, DeviceMobile } from "@phosphor-icons/react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useVentas, useResumenVentas } from "@/features/pos/hooks";
import { MetodoPago } from "@/types/api";
import type { VentaHistorial } from "@/types/api";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Rango del mes actual en ISO. */
function rangoMesActual(): { desde: string; hasta: string } {
  const ahora = new Date();
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
  const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
  return { desde: inicio.toISOString(), hasta: fin.toISOString() };
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Agrupa ventas por día de la semana (últimos 7 días, índice 0 = hoy). */
function agruparPorDia(ventas: VentaHistorial[]): { label: string; total: number }[] {
  const ahora = new Date();
  const dias: { label: string; total: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(ahora);
    d.setDate(ahora.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = d.getMonth();
    const dd = d.getDate();

    const total = ventas
      .filter((v) => {
        const f = new Date(v.fechaHora);
        return f.getFullYear() === yyyy && f.getMonth() === mm && f.getDate() === dd;
      })
      .reduce((acc, v) => acc + v.total, 0);

    dias.push({ label: DIAS_SEMANA[d.getDay()], total });
  }

  return dias;
}

const METODO_LABEL: Record<MetodoPago, string> = {
  [MetodoPago.Efectivo]: "Efectivo",
  [MetodoPago.Tarjeta]: "Tarjeta",
  [MetodoPago.Transferencia]: "Transferencia",
};

const METODO_ICON = {
  [MetodoPago.Efectivo]: CurrencyDollar,
  [MetodoPago.Tarjeta]: CreditCard,
  [MetodoPago.Transferencia]: DeviceMobile,
};

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function VentasPage() {
  const { desde, hasta } = rangoMesActual();

  const { data: ventas = [], isLoading: cargandoVentas } = useVentas(desde, hasta);
  const { data: resumen, isLoading: cargandoResumen } = useResumenVentas(desde, hasta);

  // Totales calculados a partir de ventas si resumen no está disponible
  const totalCalculado = useMemo(
    () => ventas.reduce((acc, v) => acc + v.total, 0),
    [ventas],
  );

  const totalMes = resumen?.total ?? totalCalculado;
  const numeroVentas = resumen?.numeroVentas ?? ventas.length;

  // Desglose por método â€” desde resumen si existe, sino calculado
  const porMetodo = useMemo(() => {
    if (resumen) {
      return [
        { metodo: MetodoPago.Efectivo, total: resumen.efectivo },
        { metodo: MetodoPago.Tarjeta, total: resumen.tarjeta },
        { metodo: MetodoPago.Transferencia, total: resumen.transferencia },
      ];
    }
    const mapa: Record<number, number> = {
      [MetodoPago.Efectivo]: 0,
      [MetodoPago.Tarjeta]: 0,
      [MetodoPago.Transferencia]: 0,
    };
    ventas.forEach((v) => {
      mapa[v.metodoPago] = (mapa[v.metodoPago] ?? 0) + v.total;
    });
    return [
      { metodo: MetodoPago.Efectivo, total: mapa[MetodoPago.Efectivo] },
      { metodo: MetodoPago.Tarjeta, total: mapa[MetodoPago.Tarjeta] },
      { metodo: MetodoPago.Transferencia, total: mapa[MetodoPago.Transferencia] },
    ];
  }, [resumen, ventas]);

  // Datos para la gráfica de barras (últimos 7 días)
  const diasGrafica = useMemo(() => agruparPorDia(ventas), [ventas]);
  const maxDia = Math.max(...diasGrafica.map((d) => d.total), 1);

  // Àšltimas 5 ventas
  const ultimas5 = useMemo(
    () =>
      [...ventas]
        .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())
        .slice(0, 5),
    [ventas],
  );

  const etiquetaPeriodo = resumen ? "Total del mes" : "Ventas registradas";

  const cargando = cargandoVentas || cargandoResumen;

  return (
    <div className="min-h-screen bg-crema pb-10">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-crema/90 backdrop-blur-sm px-4 py-3 shadow-[0_1px_0_0_rgba(43,31,25,0.08)]">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 px-1">
            <Receipt weight='light' className="text-cafe-intenso" />
            <h1 className="text-base font-bold text-cafe-intenso">Ventas</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        {/* â”€â”€ Tarjeta grande total del mes â”€â”€ */}
        {cargando ? (
          <div className="h-44 animate-pulse rounded-3xl bg-cafe-intenso/20" />
        ) : (
          <div className="rounded-3xl bg-cafe-intenso p-8 text-crema shadow-sm">
            <p className="text-sm text-crema/70">{etiquetaPeriodo}</p>
            <p className="mt-1 font-bold tracking-tight text-5xl">
              {formatCurrency(totalMes)}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-crema/15 pt-6">
              <div>
                <p className="text-xs text-crema/60">Ventas</p>
                <p className="mt-0.5 text-lg font-bold text-crema">{numeroVentas}</p>
              </div>
              <div>
                <p className="text-xs text-crema/60">Ticket promedio</p>
                <p className="mt-0.5 text-lg font-bold text-crema">
                  {formatCurrency(numeroVentas > 0 ? totalMes / numeroVentas : 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€ Desglose por método de pago â”€â”€ */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-cafe-intenso">Por método de pago</h2>
          {cargando ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/50" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {porMetodo.map(({ metodo, total }) => {
                const Icon = METODO_ICON[metodo];
                return (
                  <div
                    key={metodo}
                    className="rounded-2xl bg-white/70 px-4 py-4 shadow-sm text-center"
                  >
                    <div className="flex justify-center mb-1">
                      <Icon weight='light' className="h-4 w-4 text-verde-menta" />
                    </div>
                    <p className="text-xs text-cafe-intenso/50">{METODO_LABEL[metodo]}</p>
                    <p className="mt-1 text-sm font-bold text-cafe-intenso">
                      {formatCurrency(total)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* â”€â”€ Gráfica de barras últimos 7 días â”€â”€ */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-cafe-intenso">Àšltimos 7 días</h2>
          {cargando ? (
            <div className="h-40 animate-pulse rounded-2xl bg-white/50" />
          ) : (
            <div className="rounded-2xl bg-white/70 p-5 shadow-sm">
              <div className="flex items-end gap-2 h-32">
                {diasGrafica.map((dia, i) => {
                  const pct = maxDia > 0 ? (dia.total / maxDia) * 100 : 0;
                  const esHoy = i === diasGrafica.length - 1;
                  return (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      {/* barra */}
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            esHoy
                              ? "bg-cafe-intenso"
                              : "bg-cafe-principal/40"
                          }`}
                          style={{ height: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
                          title={formatCurrency(dia.total)}
                        />
                      </div>
                      {/* etiqueta día */}
                      <span
                        className={`text-[10px] font-medium ${
                          esHoy ? "text-cafe-intenso font-bold" : "text-cafe-intenso/50"
                        }`}
                      >
                        {dia.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* eje de referencia */}
              <div className="mt-2 flex justify-between text-[10px] text-cafe-intenso/35">
                <span>$0</span>
                <span>{formatCurrency(maxDia)}</span>
              </div>
            </div>
          )}
        </section>

        {/* â”€â”€ Àšltimas 5 ventas â”€â”€ */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-cafe-intenso">Àšltimas ventas</h2>
          {cargando ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-white/50" />
              ))}
            </div>
          ) : ultimas5.length === 0 ? (
            <div className="rounded-2xl bg-white/70 px-5 py-8 text-center shadow-sm">
              <p className="text-sm text-cafe-intenso/45">No hay ventas registradas.</p>
            </div>
          ) : (
            <div className="divide-y divide-cafe-intenso/5 rounded-2xl bg-white/70 px-5 shadow-sm">
              {ultimas5.map((v, idx) => {
                const Icon = METODO_ICON[v.metodoPago as MetodoPago] ?? Receipt;
                return (
                  <div key={v.id} className="flex items-center gap-3 py-4">
                    {/* índice / folio visual */}
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-cafe-principal/20 text-xs font-bold text-cafe-intenso">
                      #{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cafe-intenso">
                        {formatDateTime(v.fechaHora)}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-cafe-intenso/50">
                        <Icon weight='light' className="h-3 w-3" />
                        {METODO_LABEL[v.metodoPago as MetodoPago] ?? "â€”"}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-verde-menta">
                      {formatCurrency(v.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}



