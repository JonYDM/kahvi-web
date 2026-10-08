import { useMemo, useState } from "react";
import {
  Money,
  CreditCard,
  Minus,
  Package,
  Plus,
  MagnifyingGlass,
  Sliders,
  DeviceMobile,
  Trash,
} from "@phosphor-icons/react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import {
  Button,
  Drawer,
  Input,
  SkeletonFila,
} from "@/components/ui";
import { useAuth } from "@/features/auth";
import { useCategorias } from "@/features/categorias";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { MetodoPago, RolUsuario, type Producto } from "@/types/api";
import { useCatalogo, useRegistrarVenta } from "../hooks";
import { AgregarProductoModal } from "../components/AgregarProductoModal";
import { EditarProductoModal } from "../components/EditarProductoModal";

interface LineaCarrito {
  producto: Producto;
  cantidad: number;
}

const METODOS: { valor: MetodoPago; label: string; icon: typeof Money }[] = [
  { valor: MetodoPago.Efectivo, label: "Efectivo", icon: Money },
  { valor: MetodoPago.Tarjeta, label: "Tarjeta", icon: CreditCard },
  { valor: MetodoPago.Transferencia, label: "Transfer.", icon: DeviceMobile },
];

/** Punto de venta para ventas directas (sin comanda). Solo Admin. */
export function PosPage() {
  const { sesion } = useAuth();
  const { data: productos, isLoading, isError } = useCatalogo();
  const { data: categorias } = useCategorias();
  const registrarVenta = useRegistrarVenta();
  const toast = useToast();

  const [carrito, setCarrito] = useState<Record<string, LineaCarrito>>({});
  const [texto, setTexto] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [modalProducto, setModalProducto] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [cobroAbierto, setCobroAbierto] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(MetodoPago.Efectivo);
  const [montoRecibido, setMontoRecibido] = useState("");
  const [recibo, setRecibo] = useState<{ total: number; cambio: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const esAdmin = sesion?.rol === RolUsuario.Administrador;

  // CategorÃ­as ordenadas para los chips
  const categoriasOrdenadas = useMemo(
    () => [...(categorias ?? [])].sort((a, b) => a.orden - b.orden),
    [categorias],
  );

  // Mapa idâ†’nombre para mostrar en los chips de producto
  const categoriaNombrePorId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categorias ?? []) map[c.id] = c.nombre;
    return map;
  }, [categorias]);

  const lineas = Object.values(carrito);
  const totalArticulos = lineas.reduce((s, l) => s + l.cantidad, 0);
  const total = useMemo(
    () => lineas.reduce((s, l) => s + l.producto.precio * l.cantidad, 0),
    [lineas],
  );

  const visibles = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return (productos ?? []).filter((p) => {
      if (categoriaId !== null && p.categoriaId !== categoriaId) return false;
      if (q && !p.nombre.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [productos, categoriaId, texto]);

  function agregar(p: Producto) {
    setCarrito((prev) => {
      const actual = prev[p.id]?.cantidad ?? 0;
      return { ...prev, [p.id]: { producto: p, cantidad: actual + 1 } };
    });
  }

  function quitar(id: string) {
    setCarrito((prev) => {
      const actual = prev[id]?.cantidad ?? 0;
      if (actual <= 1) {
        const copia = { ...prev };
        delete copia[id];
        return copia;
      }
      return { ...prev, [id]: { ...prev[id], cantidad: actual - 1 } };
    });
  }

  function cerrarCobro() {
    setCobroAbierto(false);
    setRecibo(null);
  }

  async function cobrar() {
    setError(null);
    const recibido = montoRecibido ? Number(montoRecibido) : null;
    if (metodoPago === MetodoPago.Efectivo && recibido != null && recibido < total) {
      setError("El monto recibido no cubre el total.");
      return;
    }
    try {
      const resp = await registrarVenta.mutateAsync({
        items: lineas.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad })),
        metodoPago,
        montoRecibido: metodoPago === MetodoPago.Efectivo ? recibido : null,
      });
      setRecibo({ total: resp.total, cambio: resp.cambio });
      setCarrito({});
      setMontoRecibido("");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo registrar la venta.";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <PantallaConHeader
      titulo="Punto de venta"
      subtitulo={<p className="text-body-sm text-on-surface-variant">Venta directa</p>}
      accion={
        esAdmin ? (
          <Button size="icon" onClick={() => setModalProducto(true)} aria-label="Nuevo producto">
            <Plus weight='light' className="h-5 w-5" aria-hidden />
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4 pb-20">
        {/* Buscador */}
        <div className="relative">
          <MagnifyingGlass
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
            aria-hidden
          />
          <Input
            variant="soft"
            aria-label="Buscar productos"
            placeholder="Buscar producto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="h-12 pl-12"
          />
        </div>

        {/* Chips de categorÃ­a dinÃ¡mica */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setCategoriaId(null)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-label-md font-semibold transition-colors",
              categoriaId === null
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:text-on-surface",
            )}
          >
            Todos
          </button>
          {categoriasOrdenadas.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaId(cat.id)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-label-md font-semibold transition-colors",
                categoriaId === cat.id
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:text-on-surface",
              )}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* CatÃ¡logo */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonFila key={i} />)}
          </div>
        ) : isError ? (
          <div className="rounded-2xl bg-surface-container-lowest p-8 text-center text-body-sm text-error-st shadow-soft">
            No se pudo cargar el catÃ¡logo.
          </div>
        ) : visibles.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {visibles.map((p) => (
              <ProductoCard
                key={p.id}
                producto={p}
                categoriaNombre={categoriaNombrePorId[p.categoriaId]}
                enCarrito={carrito[p.id]?.cantidad ?? 0}
                esAdmin={esAdmin}
                onAgregar={() => agregar(p)}
                onQuitar={() => quitar(p.id)}
                onEditar={() => setEditando(p)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            titulo={texto || categoriaId !== null ? "Sin resultados" : "CatÃ¡logo vacÃ­o"}
            descripcion={
              texto || categoriaId !== null
                ? "No hay productos que coincidan."
                : esAdmin
                  ? "Agrega tu primer producto para empezar a vender."
                  : "AÃºn no hay productos en el catÃ¡logo."
            }
          />
        )}
      </div>

      {/* Barra flotante del carrito */}
      {totalArticulos > 0 && (
        <div
          className="fixed inset-x-0 z-30 px-[5%]"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
        >
          <button
            onClick={() => setCobroAbierto(true)}
            className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 rounded-full bg-primary-container px-5 py-3.5 text-on-primary shadow-primary-glow transition-transform active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-label-md font-bold">
                {totalArticulos}
              </span>
              <span className="text-label-lg font-bold">Ver carrito</span>
            </span>
            <span className="tabular text-label-lg font-bold">{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {/* Drawer de cobro */}
      <Drawer
        open={cobroAbierto}
        onClose={cerrarCobro}
        title={recibo ? "" : "Cobrar venta"}
        descripcion={recibo ? undefined : "Revisa los productos y registra el cobro."}
      >
        {recibo ? (
          <CobroExitoso total={recibo.total} cambio={recibo.cambio} onListo={cerrarCobro} />
        ) : (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {lineas.map((l) => (
                <li
                  key={l.producto.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low p-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-label-md font-semibold text-on-surface">{l.producto.nombre}</p>
                    <p className="text-body-sm text-on-surface-variant">{formatCurrency(l.producto.precio)} c/u</p>
                    {/* Margen: solo visible para Admin si tiene costo */}
                    {esAdmin && l.producto.costo != null && (
                      <p className="text-body-sm text-on-surface-variant">
                        Margen: {formatCurrency(l.producto.precio - l.producto.costo)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => quitar(l.producto.id)}
                      aria-label="Quitar uno"
                      className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container text-on-surface-variant"
                    >
                      {l.cantidad <= 1 ? <Trash weight='light' className="h-4 w-4" /> : <Minus weight='light' className="h-4 w-4" />}
                    </button>
                    <span className="w-5 text-center text-label-md font-bold">{l.cantidad}</span>
                    <button
                      onClick={() => agregar(l.producto)}
                      aria-label="Agregar uno"
                      className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container text-on-surface-variant"
                    >
                      <Plus weight='light' className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* MÃ©todo de pago */}
            <div>
              <p className="mb-1.5 text-label-md font-semibold text-on-surface-variant">MÃ©todo de pago</p>
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
                          ? "border-primary-container bg-primary-container/10 text-primary-container"
                          : "border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant",
                      )}
                    >
                      <m.icon weight='light' className="h-5 w-5" aria-hidden />
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
                {montoRecibido && Number(montoRecibido) >= total && (
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-verde-menta/20 px-4 py-2.5">
                    <span className="text-label-md font-semibold text-cafe-intenso">Cambio a entregar</span>
                    <span className="tabular text-headline-sm font-bold text-cafe-intenso">
                      {formatCurrency(Number(montoRecibido) - total)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
              <span className="text-on-surface-variant">Total</span>
              <span className="tabular text-headline-md font-bold text-on-surface">{formatCurrency(total)}</span>
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-error-container/60 px-4 py-2.5 text-center text-body-sm font-medium text-on-error-container">
                {error}
              </p>
            )}

            <Button
              fullWidth
              size="lg"
              onClick={cobrar}
              loading={registrarVenta.isPending}
              disabled={lineas.length === 0}
            >
              Cobrar {formatCurrency(total)}
            </Button>
          </div>
        )}
      </Drawer>

      {esAdmin && (
        <AgregarProductoModal open={modalProducto} onClose={() => setModalProducto(false)} />
      )}
      {esAdmin && editando && (
        <EditarProductoModal open={!!editando} onClose={() => setEditando(null)} producto={editando} />
      )}
    </PantallaConHeader>
  );
}

function ProductoCard({
  producto,
  categoriaNombre,
  enCarrito,
  esAdmin,
  onAgregar,
  onQuitar,
  onEditar,
}: {
  producto: Producto;
  categoriaNombre?: string;
  enCarrito: number;
  esAdmin: boolean;
  onAgregar: () => void;
  onQuitar: () => void;
  onEditar: () => void;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-2xl border bg-surface-container-lowest p-3.5 shadow-soft transition-transform",
        enCarrito > 0 ? "border-primary-container" : "border-outline-variant/40",
      )}
    >
      <button
        onClick={onAgregar}
        className="flex flex-1 flex-col items-start text-left"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-caramelo/20 text-cafe-principal">
          <Package weight='light' className="h-5 w-5" aria-hidden />
        </div>
        <p className="mt-2 line-clamp-2 text-label-lg font-bold text-on-surface">{producto.nombre}</p>
        {categoriaNombre && (
          <p className="text-body-sm text-on-surface-variant">{categoriaNombre}</p>
        )}
        <p className="mt-1 tabular text-headline-sm font-bold text-primary-container">
          {formatCurrency(producto.precio)}
        </p>
        {/* Costo y margen: solo visible para Admin */}
        {esAdmin && producto.costo != null && (
          <p className="text-body-sm text-on-surface-variant">
            Costo: {formatCurrency(producto.costo)} Â· Margen: {formatCurrency(producto.precio - producto.costo)}
          </p>
        )}
      </button>

      <div className="mt-2.5">
        {enCarrito > 0 ? (
          <div className="flex items-center justify-between rounded-xl bg-primary-container/10 p-1">
            <button
              onClick={onQuitar}
              aria-label={`Quitar uno de ${producto.nombre}`}
              className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container-lowest text-primary-container shadow-soft active:scale-95"
            >
              {enCarrito <= 1 ? <Trash weight='light' className="h-4 w-4" /> : <Minus weight='light' className="h-4 w-4" />}
            </button>
            <span className="tabular text-label-lg font-bold text-primary-container">{enCarrito}</span>
            <button
              onClick={onAgregar}
              aria-label={`Agregar uno de ${producto.nombre}`}
              className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container-lowest text-primary-container shadow-soft active:scale-95"
            >
              <Plus weight='light' className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant">
              {formatCurrency(producto.precio)}
            </span>
            {esAdmin && (
              <button
                onClick={onEditar}
                aria-label={`Editar ${producto.nombre}`}
                className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <Sliders weight='light' className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
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
        <span className="cobro-halo absolute inset-0 rounded-full bg-primary-container/15" aria-hidden />
        <svg viewBox="0 0 56 56" className="cobro-pop relative h-24 w-24" aria-hidden>
          <circle
            cx="28" cy="28" r="26"
            fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
            className="cobro-circulo text-primary-container"
          />
          <path
            d="M17 29 l7 7 l15 -16"
            fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
            className="cobro-check text-primary-container"
          />
        </svg>
      </div>
      <div className="cobro-datos flex w-full flex-col items-center gap-4">
        <div>
          <p className="text-headline-sm font-bold text-on-surface">Â¡Cobro realizado!</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">Total cobrado</p>
          <p className="tabular text-headline-lg font-bold text-on-surface">{formatCurrency(total)}</p>
        </div>
        {cambio != null && cambio > 0 && (
          <div className="flex w-full items-center justify-between rounded-xl bg-verde-menta/20 px-4 py-3">
            <span className="text-label-md font-semibold text-cafe-intenso">Cambio a entregar</span>
            <span className="tabular text-headline-sm font-bold text-cafe-intenso">{formatCurrency(cambio)}</span>
          </div>
        )}
        <Button fullWidth size="lg" onClick={onListo}>Listo</Button>
      </div>
    </div>
  );
}

