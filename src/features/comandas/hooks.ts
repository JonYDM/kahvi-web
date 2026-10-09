import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  avanzarComanda,
  cancelarComanda,
  cobrarComanda,
  enviarComanda,
  getComandasActivas,
} from "./api";
import type { CobrarComandaRequest, EnviarComandaRequest } from "@/types/api";

const QUERY_KEYS = {
  activas: ["comandas", "activas"] as const,
};

/**
 * Comandas activas con polling automático cada 5 segundos.
 * Usado por Cocina y Caja.
 */
export function useComandasActivas() {
  return useQuery({
    queryKey: QUERY_KEYS.activas,
    queryFn: ({ signal }) => getComandasActivas(signal),
    refetchInterval: 5000,
  });
}

/** Envía una nueva comanda. Invalida la lista de activas. */
export function useEnviarComanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EnviarComandaRequest) => enviarComanda(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activas });
    },
  });
}

/** Avanza el estado de una comanda (Recibida â†’ EnPreparacion â†’ Lista). */
export function useAvanzarComanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => avanzarComanda(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activas });
    },
  });
}

/** Cancela una comanda. */
export function useCancelarComanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelarComanda(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activas });
    },
  });
}

/** Cobra una comanda y genera la venta. Invalida comandas y ventas. */
export function useCobrarComanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CobrarComandaRequest }) =>
      cobrarComanda(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activas });
      qc.invalidateQueries({ queryKey: ["ventas"] });
    },
  });
}




