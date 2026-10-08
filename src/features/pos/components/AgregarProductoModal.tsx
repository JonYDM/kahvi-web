import { useState, type FormEvent } from "react";
import { Button, Input, Modal, Select } from "@/components/ui";
import { ApiError } from "@/lib/http";
import { useCategorias } from "@/features/categorias";
import type { AgregarProductoRequest } from "@/types/api";
import { useAgregarProducto } from "../hooks";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Modal para agregar un producto al catálogo (solo Admin). */
export function AgregarProductoModal({ open, onClose }: Props) {
  const agregar = useAgregarProducto();
  const { data: categorias } = useCategorias();

  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [precio, setPrecio] = useState("");
  const [costo, setCosto] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sincroniza el default de categoría cuando carguen las categorías
  const opcionesCategorias = (categorias ?? [])
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((c) => ({ value: c.id, label: c.nombre }));

  // Si aún no hay categoría seleccionada y ya tenemos opciones, usa la primera
  const categoriaSeleccionada = categoriaId || (opcionesCategorias[0]?.value ?? "");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoriaSeleccionada) {
      setError("Selecciona una categoría.");
      return;
    }

    const body: AgregarProductoRequest = {
      nombre: nombre.trim(),
      categoriaId: categoriaSeleccionada,
      precio: Number(precio),
      costo: costo ? Number(costo) : null,
    };

    try {
      await agregar.mutateAsync(body);
      setNombre("");
      setPrecio("");
      setCosto("");
      setCategoriaId("");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo agregar el producto.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo producto">
      <form onSubmit={enviar} className="space-y-4">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <Select
          label="Categoría"
          value={categoriaSeleccionada}
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
          <Button type="button" variant="ghost" onClick={onClose} fullWidth>
            Cancelar
          </Button>
          <Button type="submit" loading={agregar.isPending} fullWidth>
            Agregar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
