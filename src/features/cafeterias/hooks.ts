import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activarCafeteria,
  crearAdmin,
  crearCafeteria,
  desactivarCafeteria,
  listarCafeterias,
  obtenerCafeteria,
  obtenerMetricasSuperAdmin,
  renovarCafeteria,
} from "./api";
import type { CafeteriaRequest, CrearAdminRequest, RenovarRequest } from "@/types/api";

const KEY = ["cafeterias"];
const KEY_METRICAS = ["metricas-superadmin"];
const KEY_ADMINS = ["usuarios", "administradores"];

function invalidarCafeterias(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEY });
  qc.invalidateQueries({ queryKey: KEY_METRICAS });
}

export function useCafeterias() {
  return useQuery({
    queryKey: KEY,
    queryFn: ({ signal }) => listarCafeterias(signal),
  });
}

export function useCafeteria(id: string | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: ({ signal }) => obtenerCafeteria(id as string, signal),
    enabled: !!id,
  });
}

export function useMetricasSuperAdmin() {
  return useQuery({
    queryKey: KEY_METRICAS,
    queryFn: ({ signal }) => obtenerMetricasSuperAdmin(signal),
  });
}

export function useCrearCafeteria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CafeteriaRequest) => crearCafeteria(body),
    onSuccess: () => invalidarCafeterias(qc),
  });
}

export function useCambiarEstadoCafeteria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activar }: { id: string; activar: boolean }) =>
      activar ? activarCafeteria(id) : desactivarCafeteria(id),
    onSuccess: () => invalidarCafeterias(qc),
  });
}

export function useRenovarCafeteria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: RenovarRequest }) => renovarCafeteria(id, body),
    onSuccess: () => invalidarCafeterias(qc),
  });
}

export function useCrearAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CrearAdminRequest) => crearAdmin(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ADMINS });
      qc.invalidateQueries({ queryKey: KEY_METRICAS });
    },
  });
}




