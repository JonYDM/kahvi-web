import { RolUsuario } from "@/types/api";
import type { Sesion } from "@/features/auth/types";

/**
 * Acciones/capacidades de la app Kahvi. Una sola fuente de verdad de permisos.
 */
export type Accion =
  | "ver_metricas"      // dashboard de negocio (Admin)
  | "gestionar_equipo"  // crear/editar/desactivar staff (Admin)
  | "gestionar_cafeterias" // SuperAdmin: gestionar tenants
  | "usar_pos"          // punto de venta directo (Admin)
  | "ver_cocina"        // tablero de cocina (Cocina, Admin)
  | "ver_caja"          // módulo de caja/cobros (Caja, Admin)
  | "enviar_comanda"    // crear comanda (Mesero, Admin)
  | "gestionar_productos"; // alta/edición de productos (Admin)

/**
 * ¿La sesión puede realizar la acción? Àšnica fuente de verdad de permisos.
 */
export function puede(sesion: Sesion | null, accion: Accion): boolean {
  if (!sesion) return false;

  switch (sesion.rol) {
    case RolUsuario.SuperAdmin:
      return accion === "gestionar_cafeterias";

    case RolUsuario.Administrador:
      // El Administrador tiene acceso completo.
      return true;

    case RolUsuario.Mesero:
      return accion === "enviar_comanda";

    case RolUsuario.Cocina:
      return accion === "ver_cocina";

    case RolUsuario.Caja:
      return accion === "ver_caja";

    default:
      return false;
  }
}

/** ¿Puede ver el POS directo (venta sin comanda)? */
export function puedeVerPos(sesion: Sesion | null): boolean {
  if (!sesion) return false;
  return (
    sesion.rol === RolUsuario.Administrador ||
    sesion.rol === RolUsuario.Mesero ||
    sesion.rol === RolUsuario.Caja
  );
}

/** ¿Puede ver el tablero de cocina? */
export function puedeVerCocina(sesion: Sesion | null): boolean {
  if (!sesion) return false;
  return sesion.rol === RolUsuario.Cocina || sesion.rol === RolUsuario.Administrador;
}

/** ¿Puede ver el módulo de caja/corte? */
export function puedeVerCorte(sesion: Sesion | null): boolean {
  if (!sesion) return false;
  return sesion.rol === RolUsuario.Caja || sesion.rol === RolUsuario.Administrador;
}




