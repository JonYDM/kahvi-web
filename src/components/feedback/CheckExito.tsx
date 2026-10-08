import { Check } from "@phosphor-icons/react";

/** Círculo con check para pantallas de éxito (mismo lenguaje que el "¡Listo!" de Pasos). */
export function CheckExito() {
  return (
    <span className="mx-auto grid h-16 w-16 animate-[scaleIn_300ms_ease-out] place-items-center rounded-full bg-success/15 text-success">
      <Check weight='light' className="h-9 w-9" aria-hidden />
    </span>
  );
}
