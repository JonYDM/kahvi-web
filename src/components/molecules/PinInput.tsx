import { useRef, type ClipboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface PinInputProps {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  onComplete?: (pin: string) => void;
  disabled?: boolean;
  /** Enfoca automáticamente al montar. */
  autoFocus?: boolean;
}

/**
 * Entrada de PIN estilo "código de verificación": casillas visuales sobre un
 * único input real (numérico). Se digita con el teclado normal del dispositivo
 * (en móvil sale el teclado numérico por inputMode). No usa listeners globales,
 * así que no interfiere con otros campos del formulario.
 */
export function PinInput({
  value,
  onChange,
  length = 6,
  onComplete,
  disabled = false,
  autoFocus = false,
}: PinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function actualizar(raw: string) {
    const soloDigitos = raw.replace(/\D/g, "").slice(0, length);
    onChange(soloDigitos);
    if (soloDigitos.length === length) onComplete?.(soloDigitos);
  }

  function onPaste(e: ClipboardEvent) {
    e.preventDefault();
    actualizar(e.clipboardData.getData("text"));
  }

  const casillas = Array.from({ length });

  return (
    <div className="relative">
      {/* Input real (invisible pero enfocable) que captura el tecleo. */}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => actualizar(e.target.value)}
        onPaste={onPaste}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={`PIN de ${length} dígitos`}
        maxLength={length}
        autoFocus={autoFocus}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />
      {/* Casillas visuales */}
      <div className="flex justify-center gap-2 sm:gap-3">
        {casillas.map((_, i) => {
          const activo = i === value.length;
          const lleno = i < value.length;
          return (
            <div
              key={i}
              className={cn(
                "tabular grid h-14 w-11 place-items-center rounded-xl border-2 text-2xl font-bold text-on-surface transition-all sm:w-12",
                lleno
                  ? "border-primary-container bg-primary-fixed/40"
                  : activo
                    ? "border-primary-container"
                    : "border-outline-variant/40 bg-surface-container-lowest",
              )}
            >
              {value[i] ? "•" : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}




