/** Formato oficial de CURP (18 caracteres; sexo H, M o X). Igual que en el backend. */
export const PATRON_CURP = /^[A-Z]{4}\d{6}[HMX][A-Z]{5}[A-Z0-9]\d$/;

/** Minúsculas, sin acentos (ñâ†’n) y solo letras. Espejo de GeneradorNombreUsuario del backend. */
function limpiar(texto: string): string {
  return texto.trim().toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
}

/** Vista previa del usuario: primer nombre + apellido paterno. El backend resuelve choques. */
export function usuarioSugerido(nombre: string, paterno: string): string | null {
  const primerNombre = limpiar(nombre.trim().split(/\s+/)[0] ?? "");
  const ap = limpiar(paterno);
  return primerNombre && ap ? `${primerNombre}.${ap}` : null;
}

/** Normaliza lo tecleado en el campo CURP (mayúsculas, alfanumérico, máx. 18). */
export const normalizarCurp = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 18);

/** Solo dígitos, máx. 10 (teléfono MX). */
export const normalizarTelefono = (v: string) => v.replace(/\D/g, "").slice(0, 10);

/** Estado del formulario de datos personales (compartido por alta y edición). */
export interface DatosPersonales {
  nombre: string;
  paterno: string;
  materno: string;
  telefono: string;
  curp: string;
}

export const DATOS_VACIOS: DatosPersonales = { nombre: "", paterno: "", materno: "", telefono: "", curp: "" };

export const curpInvalida = (curp: string) => curp.length > 0 && !PATRON_CURP.test(curp);
export const nombreValido = (d: DatosPersonales) => d.nombre.trim().length > 0 && d.paterno.trim().length > 0;
export const contactoValido = (d: DatosPersonales) => d.telefono.length === 10 && !curpInvalida(d.curp);


