import { useMemo } from "react";
import { CreditCard, CurrencyDollar, Receipt, DeviceMobile } from "@phosphor-icons/react";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { SkeletonFila } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useVentas, useResumenVentas } from "@/features/pos/hooks";
import { MetodoPago } from "@/types/api";
import type { VentaHistorial } from "@/types/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rangoMesActual(): { desde: string; hasta: string } {
  const ahora = new Date();
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
  const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
  return { desde: inicio.toISOString(), hasta: fin.toISOString() };
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function agruparPorDia(ventas: VentaHistorial[]): { label: string; total: number }[] {
  const ahora = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ahora);
    d.setDate(ahora.getDate() - (6 - i));
    const yyyy = d.getFullYear();
    const mm = d.getMonth();
    const dd = d.getDate();
    const total = ventas
      .filter((v) => {
        const f = new Date(v.fechaHora);
        return f.getFullYear() === yyyy && f.getMonth() === mm && f.getDate() === dd;
      })
      .reduce((acc, v) => acc + v.total, 0);
    return { label: DIAS_SEMANA[d.getDay()], total };
  });
}

const METODO_LABEL: Record<MetodoPago, string> = {
  [MetodoPago.Efectivo]: "Efectivo",
  [MetodoPago.Tarjeta]: "Tarjeta",
  [MetodoPago.Transferencia]: "Transf.",
};

