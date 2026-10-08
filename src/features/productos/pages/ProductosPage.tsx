import { useState } from "react";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import {
  useCatalogo,
  useAgregarProducto,
  useEditarProducto,
  useDesactivarProducto,
} from "@/features/pos/hooks";
import { useCategorias } from "@/features/categorias/hooks";
import type { Producto, CategoriaDto } from "@/types/api";

/** Gestión CRUD de productos del menú. Solo Administrador. */
export function ProductosPage() {
  const { data: productos = [], isLoading } = useCatalogo();
  const { data: categorias = [] } = useCategorias();
  const crearProducto = useAgregarProducto();
  const editarProducto = useEditarProducto();
  const desactivarProducto = useDesactivarProducto();
  const toast = useToast();

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [costo, setCosto] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const q = busqueda.trim().toLowerCase();
  const lista = productos.filter((p) => !q || p.nombre.toLowerCase().includes(q));

  function resetForm() {
    setNombre("");
    setPrecio("");
    setCosto("");
    setEditId(null);
    setCategoriaId(categorias[0]?.id ?? "");
  }

  async function guardar() {
    const precioNum = parseFloat(precio);
    if (!nombre.trim() || isNaN(precioNum) || precioNum <= 0) return;
    const catId = categoriaId || categorias[0]?.id || "";
    if (!catId) return;

    try {
      if (editId) {
        await editarProducto.mutateAsync({
          productoId: editId,
          nombre: nombre.trim(),
          categoriaId: catId,
          precio: precioNum,
          costo: costo ? parseFloat(costo) : null,
        });
        toast.exito("Producto actualizado.");
      } else {
        await crearProducto.mutateAsync({
          nombre: nombre.trim(),
          categoriaId: catId,
          precio: precioNum,
          costo: costo ? parseFloat(costo) : null,
        });
        toast.exito("Producto agregado.");
      }
      resetForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el producto.");
    }
  }

  function editar(p: Producto) {
    setEditId(p.id);
    setNombre(p.nombre);
    setPrecio(String(p.precio));
    setCosto(p.costo != null ? String(p.costo) : "");
    setCategoriaId(p.categoriaId);
    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleActivo(p: Producto) {
    try {
      await editarProducto.mutateAsync({
        productoId: p.id,
        nombre: p.nombre,
        categoriaId: p.categoriaId,
        precio: p.precio,
        costo: p.costo,
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el producto.");
    }
  }

  async function eliminar(p: Producto) {
    try {
      await desactivarProducto.mutateAsync(p.id);
      toast.exito(`"${p.nombre}" desactivado.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo desactivar el producto.");
    }
  }

  const isPending = crearProducto.isPending || editarProducto.isPending;

  return (
    <PantallaConHeader
      titulo="Productos"
      subtitulo={
        <p className="text-body-sm text-on-surface-variant">
          {lista.length} producto{lista.length !== 1 ? "s" : ""}
        </p>
      }
    >
      <div className="space-y-8">

        {/* ── Formulario crear / editar ────────────────────────────────────── */}
        <div className="rounded-3xl bg-white/70 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-cafe-intenso">
            {editId ? "Editar producto" : "Nuevo producto"}
          </h2>
          <div className="mt-4 space-y-3">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del producto"
              className="w-full rounded-2xl border border-cafe-intenso/10 bg-white px-4 py-3 text-sm text-cafe-intenso shadow-sm outline-none placeholder:text-cafe-intenso/35 focus:border-verde-menta"
            />
            <div className="flex gap-3">
              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="Precio"
                className="flex-1 rounded-2xl border border-cafe-intenso/10 bg-white px-4 py-3 text-sm text-cafe-intenso shadow-sm outline-none placeholder:text-cafe-intenso/35 focus:border-verde-menta"
              />
              <select
                value={categoriaId || (categorias[0]?.id ?? "")}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="flex-1 rounded-2xl border border-cafe-intenso/10 bg-white px-4 py-3 text-sm text-cafe-intenso shadow-sm outline-none focus:border-verde-menta"
              >
                {categorias.map((c: CategoriaDto) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <input
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="Costo de insumos (opcional)"
              className="w-full rounded-2xl border border-cafe-intenso/10 bg-white px-4 py-3 text-sm text-cafe-intenso shadow-sm outline-none placeholder:text-cafe-intenso/35 focus:border-verde-menta"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={guardar}
                disabled={isPending || !nombre.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cafe-intenso px-4 py-3 text-sm font-semibold text-crema transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {editId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editId ? "Guardar cambios" : "Agregar producto"}
              </button>
              {editId && (
                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 rounded-2xl border border-cafe-intenso/20 px-4 py-3 text-sm font-semibold text-cafe-intenso transition-colors hover:bg-cafe-principal/10"
                >
                  <X className="h-4 w-4" /> Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Lista ──────────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-cafe-intenso">
              Menú ({lista.length})
            </h2>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-intenso/40" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto…"
              className="w-full rounded-2xl border border-cafe-intenso/10 bg-white py-3 pl-11 pr-10 text-sm text-cafe-intenso shadow-sm outline-none placeholder:text-cafe-intenso/35 focus:border-verde-menta"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-cafe-intenso/40 hover:bg-cafe-principal/20"
                aria-label="Limpiar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-white/50" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-cafe-intenso/5 rounded-2xl bg-white/70 px-5 shadow-sm">
              {lista.map((p) => {
                const cat = categorias.find((c: CategoriaDto) => c.id === p.categoriaId);
                const margen = p.costo != null && p.costo > 0
                  ? Math.round(((p.precio - p.costo) / p.precio) * 100)
                  : null;
                return (
                  <div key={p.id} className="flex items-center gap-3 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cafe-intenso truncate">{p.nombre}</p>
                      <p className="text-xs text-cafe-intenso/45">
                        {cat?.nombre ?? "—"}
                        {margen !== null && (
                          <span className="ml-2 text-verde-menta font-medium">
                            {margen}% margen
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="font-bold text-sm text-verde-menta whitespace-nowrap">
                      {formatCurrency(p.precio)}
                    </span>
                    <button
                      onClick={() => toggleActivo(p)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                        p.activo
                          ? "bg-verde-menta/15 text-verde-menta"
                          : "bg-cafe-intenso/10 text-cafe-intenso/45"
                      }`}
                    >
                      {p.activo ? "Activo" : "Inactivo"}
                    </button>
                    <button
                      onClick={() => editar(p)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cafe-intenso/45 hover:bg-cafe-principal/20 hover:text-cafe-intenso"
                      aria-label={`Editar ${p.nombre}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => eliminar(p)}
                      disabled={desactivarProducto.isPending}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cafe-intenso/40 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      aria-label={`Desactivar ${p.nombre}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              {lista.length === 0 && (
                <p className="py-6 text-center text-sm text-cafe-intenso/45">
                  {busqueda ? "Sin resultados." : "Aún no hay productos. Agrega el primero."}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </PantallaConHeader>
  );
}
