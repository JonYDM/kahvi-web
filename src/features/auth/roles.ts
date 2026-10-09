import { RolUsuario } from "@/types/api";

/** Ruta "home" a la que se redirige cada rol tras iniciar sesión. */
export function rutaInicialPorRol(rol: RolUsuario): string {
  switch (rol) {
    case RolUsuario.SuperAdmin:
      return "/admin";
    case RolUsuario.Mesero:
      return "/mesero";
    case RolUsuario.Cocina:
      return "/cocina";
    case RolUsuario.Caja:
      return "/caja";
    case RolUsuario.Administrador:
      return "/app";
    default:
      return "/app";
  }
}




