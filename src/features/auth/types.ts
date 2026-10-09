import type { RolUsuario } from "@/types/api";

/** Sesión activa del usuario, derivada del login + claims del JWT. */
export interface Sesion {
  token: string;
  nombre: string;
  rol: RolUsuario;
  /** Del JWT (ausente para SuperAdmin). */
  cafeteriaId?: string;
}

export interface AuthState {
  sesion: Sesion | null;
  cargando: boolean;
}




