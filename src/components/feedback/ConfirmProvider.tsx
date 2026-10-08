import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button, Modal } from "@/components/ui";

interface OpcionesConfirmar {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  peligroso?: boolean;
}

type ConfirmarFn = (opciones: OpcionesConfirmar) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmarFn | null>(null);

/**
 * Provider de confirmación imperativa: `const ok = await confirmar({...})`.
 * Evita los window.confirm nativos y da una UI consistente para acciones destructivas.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const [opciones, setOpciones] = useState<OpcionesConfirmar | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirmar = useCallback<ConfirmarFn>((opts) => {
    setOpciones(opts);
    setAbierto(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const cerrar = useCallback((resultado: boolean) => {
    setAbierto(false);
    resolverRef.current?.(resultado);
    resolverRef.current = null;
  }, []);

  const value = useMemo(() => confirmar, [confirmar]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {opciones && (
        <Modal open={abierto} onClose={() => cerrar(false)} title={opciones.titulo}>
          <div className="space-y-5">
            <p className="text-body-md text-on-surface-variant">{opciones.mensaje}</p>
            <div className="flex gap-2">
              <Button variant="ghost" fullWidth onClick={() => cerrar(false)}>
                Cancelar
              </Button>
              <Button
                variant={opciones.peligroso ? "danger" : "primary"}
                fullWidth
                onClick={() => cerrar(true)}
              >
                {opciones.textoConfirmar ?? "Confirmar"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmarFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>.");
  return ctx;
}


