import { Link } from "react-router-dom";
import { Button } from "@/components/ui";

interface Props {
  /** Código grande (ej. "404", "403"). Opcional. */
  codigo?: string;
  titulo: string;
  descripcion: string;
  /** Ruta del botón principal (por defecto "/"). */
  irA?: string;
  irATexto?: string;
}

/**
 * Página de error a pantalla completa (404, 403, etc.) con la ilustración del monito.
 * Es UX de navegación: la seguridad real la aplica el backend por rol (401/403 de API).
 */
export function PaginaError({ codigo, titulo, descripcion, irA = "/", irATexto = "Ir al inicio" }: Props) {
  return (
    <div className="grid min-h-screen place-items-center bg-surface px-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <img src="/no-load.webp" alt="" aria-hidden className="h-40 w-40 object-contain drop-shadow-sm" />
        {codigo && (
          <span className="tabular mt-2 text-label-lg font-bold uppercase tracking-widest text-on-surface-variant">
            Error {codigo}
          </span>
        )}
        <h1 className="mt-1 text-headline-lg-mobile font-bold text-on-surface">{titulo}</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">{descripcion}</p>
        <Link to={irA} className="mt-6 w-full">
          <Button fullWidth size="lg">
            {irATexto}
          </Button>
        </Link>
      </div>
    </div>
  );
}


