import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Backspace } from "@phosphor-icons/react";
import { saludoPorHora } from "@/lib/saludo";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import { useAuth } from "../AuthContext";
import { identificar } from "../api";
import { rutaInicialPorRol } from "../roles";

const PIN_LENGTH = 6;

interface LocationState {
  from?: { pathname: string };
}

type Paso = "identificador" | "pin";

// Teclado numerico en pantalla
const TECLAS = ["1","2","3","4","5","6","7","8","9","","0","<"];

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
      if (!r.existe) { setErrorId("No encontramos una cuenta con ese usuario."); return; }
      setNombreReal(r.nombre ?? null);
      setPaso("pin");
    } catch {
      setErrorId("No se pudo verificar. Revisa tu conexion e intenta de nuevo.");
    } finally {
      setVerificando(false);
    }
  }

  function volver() {
    setErrorPin(null); setPin(""); setNombreReal(null); setPaso("identificador");
  }

  function presionarTecla(t: string) {
    if (cargando) return;
    if (t === "<") {
      setPin((p) => p.slice(0, -1));
      if (errorPin) setErrorPin(null);
    } else if (t !== "" && pin.length < PIN_LENGTH) {
      const siguiente = pin + t;
      setPin(siguiente);
      if (errorPin) setErrorPin(null);
      if (siguiente.length === PIN_LENGTH) enviarPin(siguiente);
    }
  }

  async function enviarPin(valor: string = pin) {
    if (valor.length !== PIN_LENGTH || cargando) return;
    setErrorPin(null);
    setCargando(true);
    try {
      const sesion = await iniciarSesion(identificador.trim(), valor);
      const state = location.state as LocationState | null;
      const home = rutaInicialPorRol(sesion.rol);
      const from = state?.from?.pathname;
      const areaHome = home.split("/")[1];
      const destino = from && from.split("/")[1] === areaHome ? from : home;
      navigate(destino, { replace: true });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "No se pudo conectar. Revisa tu internet.";
      setErrorPin(msg);
      setPin("");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main
      className="relative min-h-dvh overflow-hidden"
      style={{ background: "linear-gradient(160deg, #FDFAF6 0%, #F5EDE0 60%, #EDE0CE 100%)" }}
    >
      <div className="relative mx-auto flex min-h-dvh w-full max-w-sm flex-col px-7">

        {/* ── Paso 1: Identificador ── */}
        {paso === "identificador" && (
          <div className="flex flex-1 flex-col justify-between py-12">

            {/* Vito + marca */}
            <div className="flex flex-col items-center pt-8 text-center">
              <div style={{ filter: "drop-shadow(0 12px 24px rgba(43,31,25,0.18))" }}>
                <img src="/vito-feliz.webp" alt="Vito" className="h-28 w-28 object-contain" />
              </div>
              <span className="mt-3 text-[2rem] font-black tracking-[-0.03em] text-cafe-intenso">Kahvi</span>
              <p className="mt-1 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-cafe-principal/70">
                Tu cafeteria, en buenas manos
              </p>
            </div>

            {/* Saludo + form */}
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/50 mb-1">
                  {saludoPorHora()}
                </p>
                <h1 className="text-[2.2rem] font-black leading-[1.05] tracking-[-0.03em] text-cafe-intenso">
                  Bienvenido<span className="text-verde-menta">.</span>
                </h1>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); siguiente(); }} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-on-surface-variant/60">
                    Usuario
                  </label>
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder="Escribe tu usuario"
                    value={identificador}
                    onChange={(e) => { setIdentificador(e.target.value); if (errorId) setErrorId(null); }}
                    autoFocus
                    className="h-14 w-full rounded-2xl border-0 bg-white/70 px-4 text-[1rem] font-semibold text-cafe-intenso shadow-[0_2px_16px_-4px_rgba(43,31,25,0.10)] outline-none ring-2 ring-transparent placeholder:text-cafe-intenso/30 backdrop-blur-sm transition-all duration-200 focus:bg-white focus:ring-cafe-intenso/20"
                  />
                  {errorId && (
                    <p role="alert" className="text-body-sm font-medium text-red-600 mt-0.5">{errorId}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={identificador.trim().length === 0 || verificando}
                  className="group flex h-14 w-full items-center justify-between rounded-2xl bg-cafe-intenso px-5 text-crema transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-cafe-intenso/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-[0.9rem] font-bold">{verificando ? "Verificando..." : "Continuar"}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5">
                    <ArrowRight weight="light" className="h-4 w-4" />
                  </span>
                </button>
              </form>
            </div>
            <div />
          </div>
        )}

        {/* ── Paso 2: PIN con teclado en pantalla ── */}
        {paso === "pin" && (
          <div className="flex flex-1 flex-col pb-[26rem]">

            {/* Volver */}
            <div className="pt-10">
              <button
                onClick={volver}
                className="flex w-fit items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-[0.75rem] font-semibold text-cafe-intenso/60 backdrop-blur-sm transition-colors hover:text-cafe-intenso"
              >
                <ArrowLeft weight="light" className="h-3.5 w-3.5" />
                {identificador}
              </button>
            </div>

            {/* Vito + saludo */}
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <img
                src="/vito-feliz.webp"
                alt="Vito"
                className="h-24 w-24 object-contain"
                style={{ filter: "drop-shadow(0 8px 16px rgba(43,31,25,0.15))" }}
              />
              <p className="mt-3 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/50">
                PIN de acceso
              </p>
              <h1 className="mt-1 text-[2rem] font-black leading-tight tracking-[-0.02em] text-cafe-intenso">
                {nombreReal ? `Hola, ${nombreReal.split(" ")[0]}` : "Tu PIN"}
                <span className="text-verde-menta">.</span>
              </h1>

              {/* Puntos del PIN */}
              <div className="mt-6 flex items-center justify-center gap-3">
                {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5 rounded-full transition-all duration-200",
                      errorPin
                        ? "bg-red-400 scale-110"
                        : pin.length > i
                          ? "bg-cafe-intenso scale-110"
                          : "bg-cafe-intenso/15",
                    )}
                  />
                ))}
              </div>

              {errorPin && (
                <p role="alert" className="mt-3 text-body-sm font-medium text-red-600">{errorPin}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Teclado numerico en pantalla — glassmorphism fijo abajo ── */}
        {paso === "pin" && (
          <div
            className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-sm px-5"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
          >
            {/* Panel glass */}
            <div
              className="rounded-3xl p-4"
              style={{
                background: "rgba(253,250,246,0.72)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 -4px 32px -8px rgba(43,31,25,0.12), inset 0 1px 0 rgba(255,255,255,0.8), 0 0 0 1px rgba(43,31,25,0.06)",
              }}
            >
              <div className="grid grid-cols-3 gap-2.5">
                {TECLAS.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => presionarTecla(t)}
                    disabled={t === "" || cargando}
                    aria-label={t === "<" ? "Borrar" : t === "" ? "" : t}
                    className={cn(
                      "flex h-14 items-center justify-center rounded-2xl text-xl font-bold transition-all duration-150",
                      "active:scale-[0.94] active:duration-75",
                      t === ""
                        ? "pointer-events-none"
                        : t === "<"
                          ? "bg-white/50 text-cafe-intenso/50 hover:bg-white/80"
                          : "bg-white/60 text-cafe-intenso hover:bg-white shadow-[0_1px_4px_rgba(43,31,25,0.08)]",
                    )}
                  >
                    {t === "<" ? (
                      <Backspace weight="light" className="h-5 w-5" />
                    ) : (
                      t
                    )}
                  </button>
                ))}
              </div>

              {/* Boton entrar */}
              <button
                onClick={() => enviarPin()}
                disabled={pin.length !== PIN_LENGTH || cargando}
                className="mt-2.5 group flex h-13 w-full items-center justify-between rounded-2xl bg-cafe-intenso px-5 text-crema transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-30"
              >
                <span className="text-[0.9rem] font-bold">
                  {cargando ? "Entrando..." : "Entrar"}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                  <ArrowRight weight="light" className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
