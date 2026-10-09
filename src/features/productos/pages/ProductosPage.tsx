import { useState, type FormEvent } from "react";
import { PencilSimple, Plus, MagnifyingGlass, Trash, X } from "@phosphor-icons/react";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { Button, Drawer, Input, SkeletonFila } from "@/components/ui";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import {
  useCatalogoTodos,
  useAgregarProducto,
  useEditarProducto,
  useDesactivarProducto,
  useActivarProducto,
} from "@/features/pos/hooks";
import { useCategorias } from "@/features/categorias/hooks";
import type { Producto, CategoriaDto } from "@/types/api";

// â”€â”€â”€ Tipos del drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ModoDrawer = "crear" | "editar";

interface EstadoDrawer {
  abierto: boolean;
  modo: ModoDrawer;
  producto: Producto | null;
}

const DRAWER_CERRADO: EstadoDrawer = { abierto: false, modo: "crear", producto: null };

// â”€â”€â”€ Componente principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Gestión CRUD de productos del menú. Solo Administrador. */
export function ProductosPage() {
  const { data: productos, isLoading, isError } = useCatalogoTodos();
  const { data: categorias = [] } = useCategorias();
  const crear = useAgregarProducto();
  const editar = useEditarProducto();
  const desactivar = useDesactivarProducto();
  const activar = useActivarProducto();
  const toast = useToast();

  const [drawer, setDrawer] = useState<EstadoDrawer>(DRAWER_CERRADO);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCat, setFiltroCat] = useState<string | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Formulario del drawer
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [costo, setCosto] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const q = busqueda.trim().toLowerCase();
  const lista = (productos ?? []).filter((p) => {
    if (!mostrarInactivos && !p.activo) return false;
    if (mostrarInactivos && p.activo) return false;
    if (filtroCat && p.categoriaId !== filtroCat) return false;
    if (q && !p.nombre.toLowerCase().includes(q)) return false;
    return true;
  });

  const numInactivos = (productos ?? []).filter((p) => !p.activo).length;

  function abrirCrear() {
    setNombre("");
    setPrecio("");
    setCosto("");
    setCategoriaId("");
    setErrorForm(null);
    setDrawer({ abierto: true, modo: "crear", producto: null });
  }

  function abrirEditar(p: Producto) {
    setNombre(p.nombre);
    setPrecio(String(p.precio));
    setCosto(p.costo != null ? String(p.costo) : "");
    setCategoriaId(p.categoriaId);
    setErrorForm(null);
    setDrawer({ abierto: true, modo: "editar", producto: p });
  }

  function cerrar() {
    setDrawer(DRAWER_CERRADO);
    setErrorForm(null);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErrorForm(null);

    const precioNum = parseFloat(precio);
    const costoNum = costo ? parseFloat(costo) : null;
    const catId = categoriaId;

    if (!nombre.trim()) { setErrorForm("El nombre es obligatorio."); return; }
    if (isNaN(precioNum) || precioNum <= 0) { setErrorForm("El precio debe ser mayor que cero."); return; }
    if (!catId) { setErrorForm("Selecciona una categoría."); return; }

    try {
      if (drawer.modo === "crear") {
        await crear.mutateAsync({ nombre: nombre.trim(), categoriaId: catId, precio: precioNum, costo: costoNum });
        toast.exito("Producto agregado.");
      } else if (drawer.producto) {
        await editar.mutateAsync({ productoId: drawer.producto.id, nombre: nombre.trim(), categoriaId: catId, precio: precioNum, costo: costoNum });
        toast.exito("Producto actualizado.");
      }
      cerrar();
    } catch (err) {
      setErrorForm(err instanceof ApiError ? err.message : "No se pudo guardar el producto.");
    }
  }

  async function handleDesactivar(p: Producto) {
    // Confirmación antes de desactivar (no antes de reactivar)
    if (p.activo) {
      const ok = window.confirm(`¿Desactivar "${p.nombre}"? No aparecerá en el menú.`);
      if (!ok) return;
    }
    try {
      if (p.activo) {
        await desactivar.mutateAsync(p.id);
        toast.exito(`"${p.nombre}" desactivado.`);
      } else {
        await activar.mutateAsync(p.id);
        toast.exito(`"${p.nombre}" reactivado.`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el producto.");
    }
  }

  const isPending = crear.isPending || editar.isPending;

  return (
    <PantallaConHeader
      titulo="Productos"
      subtitulo={
        <p className="text-body-sm text-on-surface-variant">
          {lista.length} producto{lista.length !== 1 ? "s" : ""}
        </p>
      }
      accion={
        <Button size="icon" onClick={abrirCrear} aria-label="Nuevo producto">
          <Plus weight='light' className="h-5 w-5" aria-hidden />
        </Button>
      }
    >
      {/* Buscador */}
      <div className="relative mb-4">
        <MagnifyingGlass weight='light' className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" aria-hidden />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto…"
          className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest py-3 pl-11 pr-10 text-body-md text-on-surface shadow-soft outline-none placeholder:text-on-surface-variant/50 focus:border-primary-container"
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

      {/* Chips de categoría â€” siempre visibles */}
      {categorias.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => { setFiltroCat(null); setMostrarInactivos(false); }}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-label-md font-semibold transition-colors",
              !mostrarInactivos && filtroCat === null
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            Todos
          </button>
          {[...(categorias ?? [])].sort((a, b) => a.orden - b.orden).map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setFiltroCat(cat.id === filtroCat ? null : cat.id); setMostrarInactivos(false); }}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-label-md font-semibold transition-colors",
                !mostrarInactivos && filtroCat === cat.id
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
              )}
            >
              {cat.nombre}
            </button>
          ))}
          {/* Chip inactivos */}
          {numInactivos > 0 && (
            <button
              onClick={() => { setMostrarInactivos((v) => !v); setFiltroCat(null); }}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-label-md font-semibold transition-colors",
                mostrarInactivos
                  ? "bg-error-st text-white"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
              )}
            >
              Inactivos {numInactivos > 0 && `(${numInactivos})`}
            </button>
          )}
        </div>
      )}

      {/* Estados de carga y error */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => <SkeletonFila key={i} />)}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl bg-error-container/40 p-6 text-center text-body-sm text-on-error-container">
          No se pudieron cargar los productos.
        </div>
      )}

      {!isLoading && !isError && lista.length === 0 && (
        <div className="flex flex-col items-center py-10 text-center">
          <img
            src="/spil.webp"
            alt="No hay productos"
            className="h-40 w-40 object-contain"
          />
          <p className="mt-4 text-label-lg font-semibold text-on-surface">
            {busqueda ? "Sin resultados" : "Aún no hay productos"}
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {busqueda
              ? `No encontramos "${busqueda}" en el menú.`
              : "Toca el botón + para agregar el primer producto."}
          </p>
        </div>
      )}

      {/* Grid de productos */}
      {!isLoading && !isError && lista.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pb-6">
          {lista.map((p) => {
            const cat = categorias.find((c: CategoriaDto) => c.id === p.categoriaId);
            const margen = p.costo != null && p.costo > 0
              ? Math.round(((p.precio - p.costo) / p.precio) * 100)
              : null;
            return (
              <ProductoCard
                key={p.id}
                producto={p}
                categoriaNombre={cat?.nombre}
                margen={margen}
                onEditar={() => abrirEditar(p)}
                onToggleActivo={() => handleDesactivar(p)}
                desactivando={desactivar.isPending}
              />
            );
          })}
        </div>
      )}

      {/* Drawer crear/editar */}
      <Drawer
        open={drawer.abierto}
        onClose={cerrar}
        title={drawer.modo === "crear" ? "Nuevo producto" : "Editar producto"}
        descripcion={
          drawer.modo === "crear"
            ? "Completa los datos del producto."
            : "Modifica los datos del producto."
        }
      >
        <form key={`${drawer.modo}-${drawer.producto?.id ?? 'nuevo'}`} onSubmit={enviar} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Latte, Chilaquiles..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-semibold text-on-surface-variant">
              Categoría
            </label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container"
            >
              <option value="" disabled>Selecciona una categoría...</option>
              {categorias.map((c: CategoriaDto) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Input
              label="Precio"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              required
            />
            <Input
              label="Costo (opcional)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
            />
          </div>

          {errorForm && (
            <p role="alert" className="rounded-xl bg-error-container/60 px-4 py-3 text-body-sm font-medium text-on-error-container">
              {errorForm}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={cerrar} fullWidth>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending} fullWidth>
              {drawer.modo === "crear" ? "Agregar" : "Guardar"}
            </Button>
          </div>
        </form>
      </Drawer>
    </PantallaConHeader>
  );
}

// â”€â”€â”€ Card de producto â€” editorial luxury â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ProductoCard({
  producto: p,
  categoriaNombre,
  margen,
  onEditar,
  onToggleActivo,
  desactivando,
}: {
  producto: Producto;
  categoriaNombre?: string;
  margen: number | null;
  onEditar: () => void;
  onToggleActivo: () => void;
  desactivando: boolean;
}) {
  return (
    /* Outer shell â€” double-bezel */
    <div
      className={cn(
        "group relative rounded-[1.25rem] p-[3px]",
        "bg-gradient-to-b from-white/60 to-transparent",
        "shadow-[0_2px_16px_-4px_rgba(43,31,25,0.12),0_1px_3px_-1px_rgba(43,31,25,0.06)]",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:shadow-[0_8px_32px_-8px_rgba(43,31,25,0.18),0_2px_8px_-2px_rgba(43,31,25,0.08)]",
        "hover:-translate-y-0.5",
        "active:scale-[0.98] active:duration-150",
        !p.activo && "opacity-50 grayscale",
      )}
    >
      {/* Inner core */}
      <div className="overflow-hidden rounded-[calc(1.25rem-3px)] bg-surface-container-lowest">

        {/* Zona imagen â€” full bleed con badge */}
        <div className="relative h-[6.5rem] w-full overflow-hidden bg-[#F0EBE3]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#EDE4D8] to-[#D9CFC3]" />
          <div className="absolute -left-8 top-3 h-16 w-16 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/10 to-transparent" />
          {categoriaNombre && (
            <span className="absolute right-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-cafe-intenso backdrop-blur-sm shadow-sm">
              {categoriaNombre}
            </span>
          )}
        </div>
        {/* Contenido */}
        <div className="px-3 pb-3 pt-2.5">
          {/* Nombre */}
          <p className="line-clamp-2 text-[0.9rem] font-bold leading-[1.25] tracking-[-0.01em] text-on-surface">
            {p.nombre}
          </p>

          {/* Precio */}
          <p className="mt-1.5 text-[1.05rem] font-black tracking-[-0.02em] text-primary-container">
            {formatCurrency(p.precio)}
          </p>

          {/* Margen */}
          {margen !== null && (
            <p className="mt-0.5 text-[10px] font-medium tracking-wide text-primary-container/60">
              {margen}% margen
            </p>
          )}
        </div>

        {/* Footer acciones */}
        <div className="flex items-center justify-between border-t border-black/[0.04] px-2.5 py-2">
          {/* Switch activo + acciones */}
          <div className="flex items-center justify-between">

            {/* Switch activo/inactivo */}
            <button
              onClick={onToggleActivo}
              disabled={desactivando}
              aria-label={p.activo ? "Desactivar producto" : "Activar producto"}
              className="flex items-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-40"
            >
              <div className={cn(
                "relative h-5 w-9 rounded-full transition-colors duration-300",
                p.activo ? "bg-verde-menta" : "bg-outline-variant/40",
              )}>
                <div className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300",
                  p.activo ? "translate-x-4" : "translate-x-0.5",
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-bold",
                p.activo ? "text-verde-menta" : "text-on-surface-variant/50",
              )}>
                {p.activo ? "Activo" : "Inactivo"}
              </span>
            </button>

            {/* Acciones con color */}
            <div className="flex items-center gap-1">
              <button
                onClick={onEditar}
                aria-label={`Editar ${p.nombre}`}
                className="grid h-8 w-8 place-items-center rounded-xl text-cafe-principal/60 transition-all duration-200 hover:bg-cafe-principal/10 hover:text-cafe-intenso"
              >
                <PencilSimple weight="light" className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                onClick={onToggleActivo}
                disabled={desactivando}
                aria-label={p.activo ? `Desactivar ${p.nombre}` : `Activar ${p.nombre}`}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl transition-all duration-200 disabled:opacity-40",
                  p.activo
                    ? "text-error-st/50 hover:bg-red-50 hover:text-error-st"
                    : "text-verde-menta/60 hover:bg-verde-menta/10 hover:text-verde-menta",
                )}
              >
                <Trash weight="light" className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





