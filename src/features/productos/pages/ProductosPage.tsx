import { useState, type FormEvent } from "react";
import { Edit2, Plus, Search, Trash2, X } from "lucide-react";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { Button, Drawer, Input, SkeletonFila } from "@/components/ui";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import {
  useCatalogo,
  useAgregarProducto,
  useEditarProducto,
  useDesactivarProducto,
} from "@/features/pos/hooks";
import { useCategorias } from "@/features/categorias/hooks";
import type { Producto, CategoriaDto } from "@/types/api";

// ─── Tipos del drawer ────────────────────────────────────────────────────────

type ModoDrawer = "crear" | "editar";

interface EstadoDrawer {
  abierto: boolean;
  modo: ModoDrawer;
  producto: Producto | null;
}

const DRAWER_CERRADO: EstadoDrawer = { abierto: false, modo: "crear", producto: null };

// ─── Componente principal ────────────────────────────────────────────────────

/** Gestión CRUD de productos del menú. Solo Administrador. */
export function ProductosPage() {
  const { data: productos, isLoading, isError } = useCatalogo();
  const { data: categorias = [] } = useCategorias();
  const crear = useAgregarProducto();
  const editar = useEditarProducto();
  const desactivar = useDesactivarProducto();
  const toast = useToast();

  const [drawer, setDrawer] = useState<EstadoDrawer>(DRAWER_CERRADO);
  const [busqueda, setBusqueda] = useState("");

  // Formulario del drawer
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [costo, setCosto] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const q = busqueda.trim().toLowerCase();
  const lista = (productos ?? []).filter(
    (p) => !q || p.nombre.toLowerCase().includes(q),
  );

  function abrirCrear() {
    setNombre("");
    setPrecio("");
    setCosto("");
    setCategoriaId(categorias[0]?.id ?? "");
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
    const catId = categoriaId || categorias[0]?.id || "";

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
    try {
      await desactivar.mutateAsync(p.id);
      toast.exito(`"${p.nombre}" ${p.activo ? "desactivado" : "activado"}.`);
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
          <Plus className="h-5 w-5" aria-hidden />
        </Button>
      }
    >
      {/* Buscador */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" aria-hidden />
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
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

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
            src="/spil.png"
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
        <div className="grid grid-cols-2 gap-3">
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
        <form onSubmit={enviar} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Latte, Chilaquiles…"
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
              value={categoriaId || (categorias[0]?.id ?? "")}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="h-12 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container"
            >
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

// ─── Card de producto (grid 2 col, preparada para imagen futura) ──────────────

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
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-outline-variant/40",
        "bg-surface-container-lowest shadow-soft transition-all duration-200",
        !p.activo && "opacity-60",
      )}
    >
      {/* Zona de imagen futura — placeholder limpio */}
      <div className="flex h-20 items-center justify-center bg-primary-container/8">
        <div className="h-10 w-10 rounded-xl bg-primary-container/20" />
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-2">
        <p className="line-clamp-2 text-label-lg font-bold leading-snug text-on-surface">
          {p.nombre}
        </p>
        <p className="text-body-sm text-on-surface-variant">
          {categoriaNombre ?? "—"}
        </p>
        <p className="mt-1 text-label-lg font-bold text-primary-container">
          {formatCurrency(p.precio)}
        </p>
        {margen !== null && (
          <p className="text-body-sm font-medium text-primary-container/70">
            {margen}% margen
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between border-t border-outline-variant/20 px-2 py-1.5">
        <button
          onClick={onToggleActivo}
          disabled={desactivando}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
            p.activo
              ? "bg-primary-container/15 text-primary-container"
              : "bg-surface-container text-on-surface-variant",
          )}
        >
          {p.activo ? "Activo" : "Inactivo"}
        </button>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onEditar}
            aria-label={`Editar ${p.nombre}`}
            className="grid h-8 w-8 place-items-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <Edit2 className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            onClick={onToggleActivo}
            disabled={desactivando}
            aria-label={`Desactivar ${p.nombre}`}
            className="grid h-8 w-8 place-items-center rounded-xl text-on-surface-variant transition-colors hover:bg-error-container/40 hover:text-on-error-container disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
