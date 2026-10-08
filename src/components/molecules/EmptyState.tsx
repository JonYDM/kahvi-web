import { type ReactNode } from "react";

interface Props {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}

/**
 * Estado vacío / "sin resultados" global de la app. Usa la ilustración `empty.png`
 * (documento + lupa) en lugar de una animación HTML, para dar una imagen consistente
 * en todas las listas y búsquedas sin resultados.
 */
export function EmptyState({ titulo, descripcion, accion }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <img
        src="/spil.png"
        alt=""
        aria-hidden
        className="h-36 w-36 object-contain drop-shadow-sm"
      />
      <div>
        <p className="text-headline-sm font-bold text-on-surface">{titulo}</p>
        {descripcion && (
          <p className="mx-auto mt-1 max-w-xs text-body-md text-on-surface-variant">{descripcion}</p>
        )}
      </div>
      {accion}
    </div>
  );
}
