import { useState } from "react";
import {
  Check,
  Package,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  useCatalogo,
  useAgregarProducto,
  useEditarProducto,
  useDesactivarProducto,
} from "@/features/pos/hooks";
import {
  useCategorias,
  useCrearCategoria,
  useEliminarCategoria,
} from "@/features/categorias/hooks";
import type { Producto, CategoriaDto } from "@/types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "platillos" | "categorias";

const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "platillos", label: "Platillos", icon: Package },
  { id: "categorias", label: "Categorías", icon: Tag },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ProductosPage() {
  const [tab, setTab] = useState<Tab>("platillos");

  return (
    <div className="min-h-screen bg-crema pb-10">
      {/* Header con tabs pills */}
      <header className="sticky top-0 z-20 bg-crema/90 backdrop-blur-sm px-4 py-3 shadow-[0_1px_0_0_rgba(43,31,25,0.08)]">
        <div className="mx-auto max-w-3xl">
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full bg-white/60 p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex flex-none items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
                  tab === id
                    ? "bg-cafe-intenso text-crema shadow-sm"
                    : "text-cafe-intenso/60 hover:text-cafe-intenso"
                }`}
              >
                <Icon className="text-base" /> {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {tab === "platillos" && <Platillos />}
        {tab === "categorias" && <Categorias />}
      </main>
    </div>
  );
}

// ─── Buscador reutilizable ────────────────────────────────────────────────────

function Buscador({
  valor,
  onChange,
  placeholder,
}: {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cafe-intenso/40" />
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-cafe-intenso/10 bg-white py-3 pl-11 pr-10 text-sm text-cafe-intenso shadow-sm outline-none placeholder:text-cafe-intenso/35 focus:border-verde-menta"
      />
      {valor && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-cafe-intenso/40 hover:bg-cafe-principal/20 hover:text-cafe-intenso"
          aria-label="Limpiar"
        >
          <X />
        </button>
      )}
    </div>
  );
}

// ─── Platillos ────────────────────────────────────────────────────────────────

function Platillos() {
  const { data: productos = [], isLoading } = useCatalogo();
  const { data: categorias = [] } = useCategorias();
  const crearProducto = useAgregarProducto();
  const editarProducto = useEditarProducto();
  const desactivarProducto = useDesactivarProducto();

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
    if (categorias.length > 0) setCategoriaId(categorias[0].id);
  }

  async function guardar() {
    const precioNum = parseFloat(precio);
    if (!nombre.trim() || isNaN(precioNum) || precioNum <= 0) return;
    const catId = categoriaId || categorias[0]?.id || "";
    if (!catId) return;

    if (editId) {
      await editarProducto.mutateAsync({
        productoId: editId,
        nombre: nombre.trim(),
        categoriaId: catId,
        precio: precioNum,
        costo: costo ? parseFloat(costo) : null,
      });
    } else {
      await crearProducto.mutateAsync({
        nombre: nombre.trim(),
        categoriaId: catId,
        precio: precioNum,
        costo: costo ? parseFloat(costo) : null,
      });
    }
    resetForm();
  }

  function editar(p: Producto) {
    setEditId(p.id);
    setNombre(p.nombre);
    setPrecio(String(p.precio));
    setCosto(p.costo != null ? String(p.costo) : "");
    setCategoriaId(p.categoriaId);
  }

  function cancelar() {
    resetForm();
  }

  async function toggleActivo(p: Producto) {
    if (p.activo) {
      await desactivarProducto.mutateAsync(p.id);
    } else {
      await editarProducto.mutateAsync({
        productoId: p.id,
        nombre: p.nombre,
        categoriaId: p.categoriaId,
        precio: p.precio,
        costo: p.costo,
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Formulario */}
      <div className="rounded-3xl bg-white/70 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-cafe-intenso">
          {editId ? "Editar platillo" : "Nuevo platillo"}
        </h2>
        <div className="mt-4 space-y-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del platillo"
            className="w-full rounded-2xl border border-cafe-intenso/10 bg-white px-4 py-3 text-sm text-cafe-intenso shadow-sm outline-none placeholder:text-cafe-intenso/35 focus:border-verde-menta"
          />
          <div className="flex gap-3">
            <input
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              type="number"
              min="0"
              placeholder="Precio"
              className="flex-1 rounded-2xl border border-cafe-intenso/10 bg-white px-4 py-3 text-sm text-cafe-intenso shadow-sm outline-none placeholder:text-cafe-intenso/35 focus:border-verde-menta"
            />
            <select
              value={categoriaId || (categorias[0]?.id ?? "")}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="flex-1 rounded-2xl border border-cafe-intenso/10 bg-white px-4 py-3 text-sm text-cafe-intenso shadow-sm outline-none focus:border-verde-menta"
            >
              {categorias.map((c: CategoriaDto) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <input
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            type="number"
            min="0"
            placeholder="Costo de insumos (opcional)"
            className="w-full rounded-2xl border border-cafe-intenso/10 bg-white px-4 py-3 text-sm text-cafe-intenso shadow-sm outline-none placeholder:text-cafe-intenso/35 focus:border-verde-menta"
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={guardar}
              disabled={crearProducto.isPending || editarProducto.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cafe-intenso px-4 py-3 text-sm font-semibold text-crema transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              {editId ? <Check /> : <Plus />}
              {editId ? "Guardar cambios" : "Agregar platillo"}
            </button>
            {editId && (
              <button
                onClick={cancelar}
                className="flex items-center justify-center gap-2 rounded-2xl border border-cafe-intenso/20 px-4 py-3 text-sm font-semibold text-cafe-intenso transition-colors hover:bg-cafe-principal/10"
              >
                <X /> Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-cafe-intenso">
          Menú ({lista.length})
        </h2>
        <Buscador valor={busqueda} onChange={setBusqueda} placeholder="Buscar platillo…" />

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/50" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-cafe-intenso/5 rounded-2xl bg-white/70 px-5 shadow-sm">
            {lista.map((p) => {
              const cat = categorias.find((c: CategoriaDto) => c.id === p.categoriaId);
              return (
                <div key={p.id} className="flex items-center gap-3 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cafe-intenso truncate">{p.nombre}</p>
                    <p className="text-xs text-cafe-intenso/45">{cat?.nombre ?? "—"}</p>
                  </div>
                  <span className="text-sm font-bold text-verde-menta">
                    {formatCurrency(p.precio)}
                  </span>
                  <button
                    onClick={() => toggleActivo(p)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                      p.activo
                        ? "bg-verde-menta/15 text-verde-menta"
                        : "bg-cafe-intenso/10 text-cafe-intenso/45"
                    }`}
                  >
                    {p.activo ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={() => editar(p)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-cafe-intenso/45 hover:bg-cafe-principal/20 hover:text-cafe-intenso"
                    aria-label="Editar"
                  >
                    <Pencil />
                  </button>
                  <button
                    onClick={() => desactivarProducto.mutate(p.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-cafe-intenso/40 hover:bg-red-50 hover:text-red-500"
                    aria-label="Eliminar"
                  >
                    <Trash2 />
                  </button>
                </div>
              );
            })}
            {lista.length === 0 && (
              <p className="py-6 text-center text-sm text-cafe-intenso/45">Sin resultados.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Categorías ───────────────────────────────────────────────────────────────

function Categorias() {
  const { data: categorias = [], isLoading } = useCategorias();
  const { data: productos = [] } = useCatalogo();
  const crearCategoria = useCrearCategoria();
  const eliminarCategoria = useEliminarCategoria();

  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const q = busqueda.trim().toLowerCase();
  const lista = categorias.filter(
    (c: CategoriaDto) => !q || c.nombre.toLowerCase().includes(q),
  );

  async function crear() {
    if (!nombre.trim()) return;
    await crearCategoria.mutateAsync({
      nombre: nombre.trim(),
      orden: categorias.length + 1,
    });
    setNombre("");
  }

  return (
    <div className="space-y-8">
      {/* Formulario */}
      <div className="rounded-3xl bg-white/70 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-cafe-intenso">Nueva categoría</h2>
        <div className="mt-4 flex gap-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && crear()}
            placeholder="Ej. Panadería"
            className="flex-1 rounded-2xl border border-cafe-intenso/10 bg-white px-4 py-3 text-sm text-cafe-intenso shadow-sm outline-none placeholder:text-cafe-intenso/35 focus:border-verde-menta"
          />
          <button
            onClick={crear}
            disabled={crearCategoria.isPending || !nombre.trim()}
            className="flex items-center gap-2 rounded-2xl bg-cafe-intenso px-4 py-3 text-sm font-semibold text-crema transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            <Plus /> Agregar
          </button>
        </div>
      </div>

      {/* Lista */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-cafe-intenso">
          Categorías ({lista.length})
        </h2>
        <Buscador valor={busqueda} onChange={setBusqueda} placeholder="Buscar categoría…" />

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/50" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-cafe-intenso/5 rounded-2xl bg-white/70 px-5 shadow-sm">
            {lista.map((c: CategoriaDto) => {
              const usados = productos.filter((p: Producto) => p.categoriaId === c.id).length;
              return (
                <div key={c.id} className="flex items-center gap-3 py-4">
                  <span className="flex-1 text-sm font-medium text-cafe-intenso">
                    {c.nombre}
                  </span>
                  <span className="text-xs text-cafe-intenso/45">{usados} platillos</span>
                  <button
                    onClick={() => eliminarCategoria.mutate(c.id)}
                    disabled={usados > 0 || eliminarCategoria.isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-cafe-intenso/40 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                    title={usados > 0 ? "No se puede eliminar: tiene platillos" : "Eliminar"}
                    aria-label="Eliminar"
                  >
                    <Trash2 />
                  </button>
                </div>
              );
            })}
            {lista.length === 0 && (
              <p className="py-6 text-center text-sm text-cafe-intenso/45">Sin resultados.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
