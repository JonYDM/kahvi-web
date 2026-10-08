import { useState } from "react";
import {
  Banknote,
  CreditCard,
  RefreshCw,
  Smartphone,
  Wallet,
  XCircle,
} from "lucide-react";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { Button, Drawer, Input, SkeletonFila } from "@/components/ui";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import { estadoComandaLabel } from "@/lib/enums";
import { formatCurrency } from "@/lib/format";
import { MetodoPago, type ComandaDto } from "@/types/api";
import { useComandasActivas, useCancelarComanda, useCobrarComanda } from "../hooks";

const METODOS: { valor: MetodoPago; label: string; icon: typeof Banknote }[] = [
  { valor: MetodoPago.Efectivo, label: "Efectivo", icon: Banknote },
  { valor: MetodoPago.Tarjeta, label: "Tarjeta", icon: CreditCard },
  { valor: MetodoPago.Transferencia, label: "Transferencia", icon: Smartphone },
];

/** Módulo de caja: cobra las comandas en estado 'Lista'. */
export function CajaPage() {
  const { data: comandas, isLoading, isError, dataUpdatedAt } = useComandasActivas();
  const cobrar = useCobrarComanda();
  const cancelar = useCancelarComanda();
  const toast = useToast();

  const [comandaSel, setComandaSel] = useState<ComandaDto | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(MetodoPago.Efectivo);
  const [montoRecibido, setMontoRecibido] = useState("");
  const [exito, setExito] = useState<{ total: number; cambio: number | null } | null>(null);

  // Comandas listas para cobrar
  const listas = (comandas ?? []).filter((c) => c.estado === "Lista");
  // Comandas activas (Recibida + EnPreparacion) para referencia
  const enProceso = (comandas ?? []).filter(
    (c) => c.estado === "Recibida" || c.estado === "EnPreparacion",
  );

  const ultimaActualizacion = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  const totalSel = comandaSel?.total ?? 0;
  const cambio =
    metodoPago === MetodoPago.Efectivo && montoRecibido && Number(montoRecibido) >= totalSel
      ? Number(montoRecibido) - totalSel
      : null;

  async function handleCobrar() {
    if (!comandaSel) return;
    const recibido = montoRecibido ? Number(montoRecibido) : undefined;
    try {
      await cobrar.mutateAsync({
        id: comandaSel.id,
        data: {
          metodoPago,
          montoRecibido: metodoPago === MetodoPago.Efectivo ? recibido : undefined,
        },
      });
      setExito({ total: totalSel, cambio: cambio });
      toast.exito(`Comanda #${comandaSel.folio} cobrada`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cobrar.");
    }
  }

  async function handleCancelar(comanda: ComandaDto) {
    try {
      await cancelar.mutateAsync(comanda.id);
      toast.exito(`Comanda #${comanda.folio} cancelada`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cancelar.");
    }
  }

  function cerrarDrawer() {
    setComandaSel(null);
    setMetodoPago(MetodoPago.Efectivo);
    setMontoRecibido("");
    setExito(null);
  }

  return (
    <PantallaConHeader
      titulo="Caja"
      subtitulo={
        <p className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
          <RefreshCw className="h-3.5 w-3.5 text-primary-container" aria-hidden />
          {ultimaActualizacion ? `Actualizado ${ultimaActualizacion}` : "Cargando…"}
        </p>
      }
    >
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <SkeletonFila key={i} />)}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl bg-error-container/40 p-6 text-center text-body-sm text-on-error-container">
          No se pudieron cargar las comandas.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-6">
          {/* Sección: listas para cobrar */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-label-lg font-bold text-cafe-intenso">
              <Wallet className="h-4 w-4 text-verde-menta" aria-hidden />
              Listas para cobrar
              {listas.length > 0 && (
                <span className="ml-1 rounded-full bg-verde-menta px-2 py-0.5 text-label-sm font-black text-cafe-intenso">
                  {listas.length}
                </span>
              )}
            </h2>

            {listas.length === 0 ? (
              <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 text-center">
                <p className="text-4xl mb-2" aria-hidden>☕</p>
                <p className="text-body-md text-on-surface-variant">
                  No hay comandas listas para cobrar.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {listas.map((comanda) => (
                  <div
                    key={comanda.id}
                    className="flex flex-col gap-3 rounded-2xl border-2 border-verde-menta/50 bg-verde-menta/10 p-4 shadow-soft"
                  >
                    {/* Cabecera */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-verde-menta text-cafe-intenso text-label-lg font-black">
                          #{comanda.folio}
                        </span>
                        <div>
                          <p className="text-headline-sm font-bold text-cafe-intenso">{comanda.mesa}</p>
                          <p className="text-body-sm text-cafe-principal">{comanda.meseroNombre}</p>
                        </div>
                      </div>
                      <span className="tabular text-headline-md font-black text-cafe-intenso shrink-0">
                        {formatCurrency(comanda.total)}
                      </span>
                    </div>

                    {/* Ítems compactos */}
                    <ul className="flex flex-col gap-1 rounded-xl bg-white/60 px-3 py-2">
                      {comanda.items.map((item, i) => (
                        <li key={i} className="flex justify-between gap-2 text-body-md">
                          <span className="min-w-0 truncate text-cafe-intenso">
                            {item.cantidad}× {item.nombre}
                          </span>
                          <span className="tabular shrink-0 text-cafe-principal">
                            {formatCurrency(item.precioUnitario * item.cantidad)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelar(comanda)}
                        loading={cancelar.isPending}
                        className="text-error-st hover:bg-error-container/30"
                      >
                        <XCircle className="h-4 w-4" aria-hidden />
                        Cancelar
                      </Button>
                      <Button
                        fullWidth
                        size="sm"
                        onClick={() => setComandaSel(comanda)}
                        className="bg-cafe-intenso text-crema hover:bg-cafe-intenso/90 font-bold"
                      >
                        <Wallet className="h-4 w-4" aria-hidden />
                        Cobrar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sección: en proceso (informativo, sin acción) */}
          {enProceso.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-label-lg font-bold text-on-surface-variant">
                En preparación
                <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
                  {enProceso.length}
                </span>
              </h2>
              <div className="flex flex-col gap-2">
                {enProceso.map((comanda) => (
                  <div
                    key={comanda.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-label-sm font-bold text-on-surface-variant">#{comanda.folio}</span>
                      <span className="text-label-md font-semibold text-on-surface">{comanda.mesa}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full border border-outline-variant/40 px-2 py-0.5 text-label-sm text-on-surface-variant">
                        {estadoComandaLabel[comanda.estado]}
                      </span>
                      <span className="tabular text-label-md font-bold text-on-surface-variant">
                        {formatCurrency(comanda.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Drawer de cobro */}
      <Drawer
        open={!!comandaSel}
        onClose={cerrarDrawer}
        title={exito ? "" : `Cobrar comanda #${comandaSel?.folio ?? ""}`}
        descripcion={exito ? undefined : `${comandaSel?.mesa ?? ""} · ${comandaSel?.meseroNombre ?? ""}`}
      >
        {exito ? (
          <CobroExitoso total={exito.total} cambio={exito.cambio} onListo={cerrarDrawer} />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Resumen de ítems */}
            <ul className="flex flex-col gap-1 rounded-xl bg-surface-container-low px-3 py-2.5">
              {(comandaSel?.items ?? []).map((item, i) => (
                <li key={i} className="flex justify-between gap-2 text-body-md">
                  <span className="min-w-0 truncate text-on-surface">{item.cantidad}× {item.nombre}</span>
                  <span className="tabular shrink-0 text-on-surface-variant">
                    {formatCurrency(item.precioUnitario * item.cantidad)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Método de pago */}
            <div>
              <p className="mb-1.5 text-label-md font-semibold text-on-surface-variant">Método de pago</p>
              <div className="grid grid-cols-3 gap-2">
                {METODOS.map((m) => {
                  const activo = metodoPago === m.valor;
                  return (
                    <button
                      key={m.valor}
                      type="button"
                      onClick={() => setMetodoPago(m.valor)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors",
                        activo
                          ? "border-cafe-intenso bg-cafe-intenso/10 text-cafe-intenso"
                          : "border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant",
                      )}
                    >
                      <m.icon className="h-5 w-5" aria-hidden />
                      <span className="text-label-sm font-bold">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {metodoPago === MetodoPago.Efectivo && (
              <div>
                <Input
                  label="Monto recibido (opcional)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                />
                {cambio !== null && cambio >= 0 && (
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-verde-menta/20 px-4 py-2.5">
                    <span className="text-label-md font-semibold text-cafe-intenso">Cambio a entregar</span>
                    <span className="tabular text-headline-sm font-bold text-cafe-intenso">
                      {formatCurrency(cambio)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
              <span className="text-on-surface-variant">Total</span>
              <span className="tabular text-headline-md font-bold text-on-surface">
                {formatCurrency(totalSel)}
              </span>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={handleCobrar}
              loading={cobrar.isPending}
              className="bg-cafe-intenso text-crema hover:bg-cafe-intenso/90 font-bold"
            >
              <Wallet className="h-5 w-5" aria-hidden />
              Confirmar cobro
            </Button>
          </div>
        )}
      </Drawer>
    </PantallaConHeader>
  );
}

function CobroExitoso({
  total,
  cambio,
  onListo,
}: {
  total: number;
  cambio: number | null;
  onListo: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center" role="status" aria-live="polite">
      <div className="relative grid h-24 w-24 place-items-center">
        <span className="cobro-halo absolute inset-0 rounded-full bg-verde-menta/20" aria-hidden />
        <svg viewBox="0 0 56 56" className="cobro-pop relative h-24 w-24" aria-hidden>
          <circle
            cx="28" cy="28" r="26"
            fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
            className="cobro-circulo text-verde-menta"
          />
          <path
            d="M17 29 l7 7 l15 -16"
            fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
            className="cobro-check text-verde-menta"
          />
        </svg>
      </div>
      <div className="cobro-datos flex w-full flex-col items-center gap-4">
        <div>
          <p className="text-headline-sm font-bold text-cafe-intenso">¡Cobrado!</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">Total cobrado</p>
          <p className="tabular text-headline-lg font-bold text-cafe-intenso">{formatCurrency(total)}</p>
        </div>
        {cambio != null && cambio > 0 && (
          <div className="flex w-full items-center justify-between rounded-xl bg-verde-menta/20 px-4 py-3">
            <span className="text-label-md font-semibold text-cafe-intenso">Cambio a entregar</span>
            <span className="tabular text-headline-sm font-bold text-cafe-intenso">{formatCurrency(cambio)}</span>
          </div>
        )}
        <Button fullWidth size="lg" onClick={onListo} className="bg-cafe-intenso text-crema hover:bg-cafe-intenso/90">
          Listo
        </Button>
      </div>
    </div>
  );
}
