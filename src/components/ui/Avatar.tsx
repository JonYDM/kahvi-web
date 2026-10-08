import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const avatarVariants = cva(
  "inline-grid shrink-0 place-items-center rounded-full font-semibold uppercase",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-14 w-14 text-lg",
      },
      tone: {
        primary: "bg-primary-fixed/40 text-tertiary",
        accent: "bg-secondary-fixed text-on-secondary-fixed-variant",
        neutral: "bg-surface-container text-on-surface-variant",
      },
    },
    defaultVariants: { size: "md", tone: "primary" },
  },
);

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  nombre: string;
  className?: string;
  /** URL de imagen (foto de perfil). Si se pasa, muestra la foto en vez de iniciales. */
  src?: string | null;
}

function iniciales(nombre: string): string {
  return nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0] ?? "").join("");
}

/** Avatar con iniciales o foto (si se pasa src). */
export function Avatar({ nombre, size, tone, className, src }: AvatarProps) {
  if (src) {
    return (
      <span className={cn(avatarVariants({ size, tone }), "overflow-hidden", className)} aria-hidden>
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span className={cn(avatarVariants({ size, tone }), className)} aria-hidden>
      {iniciales(nombre)}
    </span>
  );
}


