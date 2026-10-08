import { http } from "@/lib/http";
import type {
  Cafeteria,
  CafeteriaRequest,
  CrearAdminRequest,
  MetricasSuperAdmin,
  RenovarRequest,
  UsuarioCreado,
} from "@/types/api";

/** Lista todas las cafeterías (tenants). */
export function listarCafeterias(signal?: AbortSignal): Promise<Cafeteria[]> {
  return http.get<Cafeteria[]>("/api/admin/cafeterias", signal);
}

/** Detalle de una cafetería. */
export function obtenerCafeteria(id: string, signal?: AbortSignal): Promise<Cafeteria> {
  return http.get<Cafeteria>(`/api/admin/cafeterias/${id}`, signal);
}

/** Métricas globales de la plataforma para el SuperAdmin. */
export function obtenerMetricasSuperAdmin(signal?: AbortSignal): Promise<MetricasSuperAdmin> {
  return http.get<MetricasSuperAdmin>("/api/admin/metricas", signal);
}

/** Crea una cafetería. */
export function crearCafeteria(body: CafeteriaRequest): Promise<{ id: string; nombre: string; activa: boolean }> {
  return http.post("/api/admin/cafeterias", body);
}

/** Activa una cafetería. */
export function activarCafeteria(id: string): Promise<unknown> {
  return http.post(`/api/admin/cafeterias/${id}/activar`);
}

/** Desactiva una cafetería. */
export function desactivarCafeteria(id: string): Promise<unknown> {
  return http.post(`/api/admin/cafeterias/${id}/desactivar`);
}

/** Renueva la suscripción de una cafetería. */
export function renovarCafeteria(id: string, body?: RenovarRequest): Promise<{ fechaRenovacion: string }> {
  return http.post(`/api/admin/cafeterias/${id}/renovar`, body ?? {});
}

/** Crea el Administrador de una cafetería. */
export function crearAdmin(body: CrearAdminRequest): Promise<UsuarioCreado> {
  return http.post<UsuarioCreado>("/api/admin/usuarios-admin", body);
}


