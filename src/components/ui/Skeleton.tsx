import { cn } from "@/lib/cn";

/** Placeholder de carga con shimmer sobre surface-container. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md bg-surface-container", className)} aria-hidden />;
}

/** Fila de skeleton para listados: misma forma que las cards reales (evita saltos al cargar). */
export function SkeletonFila() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4">
      <Skeleton className="h-11 w-11 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}




