import { http } from "@/lib/http";
import type {
  AgregarProductoRequest,
  Producto,
  RegistrarVentaRequest,
  ResumenVentas,
  VentaHistorial,
  VentaResponse,
} from "@/types/api";

/** Catálogo de productos de la cafetería (tenant del token). */
export function listarCatalogo(signal?: AbortSignal): Promise<Producto[]> {
  return http.get<Producto[]>("/api/productos", signal);
}

/** Solo productos inactivos (Admin). */
export function listarCatalogoTodos(signal?: AbortSignal): Promise<Producto[]> {
  return http.get<Producto[]>("/api/productos?estado=Todos", signal);
}

/** Agrega un producto al catálogo (solo Admin). */
export function agregarProducto(body: AgregarProductoRequest): Promise<string> {
  return http.post<string>("/api/productos", body);
}

/** Registra una venta directa (Admin). */
export function registrarVenta(body: RegistrarVentaRequest): Promise<VentaResponse> {
  return http.post<VentaResponse>("/api/ventas", body);
}

/** Historial de ventas del día (Admin). */
export function listarVentas(
  desde?: string,
  hasta?: string,
  signal?: AbortSignal,
): Promise<VentaHistorial[]> {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return http.get<VentaHistorial[]>(`/api/ventas${qs}`, signal);
}

/** Resumen de ventas de un período. */
export function resumenVentas(
  desde?: string,
  hasta?: string,
  signal?: AbortSignal,
): Promise<ResumenVentas> {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return http.get<ResumenVentas>(`/api/ventas/resumen${qs}`, signal);
}

/** Edita un producto (Admin). */
export function editarProducto(
  productoId: string,
  body: { nombre: string; categoriaId: string; precio: number; costo?: number | null },
): Promise<unknown> {
  return http.put(`/api/productos/${productoId}`, body);
}

/** Desactiva (baja lógica) un producto (Admin). */
export function desactivarProducto(productoId: string): Promise<unknown> {
  return http.post(`/api/productos/${productoId}/desactivar`);
}

/** Reactiva un producto previamente desactivado (Admin). */
export function activarProducto(productoId: string): Promise<unknown> {
  return http.post(`/api/productos/${productoId}/activar`);
}


