import { type ReactNode } from "react";
import { Drawer as Vaul } from "vaul";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/useMediaQuery";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Descripción opcional bajo el título. */
  descripcion?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Contenedor responsivo (patrón shadcn):
 *  - Escritorio (>=768px): Dialog centrado clásico (con botón cerrar).
 *  - Móvil: bottom-sheet fluido de Vaul con grabber (arrastrable para cerrar).
 * Misma API en ambos, estilizado con tokens clínicos.
 */
export function Drawer({ open, onClose, title, descripcion, children, className }: DrawerProps) {
  const esEscritorio = useMediaQuery("(min-width: 768px)");

  if (esEscritorio) {
    return (
      <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-on-surface/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
          <Dialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl bg-surface-container-lowest shadow-float outline-none",
              className,
            )}
          >
            <div className="px-6 pb-2 pt-6">
              <Dialog.Title className="text-headline-sm font-bold tracking-tight text-on-surface">
                {title}
              </Dialog.Title>
              {descripcion && (
                <Dialog.Description className="mt-0.5 text-body-sm text-on-surface-variant">
                  {descripcion}
                </Dialog.Description>
              )}
            </div>
            <div className="overflow-y-auto px-6 pb-6">{children}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Vaul.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-on-surface/40" />
        <Vaul.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[60vh] w-full max-w-md flex-col rounded-t-3xl bg-surface-container-lowest outline-none",
            className,
          )}
        >
          {/* Grabber / handle para arrastrar */}
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1.5 w-10 rounded-full bg-outline-variant" aria-hidden />
          </div>

          <div className="px-5 pb-2 pt-2">
            <Vaul.Title className="text-headline-sm font-bold tracking-tight text-on-surface">
              {title}
            </Vaul.Title>
            {descripcion && (
              <Vaul.Description className="mt-0.5 text-body-sm text-on-surface-variant">
                {descripcion}
              </Vaul.Description>
            )}
          </div>

          <div
            className="overflow-y-auto px-5 pb-8"
            style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
          >
            {children}
          </div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}


