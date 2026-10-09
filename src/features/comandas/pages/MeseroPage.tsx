import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Package,
  PencilSimple,
  Plus,
  MagnifyingGlass,
  ShoppingBag,
  Note,
  Storefront,
  Trash,
  X,
} from "@phosphor-icons/react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { Button, Drawer, SkeletonFila } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { useCategorias } from "@/features/categorias";
import { useCatalogo } from "@/features/pos/hooks";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { Producto } from "@/types/api";
import { RolUsuario } from "@/types/api";
import { useEnviarComanda, useComandasActivas, useCancelarComanda } from "../hooks";

// â”€â”€â”€ Tipos locales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Paso = 0 | 1 | 2 | 3;
type TipoServicio = "mesa" | "llevar";

const ETIQUETAS_PASO = ["Servicio", "Productos", "Revisar", "Listo"];
const MESAS_RAPIDAS = ["1", "2", "3", "4", "5", "6", "7", "8"];

interface LineaCarrito {
  producto: Producto;
  cantidad: number;
  nota: string;
}

// â”€â”€â”€ Componente principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Pantalla del mesero con flujo en 4 pasos: Servicio â†’ Productos â†’ Revisar â†’ Confirmación */
export function MeseroPage() {
  const { sesion } = useAuth();
  const { data: productos, isLoading, isError } = useCatalogo();
  const { data: categorias } = useCategorias();
  const { data: todasComandas } = useComandasActivas();
  const enviarComanda = useEnviarComanda();
  const cancelarComanda = useCancelarComanda();
  const toast = useToast();

  // Comandas activas del mesero actual
  const misComandas = (todasComandas ?? []).filter(
    (c) =>
      (c.estado === "Recibida" || c.estado === "EnPreparacion") &&
      (sesion?.rol === RolUsuario.Administrador || c.meseroNombre === sesion?.nombre),
  );

  async function handleCancelar(id: string, folio: number) {
    const ok = window.confirm(`Cancelar comanda #${folio}?`);
    if (!ok) return;
    try {
      await cancelarComanda.mutateAsync(id);
      toast.exito(`Comanda #${folio} cancelada.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cancelar.");
    }
  }

  // Estado del flujo
  const [paso, setPaso] = useState<Paso>(0);

  // Paso 0 â€” tipo de servicio
  const [tipo, setTipo] = useState<TipoServicio>("mesa");
  const [mesa, setMesa] = useState("1");
  const [nombreCliente, setNombreCliente] = useState("");
  const [drawerComandas, setDrawerComandas] = useState(false);

  // Paso 1 â€” productos
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<Record<string, LineaCarrito>>({});
  const [editandoNota, setEditandoNota] = useState<string | null>(null);
  const [notaTemp, setNotaTemp] = useState("");

  // Paso 3 â€” confirmación
  const [folioConfirmado, setFolioConfirmado] = useState<number | null>(null);

  // Derivados
  const lineas = Object.values(carrito);
  const totalArticulos = lineas.reduce((s, l) => s + l.cantidad, 0);
  const total = useMemo(
    () => lineas.reduce((s, l) => s + l.producto.precio * l.cantidad, 0),
    [lineas],
  );

  // Categorías ordenadas para los chips
  const categoriasOrdenadas = useMemo(
    () => [...(categorias ?? [])].sort((a, b) => a.orden - b.orden),
    [categorias],
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (productos ?? []).filter((p) => {
      if (categoriaId !== null && p.categoriaId !== categoriaId) return false;
      if (q && !p.nombre.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [productos, categoriaId, busqueda]);

  // Texto de referencia de mesa para mostrar en la UI
  const refMesa = tipo === "llevar" ? "Para llevar" : `Mesa ${mesa}`;

  // â”€â”€â”€ Acciones del carrito â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function agregar(p: Producto) {
    setCarrito((prev) => {
      const actual = prev[p.id]?.cantidad ?? 0;
      return {
        ...prev,
        [p.id]: { producto: p, cantidad: actual + 1, nota: prev[p.id]?.nota ?? "" },
      };
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

  function eliminar(id: string) {
    setCarrito((prev) => {
      const copia = { ...prev };
      delete copia[id];
      return copia;
    });
  }

  function guardarNota() {
    if (!editandoNota) return;
    setCarrito((prev) => ({
      ...prev,
      [editandoNota]: { ...prev[editandoNota], nota: notaTemp },
    }));
    setEditandoNota(null);
  }

  // â”€â”€â”€ Envío â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function confirmar() {
    if (lineas.length === 0 || enviarComanda.isPending) return;
    try {
      const resp = await enviarComanda.mutateAsync({
        mesa: tipo === "llevar" ? "" : mesa,
        meseroNombre: sesion?.nombre ?? "Mesero",
        items: lineas.map((l) => ({
          productoId: l.producto.id,
          nombre: l.producto.nombre,
          cantidad: l.cantidad,
          precio: l.producto.precio,
          nota: l.nota || undefined,
        })),
        esParaLlevar: tipo === "llevar",
        nombreCliente: tipo === "llevar" ? nombreCliente.trim() || null : null,
      });
      // El backend devuelve { id } â€” el folio lo extraemos de las comandas activas,
      // pero para la confirmación usamos un número derivado del id.
      // Como fallback, usamos un folio ficticio para mostrar al usuario.
      setFolioConfirmado(null); // se mostrará el mensaje sin folio específico
      void resp; // La data no tiene folio directo, solo id
      setPaso(3);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo enviar la comanda.";
      toast.error(msg);
    }
  }

  function nuevoPedido() {
    setCarrito({});
    setMesa("1");
    setTipo("mesa");
    setNombreCliente("");
    setBusqueda("");
    setCategoriaId(null);
    setFolioConfirmado(null);
    setPaso(0);
  }

  // â”€â”€â”€ Validaciones por paso â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function puedeAvanzar(): boolean {
    if (paso === 0) {
      if (tipo === "mesa") return mesa.trim().length > 0;
      return true; // para llevar siempre puede avanzar
    }
    if (paso === 1) return totalArticulos > 0;
    if (paso === 2) return totalArticulos > 0;
    return false;
  }

  function irA(destino: Paso) {
    setPaso(destino);
  }

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <PantallaConHeader titulo="Nueva comanda">
      {/* Barra de progreso — vive en el contenido para reactualizar con paso */}
      {paso < 3 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
              {ETIQUETAS_PASO[paso]}
            </span>
            <span className="text-[11px] text-on-surface-variant/60">
              {paso + 1} / {ETIQUETAS_PASO.length - 1}
            </span>
          </div>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-outline-variant/20">
            <div
              className="h-full rounded-full bg-cafe-intenso transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{ width: `${((paso) / (ETIQUETAS_PASO.length - 2)) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 pb-48">

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PASO 0: TIPO DE SERVICIO â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {paso === 0 && (
          <section aria-label="Tipo de servicio">

            {/* ── Mis comandas activas — solo la mas reciente ── */}
            {misComandas.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant/60">
                    Mis comandas activas
                  </p>
                  {misComandas.length > 1 && (
                    <button
                      onClick={() => setDrawerComandas(true)}
                      className="text-[11px] font-semibold text-primary-container hover:underline"
                    >
                      Ver {misComandas.length} →
                    </button>
                  )}
                </div>

                {/* Solo la mas reciente */}
                {(() => {
                  const c = misComandas[0];
                  return (
                    <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 shadow-soft">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-label-md font-black text-cafe-intenso">#{c.folio}</span>
                          <span className="text-body-sm text-on-surface-variant">{c.esParaLlevar ? "Para llevar" : `Mesa ${c.mesa}`}</span>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            c.estado === "Recibida" ? "bg-caramelo/20 text-cafe-intenso" : "bg-orange-100 text-orange-800",
                          )}>
                            {c.estado === "Recibida" ? "Recibida" : "Preparando"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-body-sm text-on-surface-variant truncate">
                          {c.items.map((it) => it.nombre).join(", ")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelar(c.id, c.folio)}
                        disabled={cancelarComanda.isPending}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-error-st/50 hover:bg-error-container/30 hover:text-error-st transition-colors disabled:opacity-40"
                      >
                        <X weight="light" className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })()}
                <div className="mt-4 border-b border-outline-variant/20" />
              </div>
            )}

            {/* Drawer con todas las comandas activas */}
            <Drawer
              open={drawerComandas}
              onClose={() => setDrawerComandas(false)}
              title="Mis comandas activas"
              descripcion={`${misComandas.length} en curso`}
            >
              <div className="flex flex-col gap-3 pt-2">
                {misComandas.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 shadow-soft">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-label-md font-black text-cafe-intenso">#{c.folio}</span>
                        <span className="text-body-sm text-on-surface-variant">{c.esParaLlevar ? "Para llevar" : `Mesa ${c.mesa}`}</span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          c.estado === "Recibida" ? "bg-caramelo/20 text-cafe-intenso" : "bg-orange-100 text-orange-800",
                        )}>
                          {c.estado === "Recibida" ? "Recibida" : "Preparando"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-body-sm text-on-surface-variant">
                        {c.items.map((it) => `${it.nombre}${it.cantidad > 1 ? ` x${it.cantidad}` : ""}`).join(", ")}
                      </p>
                    </div>
                    <button
                      onClick={async () => { await handleCancelar(c.id, c.folio); if (misComandas.length <= 1) setDrawerComandas(false); }}
                      disabled={cancelarComanda.isPending}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-error-st/50 hover:bg-error-container/30 hover:text-error-st transition-colors disabled:opacity-40"
                    >
                      <X weight="light" className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Drawer>

            <PasoTitulo icon={Storefront} titulo="¿Dónde es el pedido?" sub="Elige mesa o para llevar" />

            {/* Selector Mesa / Para llevar */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setTipo("mesa")}
                className={cn(
                  "flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all duration-200",
                  tipo === "mesa"
                    ? "border-primary-container bg-primary-container/10 shadow-soft"
                    : "border-outline-variant/40 bg-surface-container-lowest",
                )}
              >
                <Storefront
                  className={cn(
                    "h-7 w-7",
                    tipo === "mesa" ? "text-primary-container" : "text-on-surface-variant",
                  )}
                  aria-hidden
                />
                <p className="mt-3 text-label-lg font-bold text-on-surface">En mesa</p>
                <p className="text-body-sm text-on-surface-variant">El cliente consume aquí</p>
              </button>

              <button
                onClick={() => setTipo("llevar")}
                className={cn(
                  "flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all duration-200",
                  tipo === "llevar"
                    ? "border-primary-container bg-primary-container/10 shadow-soft"
                    : "border-outline-variant/40 bg-surface-container-lowest",
                )}
              >
                <ShoppingBag
                  className={cn(
                    "h-7 w-7",
                    tipo === "llevar" ? "text-primary-container" : "text-on-surface-variant",
                  )}
                  aria-hidden
                />
                <p className="mt-3 text-label-lg font-bold text-on-surface">Para llevar</p>
                <p className="text-body-sm text-on-surface-variant">Pedido para salir</p>
              </button>
            </div>

            {/* Selector de mesa (solo si es "mesa") */}
            {tipo === "mesa" && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-label-md font-semibold text-on-surface-variant">
                    Número de mesa
                  </p>
                  <ArrowRight weight="light" className="h-4 w-4 text-on-surface-variant/40" aria-hidden />
                </div>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {MESAS_RAPIDAS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setMesa(n)}
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-label-lg font-bold transition-all active:scale-90",
                        mesa === n
                          ? "bg-cafe-intenso text-crema shadow-soft"
                          : "bg-surface-container-low text-on-surface",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {/* Campo manual para mesas no listadas */}
                <div className="mt-3">
                  <label className="mb-1.5 block text-[0.7rem] font-bold uppercase tracking-[0.1em] text-cafe-intenso/50">Otra mesa</label>
                  <input
                    placeholder="Ej: Barra, Terraza, 9..."
                    value={MESAS_RAPIDAS.includes(mesa) ? "" : mesa}
                    onChange={(e) => setMesa(e.target.value)}
                    className="h-12 w-full rounded-2xl border-0 bg-white/70 px-4 text-body-md text-cafe-intenso shadow-[0_2px_12px_-4px_rgba(43,31,25,0.08)] outline-none ring-2 ring-transparent placeholder:text-cafe-intenso/30 transition-all focus:bg-white focus:ring-cafe-intenso/15"
                  />
                </div>
              </div>
            )}

            {/* Nombre del cliente (solo para llevar) */}
            {tipo === "llevar" && (
              <div className="mt-5">
                <label className="mb-1.5 block text-[0.7rem] font-bold uppercase tracking-[0.1em] text-cafe-intenso/50">Nombre del cliente (opcional)</label>
                <input
                  placeholder="¿Cómo se llama?"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  className="h-12 w-full rounded-2xl border-0 bg-white/70 px-4 text-body-md text-cafe-intenso shadow-[0_2px_12px_-4px_rgba(43,31,25,0.08)] outline-none ring-2 ring-transparent placeholder:text-cafe-intenso/30 transition-all focus:bg-white focus:ring-cafe-intenso/15"
                />
              </div>
            )}
          </section>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PASO 1: PRODUCTOS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {paso === 1 && (
          <section aria-label="Selección de productos">
            <PasoTitulo
              icon={ShoppingBag}
              titulo="Agrega productos"
              sub={refMesa}
            />

            {/* Buscador */}
            <div className="relative mt-5">
              <MagnifyingGlass
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cafe-intenso/40"
                aria-hidden
              />
              <input
                aria-label="Buscar productos"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-12 w-full rounded-2xl border-0 bg-white/70 pl-12 pr-10 text-body-md text-cafe-intenso shadow-[0_2px_12px_-4px_rgba(43,31,25,0.08)] outline-none ring-2 ring-transparent placeholder:text-cafe-intenso/30 backdrop-blur-sm transition-all focus:bg-white focus:ring-cafe-intenso/15"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
                >
                  <X weight='light' className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Chips de categoría (se ocultan al buscar) */}
            {!busqueda.trim() && (
              <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setCategoriaId(null)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-label-md font-semibold transition-colors",
                    categoriaId === null
                      ? "bg-primary-container text-on-primary"
                      : "bg-surface-container text-on-surface-variant",
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
                        : "bg-surface-container text-on-surface-variant",
                    )}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>
            )}

            {/* Grilla de productos */}
            <div className="mt-4">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonFila key={i} />)}
                </div>
              ) : isError ? (
                <div className="rounded-2xl bg-surface-container-lowest p-8 text-center text-body-sm text-error-st shadow-soft">
                  No se pudo cargar el catálogo.
                </div>
              ) : visibles.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {visibles.map((p) => (
                    <ProductoCard
                      key={p.id}
                      producto={p}
                      enCarrito={carrito[p.id]?.cantidad ?? 0}
                      onAgregar={() => agregar(p)}
                      onQuitar={() => quitar(p.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  titulo="Sin resultados"
                  descripcion={
                    busqueda ? `No hay productos para "${busqueda}".` : "No hay productos en esta categoría."
                  }
                />
              )}
            </div>
          </section>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PASO 2: REVISAR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {paso === 2 && (
          <section aria-label="Revisión del pedido">
            <PasoTitulo
              icon={Note}
              titulo="Revisa el pedido"
              sub={`${refMesa} · ${totalArticulos} producto${totalArticulos !== 1 ? "s" : ""}`}
            />

            {lineas.length === 0 ? (
              <p className="mt-8 text-center text-body-sm text-on-surface-variant">
                No hay productos. Regresa y agrega algunos.
              </p>
            ) : (
              <ul className="mt-5 flex flex-col gap-3">
                {lineas.map((l) => (
                  <li
                    key={l.producto.id}
                    className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-soft"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-on-surface truncate">{l.producto.nombre}</p>
                        <p className="text-body-sm text-on-surface-variant">
                          {formatCurrency(l.producto.precio)} c/u
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => quitar(l.producto.id)}
                          aria-label="Quitar uno"
                          className="grid h-9 w-9 place-items-center rounded-xl bg-surface-container text-on-surface-variant active:scale-90"
                        >
                          <Minus weight='light' className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-label-lg font-bold">{l.cantidad}</span>
                        <button
                          onClick={() => agregar(l.producto)}
                          aria-label="Agregar uno"
                          className="grid h-9 w-9 place-items-center rounded-xl bg-surface-container text-on-surface-variant active:scale-90"
                        >
                          <Plus weight='light' className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => eliminar(l.producto.id)}
                          aria-label="Eliminar del carrito"
                          className="grid h-9 w-9 place-items-center rounded-xl text-on-surface-variant hover:bg-error-container/40 hover:text-on-error-container active:scale-90"
                        >
                          <Trash weight='light' className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Nota del ítem */}
                    {editandoNota === l.producto.id ? (
                      <div className="mt-3 flex gap-2">
                        <input
                          autoFocus
                          value={notaTemp}
                          onChange={(e) => setNotaTemp(e.target.value)}
                          placeholder="Ej: sin azúcar, extra caliente…"
                          className="flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none focus:border-primary-container"
                          onKeyDown={(e) => e.key === "Enter" && guardarNota()}
                        />
                        <button
                          onClick={guardarNota}
                          className="rounded-xl bg-primary-container px-4 py-2 text-label-sm font-bold text-on-primary"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditandoNota(l.producto.id);
                          setNotaTemp(l.nota);
                        }}
                        className="mt-2 flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-on-surface"
                      >
                        <PencilSimple weight="light" className="h-3.5 w-3.5" />
                        {l.nota
                          ? <span className="italic text-primary-container">"{l.nota}"</span>
                          : <span>Agregar nota</span>}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PASO 3: CONFIRMACIÀ“N â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {paso === 3 && (
          <ConfirmacionExito
            refMesa={refMesa}
            nombreCliente={tipo === "llevar" ? nombreCliente : null}
            total={total}
            folio={folioConfirmado}
            onNuevo={nuevoPedido}
          />
        )}
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• BARRA DE NAVEGACIÀ“N FIJA â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {paso < 3 && (
        <footer className="fixed inset-x-0 z-30 backdrop-blur-md"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 6.5rem)" }}
        >
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <button
              onClick={() => paso > 0 && irA((paso - 1) as Paso)}
              disabled={paso === 0}
              aria-label="Paso anterior"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low text-on-surface shadow-soft transition-transform active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft weight='light' className="h-5 w-5" />
            </button>

            {/* Resumen del ticket */}
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-on-surface-variant">{ETIQUETAS_PASO[paso]}</p>
              <p className="truncate text-label-lg font-bold text-on-surface">
                {totalArticulos > 0
                  ? `${totalArticulos} prod · ${formatCurrency(total)}`
                  : paso === 0
                    ? refMesa
                    : "Ticket vacío"}
              </p>
            </div>

            {paso === 0 && (
              <Button
                onClick={() => puedeAvanzar() && irA(1)}
                disabled={!puedeAvanzar()}
                className="shrink-0"
              >
                Continuar
                <ArrowRight weight='light' className="h-4 w-4" aria-hidden />
              </Button>
            )}
            {paso === 1 && (
              <Button
                onClick={() => puedeAvanzar() && irA(2)}
                disabled={!puedeAvanzar()}
                className="shrink-0"
              >
                Revisar
                <ArrowRight weight='light' className="h-4 w-4" aria-hidden />
              </Button>
            )}
            {paso === 2 && (
              <Button
                onClick={confirmar}
                disabled={!puedeAvanzar() || enviarComanda.isPending}
                loading={enviarComanda.isPending}
                className="shrink-0 bg-cafe-intenso text-crema hover:bg-cafe-intenso/90"
              >
                <Check weight='light' className="h-4 w-4" aria-hidden />
                <span className="sm:hidden">Enviar</span>
                <span className="hidden sm:inline">Enviar a cocina</span>
              </Button>
            )}
          </div>
        </footer>
      )}
    </PantallaConHeader>
  );
}

// â”€â”€â”€ Sub-componentes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PasoTitulo({
  icon: Icon,
  titulo,
  sub,
}: {
  icon: typeof Storefront;
  titulo: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container/15 text-primary-container">
        <Icon weight='light' className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h1 className="text-headline-sm font-bold text-on-surface">{titulo}</h1>
        <p className="text-body-sm text-on-surface-variant">{sub}</p>
      </div>
    </div>
  );
}



function ProductoCard({
  producto,
  enCarrito,
  onAgregar,
  onQuitar,
}: {
  producto: Producto;
  enCarrito: number;
  onAgregar: () => void;
  onQuitar: () => void;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-2xl border bg-surface-container-lowest p-3.5 shadow-soft transition-all duration-200",
        enCarrito > 0 ? "border-primary-container" : "border-outline-variant/40",
      )}
    >
      {enCarrito > 0 && (
        <span className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-container px-1.5 text-xs font-bold text-on-primary">
          {enCarrito}
        </span>
      )}
      <button
        onClick={onAgregar}
        className="flex flex-1 flex-col items-start text-left"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-caramelo/20 text-cafe-principal">
          <Package weight='light' className="h-5 w-5" aria-hidden />
        </div>
        <p className="mt-2 line-clamp-2 text-label-lg font-bold text-on-surface">{producto.nombre}</p>
        <p className="mt-1 tabular text-headline-sm font-bold text-primary-container">
          {formatCurrency(producto.precio)}
        </p>
      </button>

      {enCarrito > 0 && (
        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-primary-container/10 p-1">
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
      )}
    </div>
  );
}

function ConfirmacionExito({
  refMesa,
  nombreCliente,
  total,
  folio,
  onNuevo,
}: {
  refMesa: string;
  nombreCliente: string | null;
  total: number;
  folio: number | null;
  onNuevo: () => void;
}) {
  const AUTO_MS = 5000;
  const [restante, setRestante] = useState(AUTO_MS);

  useEffect(() => {
    const inicio = Date.now();
    const tick = setInterval(() => {
      const queda = AUTO_MS - (Date.now() - inicio);
      if (queda <= 0) {
        clearInterval(tick);
        onNuevo();
      } else {
        setRestante(queda);
      }
    }, 50);
    return () => clearInterval(tick);
  }, [onNuevo]);

  const progreso = Math.max(0, (restante / AUTO_MS) * 100);

  return (
    <section className="mx-auto flex max-w-sm flex-col items-center py-12 text-center" aria-live="polite">
      {/* Imagen de confirmación */}
      <img
        src="/confirmed.webp"
        alt=""
        aria-hidden
        className="h-40 w-40 object-contain drop-shadow-sm"
      />

      <h2 className="mt-6 text-headline-md font-bold text-on-surface">¡Pedido confirmado!</h2>
      <p className="mt-1 text-body-md text-on-surface-variant">
        {folio ? `Comanda #${folio} enviada a cocina` : "Comanda enviada a cocina"}
      </p>

      <p className="mt-6 tabular text-4xl font-bold text-on-surface">{formatCurrency(total)}</p>
      <div className="mt-1 flex flex-col items-center gap-0.5 text-body-sm text-on-surface-variant">
        <span>{refMesa}</span>
        {nombreCliente && <span className="font-semibold text-primary-container">{nombreCliente}</span>}
      </div>

      <Button
        fullWidth
        size="lg"
        onClick={onNuevo}
        className="mt-10 bg-cafe-intenso text-crema hover:bg-cafe-intenso/90"
      >
        <Plus weight='light' className="h-4 w-4" aria-hidden />
        <span className="sm:hidden">Nuevo pedido</span>
        <span className="hidden sm:inline">Tomar otro pedido</span>
      </Button>

      {/* Barra de cuenta regresiva */}
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-container">
        <div
          className="h-full rounded-full bg-primary-container transition-[width] duration-75 ease-linear"
          style={{ width: `${progreso}%` }}
        />
      </div>
      <p className="mt-2 text-body-sm text-on-surface-variant/60">
        Nuevo pedido en {Math.ceil(restante / 1000)} s
      </p>
    </section>
  );
}





