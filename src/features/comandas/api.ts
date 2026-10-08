import { http } from "@/lib/http";
import type {
  CobrarComandaRequest,
  ComandaDto,
  EnviarComandaRequest,
  EstadoComanda,
} from "@/types/api";

/** Lista todas las comandas activas (Recibida, EnPreparacion, Lista). */
export function getComandasActivas(signal?: AbortSignal): Promise<ComandaDto[]> {
  return http.get<ComandaDto[]>("/api/comandas/activas", signal);
}

/** Crea una nueva comanda. Devuelve el id asignado. */
export function enviarComanda(
  data: EnviarComandaRequest,
  signal?: AbortSignal,
): Promise<{ id: string }> {
  return http.post<{ id: string }>("/api/comandas", data, signal);
}

/** Avanza el estado de la comanda al siguiente paso. */
export function avanzarComanda(
  id: string,
  signal?: AbortSignal,
): Promise<{ nuevoEstado: EstadoComanda }> {
  return http.post<{ nuevoEstado: EstadoComanda }>(
    `/api/comandas/${id}/avanzar`,
    undefined,
    signal,
  );
}

/** Cancela la comanda. */
export function cancelarComanda(id: string, signal?: AbortSignal): Promise<void> {
  return http.post<void>(`/api/comandas/${id}/cancelar`, undefined, signal);
}

/** Cobra la comanda y genera la venta. Devuelve el ventaId. */
export function cobrarComanda(
  id: string,
  data: CobrarComandaRequest,
  signal?: AbortSignal,
): Promise<{ ventaId: string }> {
  return http.post<{ ventaId: string }>(
    `/api/comandas/${id}/cobrar`,
    data,
    signal,
  );
}


