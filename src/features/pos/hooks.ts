import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  agregarProducto,
  activarProducto,
  desactivarProducto,
  editarProducto,
  listarCatalogo,
  listarCatalogoTodos,
  listarVentas,
  registrarVenta,
  resumenVentas,
} from "./api";
import type { AgregarProductoRequest, RegistrarVentaRequest } from "@/types/api";

/** Catálogo de productos de la cafetería actual. */
export function useCatalogo() {
  return useQuery({
    queryKey: ["catalogo"],
    queryFn: ({ signal }) => listarCatalogo(signal),
  });
}

/** Todos los productos incluyendo inactivos (Admin). */
export function useCatalogoTodos() {
  return useQuery({
    queryKey: ["catalogo", "todos"],
    queryFn: ({ signal }) => listarCatalogoTodos(signal),
  });
}

/** Agrega un producto e invalida el catálogo. */
export function useAgregarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AgregarProductoRequest) => agregarProducto(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogo"] });
    },
  });
}

/** Registra una venta e invalida el catálogo y ventas. */
export function useRegistrarVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegistrarVentaRequest) => registrarVenta(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogo"] });
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
    },
  });
}

/** Edita un producto e invalida el catálogo. */
export function useEditarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productoId,
      nombre,
      categoriaId,
      precio,
      costo,
    }: {
      productoId: string;
      nombre: string;
      categoriaId: string;
      precio: number;
      costo?: number | null;
    }) => editarProducto(productoId, { nombre, categoriaId, precio, costo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogo"] });
    },
  });
}

/** Desactiva un producto e invalida el catálogo. */
export function useDesactivarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productoId: string) => desactivarProducto(productoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogo"] });
    },
  });
}

/** Activa (reactiva) un producto e invalida el catálogo. */
export function useActivarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productoId: string) => activarProducto(productoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogo"] });
    },
  });
}

/** Historial de ventas de la cafetería. */
export function useVentas(desde?: string, hasta?: string) {
  return useQuery({
    queryKey: ["ventas", desde ?? "", hasta ?? ""],
    queryFn: ({ signal }) => listarVentas(desde, hasta, signal),
  });
}

/** Resumen de ventas de un período. */
export function useResumenVentas(desde?: string, hasta?: string) {
  return useQuery({
    queryKey: ["ventas", "resumen", desde ?? "", hasta ?? ""],
    queryFn: ({ signal }) => resumenVentas(desde, hasta, signal),
  });
}




