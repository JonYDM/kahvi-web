import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

/** Select con la misma anatomía que Input (tokens Stitch, 16px, foco teal, error error-st). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-label-md font-semibold text-on-surface-variant">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            className={cn(
              "flex h-12 w-full appearance-none rounded-xl border bg-surface-container-lowest px-4 pr-10 text-base text-on-surface",
              "transition-[color,box-shadow,border-color] duration-150",
              "focus-visible:outline-none focus-visible:border-primary-container focus-visible:ring-2 focus-visible:ring-primary-container/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-error-st" : "border-outline-variant/70",
              className,
            )}
            {...props}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <CaretDown
            weight='light'
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            aria-hidden
          />
        </div>
        {error && <p className="text-body-sm font-medium text-error-st">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
