import { http } from "@/lib/http";
import type { CategoriaDto } from "@/types/api";

/** Lista todas las categorías de la cafetería (extraída del token por el backend). */
export function getCategorias(signal?: AbortSignal): Promise<CategoriaDto[]> {
  return http.get<CategoriaDto[]>("/api/categorias", signal);
}

/** Crea una nueva categoría (solo Admin). */
export function crearCategoria(data: { nombre: string; orden: number }): Promise<CategoriaDto> {
  return http.post<CategoriaDto>("/api/categorias", data);
}

/** Edita una categoría existente (solo Admin). */
export function editarCategoria(
  id: string,
  data: { nombre: string; orden: number },
): Promise<CategoriaDto> {
  return http.put<CategoriaDto>(`/api/categorias/${id}`, data);
}

/** Elimina una categoría (solo Admin). */
export function eliminarCategoria(id: string): Promise<void> {
  return http.delete<void>(`/api/categorias/${id}`);
}


