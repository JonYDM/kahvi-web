import { http, ApiError } from "@/lib/http";
import type { LoginRequest, LoginResponse } from "@/types/api";

/** Llama al endpoint público de login. */
export function login(body: LoginRequest): Promise<LoginResponse> {
  return http.post<LoginResponse>("/api/auth/login", body);
}

/** Resultado de identificar (paso 1 del login). */
export interface IdentificarResultado {
  /** El identificador corresponde a un usuario válido. */
  existe: boolean;
  /** Nombre real del usuario, para saludarlo antes del PIN. */
  nombre?: string;
  /** Rol del usuario (si el backend lo devuelve). */
  rol?: string;
  /** True si el backend aún NO tiene el endpoint /auth/identificar. */
  noDisponible?: boolean;
}

/**
 * Valida el identificador ANTES de pedir el PIN.
 * Si el endpoint no existe (404/405), continúa como fallback.
 */
export async function identificar(nombreUsuario: string): Promise<IdentificarResultado> {
  try {
    return await http.post<IdentificarResultado>("/api/auth/identificar", {
      identificador: nombreUsuario,
    });
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405)) {
      return { existe: true, noDisponible: true };
    }
    throw e;
  }
}
