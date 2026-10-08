import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crearCategoria, editarCategoria, eliminarCategoria, getCategorias } from "./api";

const KEY = ["categorias"] as const;

/** Lista de categorías de la cafetería (del token). Ordenadas por `orden` en el backend. */
export function useCategorias() {
  return useQuery({
    queryKey: KEY,
    queryFn: ({ signal }) => getCategorias(signal),
  });
}

/** Crea una categoría e invalida la lista. */
export function useCrearCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { nombre: string; orden: number }) => crearCategoria(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

/** Edita una categoría e invalida la lista. */
export function useEditarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { nombre: string; orden: number } }) =>
      editarCategoria(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

/** Elimina una categoría e invalida la lista. */
export function useEliminarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eliminarCategoria(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}


