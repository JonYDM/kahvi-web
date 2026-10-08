import { CheckExito } from "@/components/feedback/CheckExito";
import { useState } from "react";
import { Button, Modal } from "@/components/ui";
import { PinInput } from "@/components/molecules/PinInput";
import { ApiError } from "@/lib/http";
import { useCambiarMiPin } from "../hooks";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PIN_LENGTH = 6;

/** Modal de autoservicio: el usuario cambia su propio PIN (verifica el actual). */
export function CambiarMiPinModal({ open, onClose }: Props) {
  const cambiar = useCambiarMiPin();
  const [pinActual, setPinActual] = useState("");
  const [nuevoPin, setNuevoPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function enviar() {
    if (pinActual.length !== PIN_LENGTH || nuevoPin.length !== PIN_LENGTH) return;
    setError(null);
    try {
      await cambiar.mutateAsync({ pinActual, nuevoPin });
      setOk(true);
      setPinActual("");
      setNuevoPin("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el PIN.");
    }
  }

  function cerrar() {
    setPinActual("");
    setNuevoPin("");
    setError(null);
    setOk(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={cerrar} title="Cambiar mi PIN">
      {ok ? (
        <div className="space-y-4 text-center">
          <CheckExito />
          <p className="text-headline-sm font-bold text-on-surface">Tu PIN se actualizó</p>
          <Button fullWidth onClick={cerrar}>
            Entendido
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-on-surface">PIN actual</p>
            <PinInput value={pinActual} onChange={setPinActual} length={PIN_LENGTH} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-on-surface">Nuevo PIN</p>
            <PinInput value={nuevoPin} onChange={setNuevoPin} length={PIN_LENGTH} />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-error-container/60 px-4 py-3 text-center text-body-sm font-medium text-on-error-container">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={cerrar} fullWidth>
              Cancelar
            </Button>
            <Button
              onClick={enviar}
              loading={cambiar.isPending}
              disabled={pinActual.length !== PIN_LENGTH || nuevoPin.length !== PIN_LENGTH}
              fullWidth
            >
              Cambiar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}


