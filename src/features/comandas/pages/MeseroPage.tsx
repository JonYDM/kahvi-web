import { useMemo, useState } from "react";
import {
  Minus,
  Package,
  Plus,
  Search,
  Send,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { Button, Drawer, Input, SkeletonFila } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { useCatalogo } from "@/features/pos/hooks";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import { categoriaProductoLabel } from "@/lib/enums";
import { formatCurrency } from "@/lib/format";
import { CategoriaProducto, type Producto } from "@/types/api";
import { useEnviarComanda } from "../hooks";

interface LineaCarrito {
  producto: Producto;
  cantidad: number;
  nota: string;
}

const CATEGORIAS: { valor: CategoriaProducto | null; label: string }[] = [
  { valor: null, label: "Todos" },
  { valor: CategoriaProducto.Cafe, label: "☕ Café" },
  { valor: CategoriaProducto.Desayunos, label: "🥞 Desayunos" },
  { valor: CategoriaProducto.Postres, label: "🍰 Postres" },
  { valor: CategoriaProducto.Bebidas, label: "🥤 Bebidas" },
  { valor: CategoriaProducto.Otro, label: "Otro" },
];

/** Pantalla del mesero: selecciona mesa, arma comanda y la envía a cocina. */
export function MeseroPage() {
  const { sesion } = useAuth();
  const { data: productos, isLoading, isError } = useCatalogo();
  const enviarComanda = useEnviarComanda();
  const toast = useToast();

  const [mesa, setMesa] = useState("");
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaProducto | null>(null);
  const [carrito, setCarrito] = useState<Record<string, LineaCarrito>>({});
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [editandoNota, setEditandoNota] = useState<string | null>(null);
  const [notaTemp, setNotaTemp] = useState("");

  const lineas = Object.values(carrito);
  const totalArticulos = lineas.reduce((s, l) => s + l.cantidad, 0);
  const total = useMemo(
    () => lineas.reduce((s, l) => s + l.producto.precio * l.cantidad, 0),
    [lineas],
  );

  const visibles = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return (productos ?? []).filter((p) => {
      if (categoria !== null && p.categoria !== categoria) return false;
      if (q && !p.nombre.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [productos, categoria, texto]);

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

  function guardarNota() {
    if (!editandoNota) return;
    setCarrito((prev) => ({
      ...prev,
      [editandoNota]: { ...prev[editandoNota], nota: notaTemp },
    }));
    setEditandoNota(null);
  }

  async function enviar() {
    if (mesa.trim() === "" || lineas.length === 0 || enviarComanda.isPending) return;
    try {
      await enviarComanda.mutateAsync({
        mesa: mesa.trim(),
        meseroNombre: sesion?.nombre ?? "Mesero",
        items: lineas.map((l) => ({
          productoId: l.producto.id,
          nombre: l.producto.nombre,
          cantidad: l.cantidad,
          precio: l.producto.precio,
          nota: l.nota || undefined,
        })),
      });
      // Éxito: limpiar y mostrar confirmación
      setCarrito({});
      setMesa("");
      toast.exito("¡Comanda enviada a cocina!");
      setDrawerAbierto(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo enviar la comanda.";
      toast.error(msg);
    }
  }

  return (
    <PantallaConHeader
      titulo="Nueva comanda"
      subtitulo={
        <p className="text-body-sm text-on-surface-variant flex items-center gap-1">
          <UtensilsCrossed className="h-4 w-4" aria-hidden />
          Mesero
        </p>
      }
    >
      <div className="flex flex-col gap-4 pb-28">
        {/* Selector de mesa */}
        <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-soft">
          <span className="text-2xl" aria-hidden>🪑</span>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm text-on-surface-variant mb-1">¿Qué mesa?</p>
            <input
              type="text"
              aria-label="Mesa o número de mesa"
              placeholder="Ej: Mesa 3, Barra, Para llevar…"
              value={mesa}
              onChange={(e) => setMesa(e.target.value)}
              className="w-full bg-transparent text-headline-sm font-bold text-cafe-intenso placeholder:text-on-surface-variant/50 outline-none"
            />
          </div>
          {mesa.trim() && (
            <span className="shrink-0 rounded-full bg-verde-menta/20 px-3 py-1 text-label-sm font-bold text-cafe-intenso">
              ✓
            </span>
          )}
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search
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

        {/* Chips de categoría */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIAS.map((cat) => {
            const activo = categoria === cat.valor;
            return (
              <button
                key={cat.label}
                onClick={() => setCategoria(cat.valor)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-label-md font-semibold transition-colors",
                  activo
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:text-on-surface",
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Catálogo */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonFila key={i} />)}
          </div>
        ) : isError ? (
          <div className="rounded-2xl bg-error-container/40 p-6 text-center text-body-sm text-on-error-container">
            No se pudo cargar el catálogo.
          </div>
        ) : visibles.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {visibles.map((p) => (
              <ProductoCard
                key={p.id}
                producto={p}
                enCarrito={carrito[p.id]?.cantidad ?? 0}
                nota={carrito[p.id]?.nota ?? ""}
                onAgregar={() => agregar(p)}
                onQuitar={() => quitar(p.id)}
                onEditarNota={() => {
                  setEditandoNota(p.id);
                  setNotaTemp(carrito[p.id]?.nota ?? "");
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            titulo="Sin resultados"
            descripcion="No hay productos que coincidan."
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
            onClick={() => setDrawerAbierto(true)}
            className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 rounded-full bg-cafe-intenso px-5 py-3.5 text-crema shadow-float transition-transform active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-verde-menta/30 text-label-md font-bold text-crema">
                {totalArticulos}
              </span>
              <span className="text-label-lg font-bold">Ver comanda</span>
            </span>
            <span className="tabular text-label-lg font-bold">{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {/* Drawer de confirmación */}
      <Drawer
        open={drawerAbierto}
        onClose={() => setDrawerAbierto(false)}
        title="Comanda"
        descripcion={mesa.trim() ? `Mesa: ${mesa}` : "Selecciona una mesa antes de enviar"}
      >
        <div className="flex flex-col gap-4">
          {/* Mesa (editable desde el drawer también) */}
          <div className="rounded-xl bg-crema border border-caramelo/30 px-4 py-3">
            <p className="text-body-sm text-cafe-principal mb-0.5">Mesa</p>
            <input
              value={mesa}
              onChange={(e) => setMesa(e.target.value)}
              placeholder="Número o nombre de mesa"
              className="w-full bg-transparent text-headline-sm font-bold text-cafe-intenso outline-none placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Ítems */}
          <ul className="flex flex-col gap-2">
            {lineas.map((l) => (
              <li
                key={l.producto.id}
                className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label-md font-semibold text-on-surface">{l.producto.nombre}</p>
                    <p className="text-body-sm text-on-surface-variant">{formatCurrency(l.producto.precio)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => quitar(l.producto.id)}
                      aria-label="Quitar uno"
                      className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container text-on-surface-variant"
                    >
                      {l.cantidad <= 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    </button>
                    <span className="w-5 text-center text-label-md font-bold">{l.cantidad}</span>
                    <button
                      onClick={() => agregar(l.producto)}
                      aria-label="Agregar uno"
                      className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container text-on-surface-variant"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {/* Nota */}
                {editandoNota === l.producto.id ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={notaTemp}
                      onChange={(e) => setNotaTemp(e.target.value)}
                      placeholder="Ej: sin azúcar, extra caliente…"
                      className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-sm text-on-surface outline-none focus:border-primary-container"
                      onKeyDown={(e) => e.key === "Enter" && guardarNota()}
                    />
                    <button
                      onClick={guardarNota}
                      className="rounded-lg bg-verde-menta px-3 py-1.5 text-label-sm font-bold text-cafe-intenso"
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
                    className="flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="text-xs">✏️</span>
                    {l.nota ? <span className="italic">"{l.nota}"</span> : <span>Agregar nota</span>}
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
            <span className="text-on-surface-variant">Total estimado</span>
            <span className="tabular text-headline-md font-bold text-on-surface">{formatCurrency(total)}</span>
          </div>

          {!mesa.trim() && (
            <p role="alert" className="rounded-xl bg-caramelo/20 px-4 py-2.5 text-center text-body-sm font-medium text-cafe-intenso">
              Escribe el número o nombre de la mesa para continuar.
            </p>
          )}

          <Button
            fullWidth
            size="lg"
            onClick={enviar}
            loading={enviarComanda.isPending}
            disabled={!mesa.trim() || lineas.length === 0}
            className="bg-cafe-intenso text-crema hover:bg-cafe-intenso/90"
          >
            <Send className="h-5 w-5" aria-hidden />
            Enviar a cocina
          </Button>
        </div>
      </Drawer>

      {/* Diálogo de nota individual */}
    </PantallaConHeader>
  );
}

function ProductoCard({
  producto,
  enCarrito,
  nota,
  onAgregar,
  onQuitar,
  onEditarNota,
}: {
  producto: Producto;
  enCarrito: number;
  nota: string;
  onAgregar: () => void;
  onQuitar: () => void;
  onEditarNota: () => void;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-2xl border bg-surface-container-lowest p-3.5 shadow-soft transition-transform",
        enCarrito > 0 ? "border-cafe-intenso" : "border-outline-variant/40",
      )}
    >
      <button
        onClick={onAgregar}
        className="flex flex-1 flex-col items-start text-left"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-caramelo/20 text-cafe-principal">
          <Package className="h-5 w-5" aria-hidden />
        </div>
        <p className="mt-2 line-clamp-2 text-label-lg font-bold text-on-surface">{producto.nombre}</p>
        <p className="text-body-sm text-on-surface-variant">{categoriaProductoLabel[producto.categoria]}</p>
        <p className="mt-1 tabular text-headline-sm font-bold text-primary-container">
          {formatCurrency(producto.precio)}
        </p>
      </button>

      <div className="mt-2.5">
        {enCarrito > 0 ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between rounded-xl bg-cafe-intenso/10 p-1">
              <button
                onClick={onQuitar}
                aria-label={`Quitar uno de ${producto.nombre}`}
                className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container-lowest text-cafe-intenso shadow-soft active:scale-95"
              >
                {enCarrito <= 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              </button>
              <span className="tabular text-label-lg font-bold text-cafe-intenso">{enCarrito}</span>
              <button
                onClick={onAgregar}
                aria-label={`Agregar uno de ${producto.nombre}`}
                className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container-lowest text-cafe-intenso shadow-soft active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={onEditarNota}
              className="truncate text-body-sm text-on-surface-variant hover:text-on-surface text-left"
            >
              {nota ? <span className="italic text-cafe-principal">"{nota}"</span> : <span>+ nota</span>}
            </button>
          </div>
        ) : (
          <span className="text-body-sm text-on-surface-variant">Toca para agregar</span>
        )}
      </div>
    </div>
  );
}
