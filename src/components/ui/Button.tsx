import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/**
 * Botón con anatomía y variantes estilo shadcn/ui, con tokens semánticos.
 * Estados: hover, active (escala sutil), focus-visible (ring), disabled, loading.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium",
    "transition-all duration-150 ease-out-expo select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    "[&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary-container text-on-primary shadow-xs hover:bg-[hsl(180_81%_16%)] hover:shadow-primary-glow",
        secondary:
          "bg-st-secondary text-on-secondary shadow-xs hover:opacity-90",
        soft: "bg-surface-container text-on-surface hover:bg-surface-container-high",
        ghost: "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
        danger: "bg-error-st text-white shadow-xs hover:opacity-90",
        warning:
          "bg-warning/15 text-[#B45309] hover:bg-warning/25",
        outline:
          "border border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:bg-surface-container",
      },
      size: {
        sm: "h-10 px-3.5 text-sm",
        md: "h-12 px-5 text-sm",
        lg: "h-[52px] px-6 text-base",
        icon: "h-11 w-11",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <CircleNotch weight='light' className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";




