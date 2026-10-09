import { Link } from "react-router-dom";
import { Button } from "@/components/ui";

interface Props {
  codigo?: string;
  titulo: string;
  descripcion: string;
  irA?: string;
  irATexto?: string;
}

/** Página de error a pantalla completa (404, 403, sin conexión…). */
export function PaginaError({ codigo, titulo, descripcion, irA = "/", irATexto = "Ir al inicio" }: Props) {
  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-b from-[#FDFAF6] to-[#F0E8DC] px-6">
      <div className="flex max-w-xs flex-col items-center text-center">
        <img
          src="/403.webp"
          alt=""
          aria-hidden
          className="h-40 w-40 object-contain drop-shadow-sm"
        />
        {codigo && (
          <span className="mt-3 text-[11px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/60">
            Error {codigo}
          </span>
        )}
        <h1 className="mt-1 text-headline-lg-mobile font-bold tracking-tight text-on-surface">
          {titulo}
        </h1>
        <p className="mt-2 text-body-md text-on-surface-variant">{descripcion}</p>
        <Link to={irA} className="mt-8 w-full">
          <Button fullWidth size="lg">
            {irATexto}
          </Button>
        </Link>
      </div>
    </div>
  );
}


