import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui";

interface Props {
  pagina: number;
  totalPaginas: number;
  onCambio: (pagina: number) => void;
}

/** Controles de paginación (anterior / siguiente + indicador). */
export function Paginacion({ pagina, totalPaginas, onCambio }: Props) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onCambio(pagina - 1)}
        disabled={pagina <= 1}
        aria-label="Página anterior"
      >
        <CaretLeft weight='light' className="h-4 w-4" aria-hidden />
      </Button>
      <span className="text-body-sm font-medium text-on-surface-variant">
        Página {pagina} de {totalPaginas}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onCambio(pagina + 1)}
        disabled={pagina >= totalPaginas}
        aria-label="Página siguiente"
      >
        <CaretRight weight='light' className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}


