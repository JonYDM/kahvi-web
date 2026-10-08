import type { LucideIcon } from "lucide-react";
import {
  ChefHat,
  Coffee,
  Home,
  Receipt,
  ShoppingCart,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import type { Accion } from "@/lib/permisos";

export interface NavItem {
  /** Ruta absoluta. */
  to: string;
  /** Etiqueta corta para el menú. */
  label: string;
  icon: LucideIcon;
  /**
   * Acción/permiso requerido para ver el ítem. Si es null, lo ven todos los
   * usuarios del área (ej: Inicio). El AppShell filtra con `puede`.
   */
  permiso: Accion | null;
  /**
   * Si true, el ítem NO va en la barra inferior sino en el menú "Más".
   */
  secundario?: boolean;
}

/**
 * Navegación del Administrador (/app/*).
 * Barra inferior: Inicio · POS (ventas directas).
 * Menú "Más": Historial de ventas · Equipo.
 */
export const navStaff: NavItem[] = [
  { to: "/app/pos", label: "Ventas", icon: ShoppingCart, permiso: "usar_pos" },
  { to: "/app", label: "Inicio", icon: Home, permiso: null },
  { to: "/app/ventas", label: "Historial", icon: Receipt, permiso: "ver_metricas", secundario: true },
  { to: "/app/equipo", label: "Equipo", icon: UserCog, permiso: "gestionar_equipo", secundario: true },
];

/**
 * Navegación del panel SuperAdmin (/admin/*).
 */
export const navAdmin: NavItem[] = [
  { to: "/admin", label: "Inicio", icon: Home, permiso: "gestionar_cafeterias" },
  { to: "/admin/cafeterias", label: "Cafeterías", icon: Coffee, permiso: "gestionar_cafeterias" },
  { to: "/admin/administradores", label: "Admins", icon: Users, permiso: "gestionar_cafeterias" },
];

/** Navegación del Mesero (/mesero): pantalla única de comandas. */
export const navMesero: NavItem[] = [
  { to: "/mesero", label: "Comanda", icon: ShoppingCart, permiso: null },
];

/** Navegación de Cocina (/cocina): tablero. */
export const navCocina: NavItem[] = [
  { to: "/cocina", label: "Cocina", icon: ChefHat, permiso: null },
];

/** Navegación de Caja (/caja): cobros. */
export const navCaja: NavItem[] = [
  { to: "/caja", label: "Caja", icon: Wallet, permiso: null },
];
