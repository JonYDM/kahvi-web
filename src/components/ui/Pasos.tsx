import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export interface Paso {
  /** Contenido del paso (campos). Debe caber en el drawer compacto (~1-2 campos). */
  contenido: ReactNode;
  /** Opcional: si devuelve false, no deja avanzar (validación del paso). */
  valido?: boolean;
}

interface PasosProps {
  pasos: Paso[];
  /** Se llama al confirmar el último paso. Debe devolver una promesa (guardado). */
  onFinalizar: () => Promise<void> | void;
  /** Se llama tras mostrar "Â¡Listo!" (para cerrar el drawer). */
  onCompletado?: () => void;
  /** True mientras se guarda (muestra el estado "Guardandoâ€¦"). */
  guardando?: boolean;
  /** Texto del botón final (por defecto "Guardar"). */
  textoFinal?: string;
  /** Mensaje mientras guarda (por defecto "Guardandoâ€¦"). */
  textoGuardando?: string;
  /** Mensaje de éxito (por defecto "Â¡Listo!"). */
  textoCompletado?: string;
  /**
   * Si true (ej. edición), se puede tocar cualquier paso del indicador para saltar
   * directo. Si false (alta), solo se puede volver a pasos ya visitados.
   */
  libre?: boolean;
  /** Paso en el que abre inicialmente (0-based). Àštil para ir directo a uno. */
  pasoInicial?: number;
}

/**
 * Wizard de pasos para formularios cortos dentro del Drawer: cada paso muestra pocos
 * campos, con indicador de progreso (clicable), navegación Atrás/Continuar y un estado
 * animado de "Guardandoâ€¦" al finalizar. Mantiene los formularios breves.
 */
export function Pasos({
  pasos,
  onFinalizar,
  onCompletado,
  guardando = false,
  textoFinal = "Guardar",
  textoGuardando = "Guardandoâ€¦",
  textoCompletado = "Â¡Listo!",
  libre = false,
  pasoInicial = 0,
}: PasosProps) {
  const [actual, setActual] = useState(pasoInicial);
  const [maxVisitado, setMaxVisitado] = useState(pasoInicial);
  const [fase, setFase] = useState<"form" | "guardando" | "completado">("form");
  const total = pasos.length;
  const esUltimo = actual === total - 1;
  const paso = pasos[actual];
  const puedeAvanzar = paso.valido !== false;

  // Al completar, muestra el check ~1.1s y luego cierra.
  useEffect(() => {
    if (fase !== "completado") return;
    const t = setTimeout(() => onCompletado?.(), 1100);
    return () => clearTimeout(t);
  }, [fase, onCompletado]);

  function irA(i: number) {
    setActual(i);
    setMaxVisitado((m) => Math.max(m, i));
  }

  async function siguiente() {
    if (!puedeAvanzar) return;
    if (esUltimo) {
      setFase("guardando");
      try {
        await onFinalizar();
        setFase("completado");
      } catch {
        setFase("form"); // el propio formulario muestra el error
      }
    } else {
      irA(actual + 1);
    }
  }

  // Estado de proceso tipo Nubank/Mercado Pago: Guardandoâ€¦ â†’ Â¡Listo!
  if (fase === "guardando" || guardando) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-primary-fixed/40 text-primary-container">
          <CircleNotch weight='light' className="h-8 w-8 animate-spin" aria-hidden />
        </span>
        <p className="text-label-lg font-semibold text-on-surface">{textoGuardando}</p>
      </div>
    );
  }

  if (fase === "completado") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <span className="grid h-16 w-16 animate-[scaleIn_300ms_ease-out] place-items-center rounded-full bg-success/15 text-success">
          <Check weight='light' className="h-9 w-9" aria-hidden />
        </span>
        <p className="text-headline-sm font-bold text-on-surface">{textoCompletado}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Indicador de progreso (clicable) */}
      {total > 1 && (
        <div className="flex items-center gap-1.5">
          {pasos.map((_, i) => {
            const accesible = libre || i <= maxVisitado;
            return (
              <button
                key={i}
                type="button"
                onClick={() => accesible && irA(i)}
                disabled={!accesible}
                aria-label={`Ir al paso ${i + 1}`}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= actual ? "bg-primary-container" : "bg-surface-container-high",
                  accesible ? "cursor-pointer" : "cursor-default",
                )}
              />
            );
          })}
        </div>
      )}

      {/* Contenido del paso actual */}
      <div className="min-h-0">{paso.contenido}</div>

      {/* Navegación */}
      <div className="flex gap-2 pt-1">
        {actual > 0 && (
          <Button type="button" variant="ghost" onClick={() => irA(actual - 1)}>
            <ArrowLeft weight='light' className="h-4 w-4" aria-hidden />
            Atrás
          </Button>
        )}
        <Button type="button" onClick={siguiente} disabled={!puedeAvanzar} fullWidth>
          {esUltimo ? (
            <>
              <Check weight='light' className="h-4 w-4" aria-hidden />
              {textoFinal}
            </>
          ) : (
            <>
              Continuar
              <ArrowRight weight='light' className="h-4 w-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


