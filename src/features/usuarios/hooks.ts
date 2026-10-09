import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cambiarMiPin,
  crearStaff,
  editarDatosUsuario,
  gestionarUsuario,
  listarAdministradores,
  listarStaff,
  obtenerDetalleUsuario,
  obtenerUsuarioDeCliente,
  resetearPin,
} from "./api";
import type { CrearStaffRequest, EditarDatosUsuarioRequest } from "@/types/api";

/** Lista el staff de la veterinaria actual. */
export function useStaff() {
  return useQuery({
    queryKey: ["usuarios", "staff"],
    queryFn: ({ signal }) => listarStaff(signal),
  });
}

/** Lista los administradores (SuperAdmin). */
export function useAdministradores() {
  return useQuery({
    queryKey: ["usuarios", "administradores"],
    queryFn: ({ signal }) => listarAdministradores(signal),
  });
}

/** Usuario (acceso al portal) de un cliente; null si no tiene acceso. */
export function useUsuarioDeCliente(clienteId: string | null, habilitado = true) {
  return useQuery({
    queryKey: ["usuarios", "cliente", clienteId],
    queryFn: ({ signal }) => obtenerUsuarioDeCliente(clienteId as string, signal),
    enabled: !!clienteId && habilitado,
  });
}

/** Resetea el PIN de un usuario. */
export function useResetearPin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ usuarioId, nuevoPin }: { usuarioId: string; nuevoPin: string }) =>
      resetearPin(usuarioId, nuevoPin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

/** Crea un usuario de staff e invalida la lista de staff. */
export function useCrearStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CrearStaffRequest) => crearStaff(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios", "staff"] });
    },
  });
}

/** Cambia el PIN del usuario autenticado. */
export function useCambiarMiPin() {
  return useMutation({
    mutationFn: ({ pinActual, nuevoPin }: { pinActual: string; nuevoPin: string }) =>
      cambiarMiPin(pinActual, nuevoPin),
  });
}

/** Edita nombre y/o activa-desactiva un usuario e invalida las listas. */
export function useGestionarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      usuarioId,
      nuevoNombre,
      accion,
    }: {
      usuarioId: string;
      nuevoNombre?: string | null;
      accion?: 1 | 2 | null;
    }) => gestionarUsuario(usuarioId, { nuevoNombre, accion }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}

/** Detalle de un usuario (drawer de gestión). */
export function useDetalleUsuario(id: string | null) {
  return useQuery({
    queryKey: ["usuarios", "detalle", id],
    queryFn: ({ signal }) => obtenerDetalleUsuario(id as string, signal),
    enabled: !!id,
  });
}

/** Edita datos personales; invalida listas y detalle (todo cuelga de ["usuarios"]). */
export function useEditarDatosUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: EditarDatosUsuarioRequest }) =>
      editarDatosUsuario(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}




