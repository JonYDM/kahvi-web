import { useState, type FormEvent } from "react";
import { Edit2, GripVertical, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/molecules/EmptyState";
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

/** Gestión CRUD de categorías de productos. Solo Administrador. */
export function CategoriasPage() {
  const { data: categorias, isLoading, isError } = useCategorias();
  const crear = useCrearCategoria();
  const editar = useEditarCategoria();
  const eliminar = useEliminarCategoria();
  const toast = useToast();

  const [drawer, setDrawer] = useState<EstadoDrawer>(DRAWER_CERRADO);

  // Formulario del drawer
  const [nombre, setNombre] = useState("");
  const [orden, setOrden] = useState("");
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const ordenadas = [...(categorias ?? [])].sort((a, b) => a.orden - b.orden);

  function abrirCrear() {
    setNombre("");
    setOrden(String((categorias?.length ?? 0) + 1));
    setErrorForm(null);
    setDrawer({ abierto: true, modo: "crear", categoria: null });
  }

  function abrirEditar(cat: CategoriaDto) {
    setNombre(cat.nombre);
    setOrden(String(cat.orden));
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
    const data = { nombre: nombre.trim(), orden: Number(orden) };

    if (!data.nombre) {
      setErrorForm("El nombre es obligatorio.");
      return;
    }
    if (isNaN(data.orden) || data.orden < 0) {
      setErrorForm("El orden debe ser un número ≥ 0.");
      return;
    }

    try {
      if (drawer.modo === "crear") {
        await crear.mutateAsync(data);
        toast.exito("Categoría creada.");
      } else if (drawer.categoria) {
        await editar.mutateAsync({ id: drawer.categoria.id, data });
        toast.exito("Categoría actualizada.");
      }
      cerrar();
    } catch (err) {
      setErrorForm(
        err instanceof ApiError ? err.message : "No se pudo guardar la categoría.",
      );
    }
  }

  async function handleEliminar(cat: CategoriaDto) {
    try {
      await eliminar.mutateAsync(cat.id);
      toast.exito(`Categoría "${cat.nombre}" eliminada.`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "No se pudo eliminar la categoría.",
      );
    }
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
        <EmptyState
          titulo="Sin categorías"
          descripcion="Crea la primera categoría para organizar tus productos."
        />
      )}

      {!isLoading && !isError && ordenadas.length > 0 && (
        <ul className="flex flex-col gap-2">
          {ordenadas.map((cat) => (
            <CategoriaFila
              key={cat.id}
              categoria={cat}
              onEditar={() => abrirEditar(cat)}
              onEliminar={() => handleEliminar(cat)}
              eliminando={eliminar.isPending}
            />
          ))}
        </ul>
      )}

      {/* Drawer de crear/editar */}
      <Drawer
        open={drawer.abierto}
        onClose={cerrar}
        title={drawer.modo === "crear" ? "Nueva categoría" : "Editar categoría"}
        descripcion={
          drawer.modo === "crear"
            ? "Ingresa el nombre y el orden de visualización."
            : "Modifica el nombre o el orden."
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
          <Input
            label="Orden"
            type="number"
            min="0"
            step="1"
            placeholder="1"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            required
          />

          {errorForm && (
            <p
              role="alert"
              className="rounded-xl bg-error-container/60 px-4 py-3 text-body-sm font-medium text-on-error-container"
            >
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

// ─── Fila de categoría ────────────────────────────────────────────────────────

function CategoriaFila({
  categoria,
  onEditar,
  onEliminar,
  eliminando,
}: {
  categoria: CategoriaDto;
  onEditar: () => void;
  onEliminar: () => void;
  eliminando: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-outline-variant/40",
        "bg-surface-container-lowest px-4 py-3 shadow-soft",
      )}
    >
      {/* Icono de orden/drag (visual únicamente) */}
      <span className="shrink-0 text-on-surface-variant/40" aria-hidden>
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
