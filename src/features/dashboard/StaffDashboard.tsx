import { Link } from "react-router-dom";
import {
  CalendarCheck,
  Coffee,
  ShoppingCart,
  TrendingUp,
  Wallet,
  ChefHat,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { SkeletonFila } from "@/components/ui";
import { formatCurrency, fechaHoyLarga } from "@/lib/format";
import { saludoPorHora } from "@/lib/saludo";
import { useMetricas, useResumenCajaHoy } from "./hooks";
import { useComandasActivas } from "@/features/comandas/hooks";
import { RolUsuario } from "@/types/api";

/** Dashboard del Administrador de Kahvi. */
export function StaffDashboard() {
  const { sesion } = useAuth();
  const esAdmin = sesion?.rol === RolUsuario.Administrador;

  const { data: metricas, isLoading: cargandoMetricas } = useMetricas();
  const { data: caja } = useResumenCajaHoy(esAdmin);
  const { data: comandas } = useComandasActivas();

  const comandasActivas = (comandas ?? []).filter(
    (c) => c.estado === "Recibida" || c.estado === "EnPreparacion",
  ).length;

  return (
    <PantallaConHeader
      titulo={`${saludoPorHora()}…`}
      subtitulo={
        <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
          <CalendarCheck className="h-4 w-4 text-primary-container" aria-hidden />
          {fechaHoyLarga()}
        </p>
      }
      accion={
        <img
          src="/dashboard-hero.png"
          alt="Kahvi"
          className="-my-3 h-16 w-16 shrink-0 object-contain drop-shadow-sm"
        />
      }
    >
      <div className="flex flex-col gap-6">
        {/* Acciones rápidas — estaciones de trabajo */}
        <div className="grid grid-cols-2 gap-2.5">
          <AccionRapida
            to="/mesero"
            icon={Coffee}
            titulo="Mesero"
            sub="Tomar pedidos"
            className="bg-cafe-intenso text-crema"
            iconWrap="bg-crema/10 text-crema"
          />
          <AccionRapida
            to="/cocina"
            icon={ChefHat}
            titulo="Cocina"
            sub="Ver preparaciones"
            className="bg-caramelo/30 text-cafe-intenso"
            iconWrap="bg-caramelo/40 text-cafe-intenso"
          />
          <AccionRapida
            to="/caja"
            icon={Wallet}
            titulo="Caja"
            sub="Cobrar comandas"
            className="bg-verde-menta/30 text-cafe-intenso"
            iconWrap="bg-verde-menta/40 text-cafe-intenso"
          />
          <AccionRapida
            to="/app/ventas"
            icon={TrendingUp}
            titulo="Ventas"
            sub="Resumen del mes"
            className="bg-primary-container/15 text-on-surface"
            iconWrap="bg-primary-container/20 text-primary-container"
          />
        </div>

        {/* Métricas de ventas */}
        {esAdmin && (
          <section className="flex flex-col gap-3">
            <h2 className="text-label-lg font-bold text-on-surface">Hoy</h2>

            {cargandoMetricas ? (
              <div className="flex flex-col gap-2"><SkeletonFila /><SkeletonFila /></div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <MetricaCard
                  icon={<TrendingUp className="h-5 w-5" aria-hidden />}
                  label="Ventas hoy"
                  valor={formatCurrency(metricas?.ventasHoy ?? 0)}
                  sub={`${metricas?.numeroVentasMes ?? 0} ventas este mes`}
                />
                <MetricaCard
                  icon={<Coffee className="h-5 w-5" aria-hidden />}
                  label="En cocina"
                  valor={String(comandasActivas)}
                  sub="comandas activas"
                />
                {caja && (
                  <>
                    <MetricaCard
                      icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
                      label="Efectivo"
                      valor={formatCurrency(caja.efectivo)}
                      sub="hoy"
                    />
                    <MetricaCard
                      icon={<Wallet className="h-5 w-5" aria-hidden />}
                      label="Tarjeta"
                      valor={formatCurrency(caja.tarjeta)}
                      sub="hoy"
                    />
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* Top productos */}
        {metricas?.topProductos && metricas.topProductos.length > 0 && (
          <section>
            <h2 className="mb-3 text-label-lg font-bold text-on-surface">Top productos hoy</h2>
            <div className="flex flex-col gap-2">
              {metricas.topProductos.map((p, i) => (
                <div
                  key={p.nombre}
                  className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-caramelo/20 text-label-sm font-black text-cafe-principal">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-label-md font-semibold text-on-surface">
                    {p.nombre}
                  </span>
                  <span className="tabular shrink-0 text-label-md font-bold text-primary-container">
                    ×{p.cantidad}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PantallaConHeader>
  );
}

function AccionRapida({
  to,
  icon: Icon,
  titulo,
  sub,
  className,
  iconWrap,
}: {
  to: string;
  icon: typeof Coffee;
  titulo: string;
  sub: string;
  className: string;
  iconWrap: string;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col gap-2 rounded-2xl p-3.5 shadow-soft transition-transform active:scale-[0.97] ${className}`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${iconWrap}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-label-lg font-bold leading-tight">{titulo}</p>
        <p className="text-body-sm opacity-80">{sub}</p>
      </div>
    </Link>
  );
}

function MetricaCard({
  icon,
  label,
  valor,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  valor: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-xs">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-container/15 text-primary-container">
        {icon}
      </span>
      <p className="tabular text-metric-display font-bold text-on-surface">{valor}</p>
      <div>
        <p className="text-label-md font-semibold text-on-surface">{label}</p>
        <p className="text-body-sm text-on-surface-variant">{sub}</p>
      </div>
    </div>
  );
}
