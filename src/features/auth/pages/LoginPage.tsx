import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { PinInput } from "@/components/molecules/PinInput";
import { Reveal } from "@/lib/anim";
import { saludoPorHora } from "@/lib/saludo";
import { ApiError } from "@/lib/http";
import { useAuth } from "../AuthContext";
import { identificar } from "../api";
import { rutaInicialPorRol } from "../roles";

const PIN_LENGTH = 6;

interface LocationState {
  from?: { pathname: string };
}

type Paso = "identificador" | "pin";

export function LoginPage() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [paso, setPaso] = useState<Paso>("identificador");
  const [identificador, setIdentificador] = useState("");
  const [nombreReal, setNombreReal] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorPin, setErrorPin] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function siguiente() {
    const id = identificador.trim();
    if (id.length === 0 || verificando) return;
    setErrorId(null);
    setVerificando(true);
    try {
      const r = await identificar(id);
      if (!r.existe) {
        setErrorId("No encontramos una cuenta con ese usuario.");
        return;
      }
      setNombreReal(r.nombre ?? null);
      setPaso("pin");
    } catch {
      setErrorId("No se pudo verificar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setVerificando(false);
    }
  }

  function volver() {
    setErrorPin(null);
    setPin("");
    setNombreReal(null);
    setPaso("identificador");
  }

  async function enviar() {
    if (pin.length !== PIN_LENGTH || cargando) return;
    setErrorPin(null);
    setCargando(true);
    try {
      const sesion = await iniciarSesion(identificador.trim(), pin);
      const state = location.state as LocationState | null;
      const home = rutaInicialPorRol(sesion.rol);
      const from = state?.from?.pathname;
      const areaHome = home.split("/")[1];
      const destino = from && from.split("/")[1] === areaHome ? from : home;
      navigate(destino, { replace: true });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : "No se pudo conectar. Revisa tu internet e intenta de nuevo.";
      setErrorPin(msg);
      setPin("");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-y-auto bg-crema">
      {/* Fondo decorativo sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-brand-mesh opacity-40"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
        {paso === "identificador" ? (
          <Reveal key="id" className="flex flex-col">
            {/* Vito feliz + wordmark Kahvi */}
            <div className="flex flex-col items-center text-center">
              <img
                src="/vito-feliz.png"
                alt="Vito"
                className="h-32 w-32 object-contain drop-shadow-md animate-vito-float"
              />
              <span className="mt-2 font-marca text-4xl font-extrabold tracking-tight text-cafe-intenso">
                Kahvi
              </span>
              <p className="mt-0.5 text-body-md text-cafe-principal font-medium">
                Tu cafetería, en buenas manos
              </p>
            </div>

            {/* Saludo cálido */}
            <div className="mt-8 text-center">
              <h1 className="text-h1 font-bold tracking-tight text-cafe-intenso">
                ¡{saludoPorHora()}!
              </h1>
              <p className="mt-1.5 text-body-lg text-on-surface-variant">
                Ingresa para continuar
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                siguiente();
              }}
              className="mt-8 flex flex-col gap-3"
            >
              <Input
                variant="soft"
                aria-label="Usuario"
                autoComplete="username"
                enterKeyHint="go"
                placeholder="Tu usuario"
                value={identificador}
                onChange={(e) => {
                  setIdentificador(e.target.value);
                  if (errorId) setErrorId(null);
                }}
                error={errorId ?? undefined}
                className="h-14 text-center"
                autoFocus
              />
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={verificando}
                disabled={identificador.trim().length === 0}
                className="h-14 text-base bg-verde-menta hover:bg-verde-menta/90 text-cafe-intenso font-bold"
              >
                Continuar
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Button>
            </form>
          </Reveal>
        ) : (
          <Reveal key="pin" className="flex flex-col">
            <button
              onClick={volver}
              className="absolute left-6 top-6 flex w-fit items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 text-label-md font-medium text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {identificador}
            </button>

            {/* Vito + saludo con nombre real */}
            <div className="flex flex-col items-center text-center">
              <img
                src="/vito-feliz.png"
                alt="Vito"
                className="h-28 w-28 object-contain drop-shadow-md"
              />
              <h1 className="mt-3 text-h1 font-bold tracking-tight text-cafe-intenso">
                {nombreReal ? `¡Hola, ${nombreReal.split(" ")[0]}!` : "Tu PIN"}
              </h1>
              <p className="mt-1.5 text-body-lg text-on-surface-variant">
                {nombreReal
                  ? "Ingresa tu PIN para entrar"
                  : `Ingresa tu PIN de ${PIN_LENGTH} dígitos`}
              </p>
            </div>

            <div className="mt-8 space-y-5">
              <PinInput
                value={pin}
                onChange={(next) => {
                  setPin(next);
                  if (errorPin) setErrorPin(null);
                }}
                length={PIN_LENGTH}
                onComplete={enviar}
                disabled={cargando}
                autoFocus
              />

              {errorPin && (
                <p
                  role="alert"
                  className="rounded-2xl bg-error-container/60 px-4 py-3 text-center text-body-sm font-medium text-on-error-container"
                >
                  {errorPin}
                </p>
              )}
            </div>

            <div className="mt-6">
              <Button
                fullWidth
                size="lg"
                onClick={enviar}
                loading={cargando}
                disabled={pin.length !== PIN_LENGTH}
                className="h-14 text-base bg-verde-menta hover:bg-verde-menta/90 text-cafe-intenso font-bold"
              >
                Entrar
              </Button>
            </div>
          </Reveal>
        )}
      </div>
    </main>
  );
}
