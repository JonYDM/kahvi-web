import { useLocation } from "react-router-dom";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { useComandasActivas } from "@/features/comandas/hooks";
import { cn } from "@/lib/cn";

/**
 * Boton central elevado del nav — contextual segun la ruta activa.
 * - /app/cocina: muestra el contador de comandas en preparacion
 * - /app/caja o /caja: muestra el contador de comandas listas para cobrar
 * - Default: icono normal del item
 */
export function BtnCentral({
  isActive,
  icon: Icon,
  label,
}: {
  isActive: boolean;
  icon: PhosphorIcon;
  label: string;
}) {
  const { pathname } = useLocation();
  const { data: comandas } = useComandasActivas();

  // Contexto segun ruta
  const enCocina = pathname.includes("/cocina");
  const enCaja = pathname.includes("/caja");

  const enPreparacion = (comandas ?? []).filter((c) => c.estado === "EnPreparacion" || c.estado === "Recibida").length;
  const listas = (comandas ?? []).filter((c) => c.estado === "Lista").length;

  const badge = enCocina ? enPreparacion : enCaja ? listas : 0;
  const mostrarBadge = badge > 0;

  return (
    <span className="-mt-5 flex flex-col items-center gap-1">
      <span
        className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] bg-cafe-intenso text-crema",
          isActive && "scale-110",
        )}
        style={{
          boxShadow: isActive
            ? "0 8px 24px -4px rgba(43,31,25,0.45), 0 2px 8px -2px rgba(43,31,25,0.25)"
            : "0 4px 16px -4px rgba(43,31,25,0.30), 0 2px 6px -2px rgba(43,31,25,0.15)",
        }}
      >
        <Icon className="h-6 w-6" aria-hidden />
        {/* Badge contextual */}
        {mostrarBadge && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-verde-menta px-1 text-[10px] font-black text-cafe-intenso shadow-sm">
            {badge}
          </span>
        )}
      </span>
      <span className={cn(
        "text-[9px] font-bold transition-colors",
        isActive ? "text-cafe-intenso" : "text-on-surface-variant",
      )}>
        {label}
      </span>
    </span>
  );
}
