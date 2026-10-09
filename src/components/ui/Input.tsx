import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** "outline" (borde, por defecto; formularios) o "soft" (relleno, sin borde; buscadores). */
  variant?: "outline" | "soft";
}

/**
 * Campo de texto con tokens del design system Stitch: superficie blanca con borde
 * outline-variant, foco en teal y error en error-st. El texto es de 16px para que iOS
 * no haga zoom al enfocar. La variante "soft" (buscadores) usa relleno surface-container-low.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, variant = "outline", ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-label-md font-semibold text-on-surface-variant">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "flex w-full text-base text-on-surface transition-[color,box-shadow,border-color,background-color] duration-150",
            "placeholder:text-outline focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            variant === "soft"
              ? cn(
                  "h-14 rounded-2xl border-0 bg-surface-container-low px-4",
                  "focus-visible:ring-2 focus-visible:ring-primary-container/30",
                  error && "bg-error-container/50 focus-visible:ring-error-st/30",
                )
              : cn(
                  "h-12 rounded-xl border bg-surface-container-lowest px-4",
                  "focus-visible:border-primary-container focus-visible:ring-2 focus-visible:ring-primary-container/20",
                  error
                    ? "border-error-st focus-visible:border-error-st focus-visible:ring-error-st/20"
                    : "border-outline-variant/70",
                ),
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="text-body-sm font-medium text-error-st">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-body-sm text-on-surface-variant">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";




