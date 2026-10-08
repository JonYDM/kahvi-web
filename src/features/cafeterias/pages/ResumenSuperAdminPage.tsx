import {
  Buildings,
  Coffee,
  TrendUp,
} from "@phosphor-icons/react";
import { SkeletonFila } from "@/components/ui";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { fechaHoyLarga, formatCurrency } from "@/lib/format";
import { saludoPorHora } from "@/lib/saludo";
import { useMetricasSuperAdmin } from "../hooks";

export function ResumenSuperAdminPage() {
  const { data: m, isLoading, isError } = useMetricasSuperAdmin();

  return (
    <PantallaConHeader
      titulo={`${saludoPorHora()}â€¦`}
      subtitulo={
        <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
          <Coffee weight='light' className="h-4 w-4 text-primary-container" aria-hidden />
          {fechaHoyLarga()}
        </p>
      }
    >
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <SkeletonFila key={i} />)}
        </div>
      )}

      {isError && (
        <p className="rounded-2xl bg-error-container/40 p-4 text-body-sm text-on-error-container">
          No se pudieron cargar las métricas. Intenta de nuevo.
        </p>
      )}

      {m && (
        <div className="flex flex-col gap-4">
          {/* Tarjetas de métricas */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<Buildings weight='light' className="h-5 w-5" aria-hidden />}
              label="Cafeterías activas"
              value={String(m.cafeteriasActivas)}
              sub={`${m.totalCafeterias} en total`}
            />
            <MetricCard
              icon={<TrendUp weight='light' className="h-5 w-5" aria-hidden />}
              label="Ingresos del mes"
              value={formatCurrency(m.ganadoMes)}
              sub={`${formatCurrency(m.ganadoHistorico)} histórico`}
            />
          </div>

          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-xs">
            <p className="text-label-md font-semibold text-on-surface-variant">Estado de tenants</p>
            <div className="mt-3 space-y-2">
              <StatusRow label="Activas" value={m.cafeteriasActivas} color="bg-verde-menta" />
              <StatusRow label="Inactivas" value={m.cafeteriasInactivas} color="bg-caramelo" />
            </div>
          </div>
        </div>
      )}
    </PantallaConHeader>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-xs">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-container/15 text-primary-container">
        {icon}
      </span>
      <p className="text-metric-display font-bold tabular text-on-surface">{value}</p>
      <div>
        <p className="text-label-md font-semibold text-on-surface">{label}</p>
        <p className="text-body-sm text-on-surface-variant">{sub}</p>
      </div>
    </div>
  );
}

function StatusRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
        <span className="text-body-md text-on-surface">{label}</span>
      </div>
      <span className="text-label-lg font-bold tabular text-on-surface">{value}</span>
    </div>
  );
}




