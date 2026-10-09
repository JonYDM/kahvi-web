import {
  CategoriaProducto,
  MetodoPago,
  RolUsuario,
} from "@/types/api";
import type { EstadoComanda } from "@/types/api";

/** Etiquetas en español para cada enum del backend (para mostrar en la UI). */

export const rolLabel: Record<RolUsuario, string> = {
  [RolUsuario.Administrador]: "Administrador",
  [RolUsuario.Mesero]: "Mesero",
  [RolUsuario.Cocina]: "Cocina",
  [RolUsuario.Caja]: "Caja",
  [RolUsuario.SuperAdmin]: "SuperAdmin",
};

export const categoriaProductoLabel: Record<CategoriaProducto, string> = {
  [CategoriaProducto.Cafe]: "Café",
  [CategoriaProducto.Desayunos]: "Desayunos",
  [CategoriaProducto.Postres]: "Postres",
  [CategoriaProducto.Bebidas]: "Bebidas",
  [CategoriaProducto.Otro]: "Otro",
};

export const metodoPagoLabel: Record<MetodoPago, string> = {
  [MetodoPago.Efectivo]: "Efectivo",
  [MetodoPago.Tarjeta]: "Tarjeta",
  [MetodoPago.Transferencia]: "Transferencia",
};

/** Etiquetas de estado de comanda. */
export const estadoComandaLabel: Record<EstadoComanda, string> = {
  Recibida: "Recibida",
  EnPreparacion: "En preparación",
  Lista: "Lista",
  Entregada: "Entregada",
  Cancelada: "Cancelada",
};

/** Color de fondo por estado de comanda (para badges/tarjetas). */
export function estadoComandaColor(estado: EstadoComanda): string {
  switch (estado) {
    case "Recibida":
      return "bg-caramelo/20 text-cafe-intenso border-caramelo/40";
    case "EnPreparacion":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Lista":
      return "bg-verde-menta/20 text-cafe-intenso border-verde-menta/50";
    case "Entregada":
      return "bg-surface-container text-on-surface-variant border-outline-variant";
    case "Cancelada":
      return "bg-error-container text-on-error-container border-error-container";
    default:
      return "bg-surface-container text-on-surface-variant border-outline-variant";
  }
}




