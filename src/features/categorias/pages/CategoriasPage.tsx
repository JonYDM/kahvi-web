import { useState, useRef, type FormEvent, type DragEvent } from "react";
import { Edit2, GripVertical, Plus, Trash2 } from "lucide-react";
import { PantallaConHeader } from "@/components/organisms/PantallaConHeader";
import { Button, Drawer, Input, SkeletonFila } from "@/components/ui";
import { useToast } from "@/components/feedback/useToast";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import type { CategoriaDto } from "@/types/api";
import {
  useCategorias,
  useCrearCategoria,
  useEditarCategoria,
  useEliminarCategoria,
} from "../hooks";

// ─── Tipos del drawer ────────────────────────────────────────────────────────

type ModoDrawer = "crear" | "editar";

interface EstadoDrawer {
  abierto: boolean;
  modo: ModoDrawer;
  categoria: CategoriaDto | null;
}

const DRAWER_CERRADO: EstadoDrawer = { abierto: false, modo: "crear", categoria: null };

// ─── Componente principal ────────────────────────────────────────────────────

/** Gestión CRUD de categorías con drag-and-drop para reordenar. Solo Administrador. */
export function CategoriasPage() {
  const { data: categorias, isLoading, isError } = useCategorias();
  const crear = useCrearCategoria();
  const editar = useEditarCategoria();
  const eliminar = useEliminarCategoria();
  const toast = useToast();

  const [drawer, setDrawer] = useState<EstadoDrawer>(DRAWER_CERRADO);
  const [nombre, setNombre] = useState("");
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Estado local del orden mientras se arrastra (para preview inmediato)
  const [ordenLocal, setOrdenLocal] = useState<CategoriaDto[] | null>(null);

  // Refs para drag-and-drop
  const draggingId = useRef<string | null>(null);
  const dragOverId = useRef<string | null>(null);

  // La lista que se muestra: orden local (durante drag) o del servidor
  const ordenadas = ordenLocal
    ?? [...(categorias ?? [])].sort((a, b) => a.orden - b.orden);

  // ─── Drawer ────────────────────────────────────────────────────────────────

  function abrirCrear() {
    setNombre("");
    setErrorForm(null);
    setDrawer({ abierto: true, modo: "crear", categoria: null });
  }

  function abrirEditar(cat: CategoriaDto) {
    setNombre(cat.nombre);
    setErrorForm(null);
    setDrawer({ abierto: true, modo: "editar", categoria: cat });
  }

  function cerrar() {
    setDrawer(DRAWER_CERRADO);
    setErrorForm(null);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErrorForm(null);

    if (!nombre.trim()) {
      setErrorForm("El nombre es obligatorio.");
      return;
    }

    try {
      if (drawer.modo === "crear") {
        // El orden nuevo es el siguiente al último
        const siguienteOrden = ordenadas.length + 1;
        await crear.mutateAsync({ nombre: nombre.trim(), orden: siguienteOrden });
        toast.exito("Categoría creada.");
      } else if (drawer.categoria) {
        // Conserva el mismo orden, solo cambia el nombre
        await editar.mutateAsync({
          id: drawer.categoria.id,
          data: { nombre: nombre.trim(), orden: drawer.categoria.orden },
        });
        toast.exito("Categoría actualizada.");
      }
      cerrar();
    } catch (err) {
      setErrorForm(err instanceof ApiError ? err.message : "No se pudo guardar la categoría.");
    }
  }

  async function handleEliminar(cat: CategoriaDto) {
    try {
      await eliminar.mutateAsync(cat.id);
      setOrdenLocal(null); // limpiar orden local tras eliminar
      toast.exito(`Categoría "${cat.nombre}" eliminada.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar la categoría.");
    }
  }

  // ─── Drag-and-drop ──────────────────────────────────────────────────────────

  function onDragStart(e: DragEvent, id: string) {
    draggingId.current = id;
    e.dataTransfer.effectAllowed = "move";
    // Opacidad en el elemento arrastrado via class (se añade en el render)
  }

  function onDragOver(e: DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId.current === id || draggingId.current === id) return;
    dragOverId.current = id;

    // Preview inmediato: reordena la lista local
    const lista = [...ordenadas];
    const fromIdx = lista.findIndex((c) => c.id === draggingId.current);
    const toIdx = lista.findIndex((c) => c.id === id);
    if (fromIdx === -1 || toIdx === -1) return;

    const [movido] = lista.splice(fromIdx, 1);
    lista.splice(toIdx, 0, movido);
    // Re-asigna números de orden correlativos
    setOrdenLocal(lista.map((c, i) => ({ ...c, orden: i + 1 })));
  }

  async function onDrop() {
    draggingId.current = null;
    dragOverId.current = null;
    if (!ordenLocal) return;

    // Guarda el nuevo orden en el backend — solo las que cambiaron
    const original = [...(categorias ?? [])].sort((a, b) => a.orden - b.orden);
    const cambiadas = ordenLocal.filter((c, i) => c.id !== original[i]?.id || c.orden !== original[i]?.orden);

    if (cambiadas.length === 0) { setOrdenLocal(null); return; }

    try {
      await Promise.all(
        cambiadas.map((c) =>
          editar.mutateAsync({ id: c.id, data: { nombre: c.nombre, orden: c.orden } }),
        ),
      );
      toast.exito("Orden guardado.");
    } catch {
      toast.error("No se pudo guardar el nuevo orden.");
      setOrdenLocal(null); // revertir al orden del servidor
    }
  }

  function onDragEnd() {
    // Si se soltó fuera de un drop target válido, revertir
    draggingId.current = null;
    dragOverId.current = null;
  }

  const isPending = crear.isPending || editar.isPending;

  return (
    <PantallaConHeader
      titulo="Categorías"
      subtitulo={
        <p className="text-body-sm text-on-surface-variant">
          {ordenadas.length} categoría{ordenadas.length !== 1 ? "s" : ""}
        </p>
      }
      accion={
        <Button size="icon" onClick={abrirCrear} aria-label="Nueva categoría">
          <Plus className="h-5 w-5" aria-hidden />
        </Button>
      }
    >
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => <SkeletonFila key={i} />)}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl bg-error-container/40 p-6 text-center text-body-sm text-on-error-container">
          No se pudieron cargar las categorías.
        </div>
      )}

      {!isLoading && !isError && ordenadas.length === 0 && (
        <div className="flex flex-col items-center py-10 text-center">
          <img
            src="/spil.png"
            alt="Sin categorías"
            className="h-40 w-40 object-contain"
          />
          <p className="mt-4 text-label-lg font-semibold text-on-surface">
            Sin categorías
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Crea la primera categoría para organizar tus productos.
          </p>
        </div>
      )}

      {!isLoading && !isError && ordenadas.length > 0 && (
        <ul className="flex flex-col gap-2" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
          {ordenadas.map((cat) => (
            <CategoriaFila
              key={cat.id}
              categoria={cat}
              dragging={draggingId.current === cat.id}
              onEditar={() => abrirEditar(cat)}
              onEliminar={() => handleEliminar(cat)}
              eliminando={eliminar.isPending}
              onDragStart={(e) => onDragStart(e, cat.id)}
              onDragOver={(e) => onDragOver(e, cat.id)}
              onDragEnd={onDragEnd}
            />
          ))}
        </ul>
      )}

      {/* Drawer crear/editar — sin campo de orden (lo gestiona el drag) */}
      <Drawer
        open={drawer.abierto}
        onClose={cerrar}
        title={drawer.modo === "crear" ? "Nueva categoría" : "Editar categoría"}
        descripcion={
          drawer.modo === "crear"
            ? "Ingresa el nombre de la categoría."
            : "Modifica el nombre de la categoría."
        }
      >
        <form onSubmit={enviar} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Café, Postres, Bebidas…"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoFocus
          />

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
              {drawer.modo === "crear" ? "Crear" : "Guardar"}
            </Button>
          </div>
        </form>
      </Drawer>
    </PantallaConHeader>
  );
}

// ─── Fila de categoría con drag-and-drop ──────────────────────────────────────

function CategoriaFila({
  categoria,
  dragging,
  onEditar,
  onEliminar,
  eliminando,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  categoria: CategoriaDto;
  dragging: boolean;
  onEditar: () => void;
  onEliminar: () => void;
  eliminando: boolean;
  onDragStart: (e: DragEvent<HTMLLIElement>) => void;
  onDragOver: (e: DragEvent<HTMLLIElement>) => void;
  onDragEnd: () => void;
}) {
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-outline-variant/40",
        "bg-surface-container-lowest px-4 py-3 shadow-soft",
        "transition-all duration-150",
        dragging ? "opacity-40 scale-[0.98] border-primary-container" : "cursor-grab active:cursor-grabbing",
      )}
    >
      {/* Handle de drag */}
      <span
        className="shrink-0 cursor-grab touch-none text-on-surface-variant/40 active:cursor-grabbing"
        aria-hidden
      >
        <GripVertical className="h-5 w-5" />
      </span>

      {/* Número de orden */}
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-container/15 text-label-md font-bold text-primary-container">
        {categoria.orden}
      </span>

      {/* Nombre */}
      <p className="min-w-0 flex-1 truncate text-label-lg font-semibold text-on-surface">
        {categoria.nombre}
      </p>

      {/* Acciones */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={onEditar}
          aria-label={`Editar categoría ${categoria.nombre}`}
          className="grid h-9 w-9 place-items-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          <Edit2 className="h-4 w-4" aria-hidden />
        </button>
        <button
          onClick={onEliminar}
          disabled={eliminando}
          aria-label={`Eliminar categoría ${categoria.nombre}`}
          className="grid h-9 w-9 place-items-center rounded-xl text-on-surface-variant transition-colors hover:bg-error-container/40 hover:text-on-error-container disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}
