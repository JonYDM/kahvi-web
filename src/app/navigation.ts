import type { Icon } from "@phosphor-icons/react";
import {
  ChefHat,
  Coffee,
  House,
  Package,
  Receipt,
  ShoppingCart,
  Tag,
  TrendUp,
  UserGear,
  Users,
  Wallet,
} from "@phosphor-icons/react";
import type { Accion } from "@/lib/permisos";

export interface NavItem {
  /** Ruta absoluta. */
  to: string;
  /** Etiqueta corta para el menÃº. */
  label: string;
  icon: Icon;
  /**
   * AcciÃ³n/permiso requerido para ver el Ã­tem. Si es null, lo ven todos los
   * usuarios del Ã¡rea (ej: Inicio). El AppShell filtra con `puede`.
   */
  permiso: Accion | null;
  /**
   * Si true, el Ã­tem NO va en la barra inferior sino en el menÃº "MÃ¡s".
   */
  secundario?: boolean;
}

/**
 * NavegaciÃ³n del Administrador (/app/*).
 * Barra inferior: CategorÃ­as Â· Productos Â· Inicio Â· Ventas Â· MÃ¡s
 * MenÃº "MÃ¡s": Mesero, Cocina, Caja, Equipo, HistÃ³rico
 * El Admin tiene acceso a TODAS las estaciones.
 */
export const navStaff: NavItem[] = [
  { to: "/app/categorias", label: "CategorÃ­as", icon: Tag, permiso: "gestionar_productos" },
  { to: "/app/productos", label: "Productos", icon: Package, permiso: "gestionar_productos" },
  { to: "/app", label: "Inicio", icon: House, permiso: null },
  { to: "/app/ventas", label: "Ventas", icon: TrendUp, permiso: "ver_metricas" },
  // Estaciones â€” el Admin puede operar cualquiera
  { to: "/mesero", label: "Mesero", icon: ShoppingCart, permiso: null, secundario: true },
  { to: "/cocina", label: "Cocina", icon: ChefHat, permiso: null, secundario: true },
  { to: "/caja", label: "Caja", icon: Wallet, permiso: null, secundario: true },
  { to: "/app/equipo", label: "Equipo", icon: UserGear, permiso: "gestionar_equipo", secundario: true },
  { to: "/app/historico", label: "HistÃ³rico", icon: Receipt, permiso: "ver_metricas", secundario: true },
];

/**
 * NavegaciÃ³n del panel SuperAdmin (/admin/*).
 */
export const navAdmin: NavItem[] = [
  { to: "/admin", label: "Inicio", icon: House, permiso: "gestionar_cafeterias" },
  { to: "/admin/cafeterias", label: "CafeterÃ­as", icon: Coffee, permiso: "gestionar_cafeterias" },
  { to: "/admin/administradores", label: "Admins", icon: Users, permiso: "gestionar_cafeterias" },
];

/** NavegaciÃ³n del Mesero (/mesero): pantalla Ãºnica de comandas. */
export const navMesero: NavItem[] = [
  { to: "/mesero", label: "Comanda", icon: ShoppingCart, permiso: null },
];

/** NavegaciÃ³n de Cocina (/cocina): tablero. */
export const navCocina: NavItem[] = [
  { to: "/cocina", label: "Cocina", icon: ChefHat, permiso: null },
];

/** NavegaciÃ³n de Caja (/caja): cobros. */
export const navCaja: NavItem[] = [
  { to: "/caja", label: "Caja", icon: Wallet, permiso: null },
];

