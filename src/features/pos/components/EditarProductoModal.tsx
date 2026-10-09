import { useState, type FormEvent } from "react";
import { Trash } from "@phosphor-icons/react";
import { Button, Input, Modal, Select } from "@/components/ui";
import { ApiError } from "@/lib/http";
import { useCategorias } from "@/features/categorias";
import type { Producto } from "@/types/api";
import { useDesactivarProducto, useEditarProducto } from "../hooks";

interface Props {
  open: boolean;
  onClose: () => void;
  producto: Producto;
}

/** Modal para editar un producto o darlo de baja lógica. */
export function EditarProductoModal({ open, onClose, producto }: Props) {
  const editar = useEditarProducto();
  const desactivar = useDesactivarProducto();
  const { data: categorias } = useCategorias();

  const [nombre, setNombre] = useState(producto.nombre);
  const [categoriaId, setCategoriaId] = useState<string>(producto.categoriaId);
  const [precio, setPrecio] = useState(String(producto.precio));
  const [costo, setCosto] = useState(
    producto.costo != null ? String(producto.costo) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const opcionesCategorias = (categorias ?? [])
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((c) => ({ value: c.id, label: c.nombre }));

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoriaId) {
      setError("Selecciona una categoría.");
      return;
    }

    try {
      await editar.mutateAsync({
        productoId: producto.id,
        nombre: nombre.trim(),
        categoriaId,
        precio: Number(precio),
        costo: costo ? Number(costo) : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar.");
    }
  }

  async function darDeBaja() {
    setError(null);
    try {
      await desactivar.mutateAsync(producto.id);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo desactivar.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar producto">
      <form onSubmit={guardar} className="space-y-4">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <Select
          label="Categoría"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          options={opcionesCategorias}
          disabled={opcionesCategorias.length === 0}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Precio (MXN)"
            type="number"
            min="1"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
          <Input
            label="Costo (opcional)"
            type="number"
            min="0"
            step="0.01"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            placeholder="Costo (opcional, solo Admin ve esto)"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-error-container/60 px-4 py-3 text-body-sm font-medium text-on-error-container"
          >
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="danger"
            onClick={darDeBaja}
            loading={desactivar.isPending}
          >
            <Trash weight='light' className="h-4 w-4" aria-hidden />
            Dar de baja
          </Button>
          <Button type="submit" fullWidth loading={editar.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}





