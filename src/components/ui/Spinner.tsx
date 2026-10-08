import { CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/**
 * Indicador de carga accesible. Anuncia el estado a lectores de pantalla.
 */
export function Spinner({
  className,
  label = "Cargandoâ€¦",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center">
      <CircleNotch
        weight='light'
        className={cn("h-5 w-5 animate-spin text-primary", className)}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}