const METODO_ICON = {
  [MetodoPago.Efectivo]: CurrencyDollar,
  [MetodoPago.Tarjeta]: CreditCard,
  [MetodoPago.Transferencia]: DeviceMobile,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export function VentasPage() {
  const { desde, hasta } = rangoMesActual();

  const { data: ventas = [], isLoading: cargandoVentas } = useVentas(desde, hasta);
  const { data: resumen, isLoading: cargandoResumen } = useResumenVentas(desde, hasta);

  const cargando = cargandoVentas || cargandoResumen;

  const totalCalculado = useMemo(() => ventas.reduce((acc, v) => acc + v.total, 0), [ventas]);
  const totalMes = resumen?.total ?? totalCalculado;
  const numeroVentas = resumen?.numeroVentas ?? ventas.length;
  const ticketPromedio = numeroVentas > 0 ? totalMes / numeroVentas : 0;

  const porMetodo = useMemo(() => {
    if (resumen) return [
      { metodo: MetodoPago.Efectivo, total: resumen.efectivo },
      { metodo: MetodoPago.Tarjeta, total: resumen.tarjeta },
      { metodo: MetodoPago.Transferencia, total: resumen.transferencia },
    ];
    const mapa: Record<number, number> = {
      [MetodoPago.Efectivo]: 0,
      [MetodoPago.Tarjeta]: 0,
      [MetodoPago.Transferencia]: 0,
    };
    ventas.forEach((v) => { mapa[v.metodoPago] = (mapa[v.metodoPago] ?? 0) + v.total; });
    return [
      { metodo: MetodoPago.Efectivo, total: mapa[MetodoPago.Efectivo] },
      { metodo: MetodoPago.Tarjeta, total: mapa[MetodoPago.Tarjeta] },
      { metodo: MetodoPago.Transferencia, total: mapa[MetodoPago.Transferencia] },
    ];
  }, [resumen, ventas]);

  const diasGrafica = useMemo(() => agruparPorDia(ventas), [ventas]);
  const maxDia = Math.max(...diasGrafica.map((d) => d.total), 1);

  const ultimas5 = useMemo(
    () => [...ventas].sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()).slice(0, 5),
    [ventas],
  );

  return (
    <PantallaConHeader
      titulo="Ventas"
      subtitulo={
        <p className="text-body-sm text-on-surface-variant">
          {resumen ? "Este mes" : "Registradas"}
        </p>
      }
      accion={
        <img
          src="/sale.webp"
          alt=""
          aria-hidden
          className="-my-3 h-16 w-16 shrink-0 object-contain drop-shadow-sm"
        />
      }
    >
      <div className="flex flex-col gap-6">

        {/* Tarjeta total del mes */}
        {cargando ? (
          <div className="h-44 animate-pulse rounded-3xl bg-cafe-intenso/20" />
        ) : (
          <div
            className="rounded-3xl bg-cafe-intenso p-7 text-crema"
            style={{ boxShadow: "0 8px 32px -8px rgba(43,31,25,0.35), 0 2px 8px -2px rgba(43,31,25,0.15)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-crema/60">
              {resumen ? "Total del mes" : "Ventas registradas"}
            </p>
            <p className="mt-1.5 text-[2.8rem] font-black leading-none tracking-[-0.02em] text-crema">
              {formatCurrency(totalMes)}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-crema/15 pt-5">
              <div>
                <p className="text-[10px] text-crema/55">Ventas</p>
                <p className="mt-0.5 text-lg font-bold text-crema">{numeroVentas}</p>
              </div>
              <div>
                <p className="text-[10px] text-crema/55">Ticket promedio</p>
                <p className="mt-0.5 text-lg font-bold text-crema">{formatCurrency(ticketPromedio)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Por método de pago */}
        <section className="flex flex-col gap-3">
          <h2 className="text-label-lg font-bold text-on-surface">Por método de pago</h2>
          {cargando ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-container" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {porMetodo.map(({ metodo, total }) => {
                const Icon = METODO_ICON[metodo];
                return (
                  <div
                    key={metodo}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-4 shadow-soft"
                  >
                    <Icon weight="light" className="h-5 w-5 text-primary-container" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                      {METODO_LABEL[metodo]}
                    </p>
                    <p className="text-label-lg font-bold text-on-surface">{formatCurrency(total)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Grafica ultimos 7 dias */}
        <section className="flex flex-col gap-3">
          <h2 className="text-label-lg font-bold text-on-surface">Últimos 7 días</h2>
          {cargando ? (
            <div className="h-40 animate-pulse rounded-2xl bg-surface-container" />
          ) : (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-soft">
              <div className="flex h-28 items-end gap-1.5">
                {diasGrafica.map((dia, i) => {
                  const pct = maxDia > 0 ? (dia.total / maxDia) * 100 : 0;
                  const esHoy = i === diasGrafica.length - 1;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                            esHoy ? "bg-cafe-intenso" : "bg-primary-container/25"
                          }`}
                          style={{ height: `${Math.max(pct, dia.total > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                      <span className={`text-[9px] font-semibold ${esHoy ? "text-cafe-intenso" : "text-on-surface-variant/50"}`}>
                        {dia.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-on-surface-variant/40">
                <span>$0</span>
                <span>{formatCurrency(maxDia)}</span>
              </div>
            </div>
          )}
        </section>

        {/* Ultimas ventas */}
        <section className="flex flex-col gap-3">
          <h2 className="text-label-lg font-bold text-on-surface">Últimas ventas</h2>
          {cargando ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => <SkeletonFila key={i} />)}
            </div>
          ) : ultimas5.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-8 text-center shadow-soft">
              <p className="text-body-sm text-on-surface-variant">Aún no hay ventas este mes.</p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/20 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 shadow-soft">
              {ultimas5.map((v) => {
                const Icon = METODO_ICON[v.metodoPago as MetodoPago] ?? Receipt;
                return (
                  <li key={v.id} className="flex items-center gap-3 py-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-container/10">
                      <Icon weight="light" className="h-4 w-4 text-primary-container" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-label-md font-semibold text-on-surface">
                        {METODO_LABEL[v.metodoPago as MetodoPago]}
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        {formatDateTime(v.fechaHora)}
                      </p>
                    </div>
                    <span className="text-label-lg font-bold text-primary-container">
                      {formatCurrency(v.total)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

      </div>
    </PantallaConHeader>
  );
}


