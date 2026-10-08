import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-semibold",
  {
    variants: {
      tone: {
        // Colores de badge del DESIGN.md de Stitch: fondo claro + texto oscuro (buen contraste).
        neutral: "bg-surface-container text-on-surface-variant",
        primary: "bg-[#CCE5E5] text-[#084C4C]",
        success: "bg-[#DCFCE7] text-[#15803D]",
        warning: "bg-[#FEF3C7] text-[#B45309]",
        danger: "bg-[#FEE2E2] text-[#B91C1C]",
        info: "bg-[#E0F2FE] text-[#0369A1]",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}


