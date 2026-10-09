/**
 * Utilidades de formato con Intl nativo (sin librerías de fecha).
 * Localización: español de México (es-MX), moneda MXN.
 */

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const currencyFmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// Fecha "larga" legible: "Lunes, 28 de octubre". Como es PWA, se calcula con la
// fecha LOCAL del dispositivo (funciona offline, respeta la zona horaria del usuario).
const dateLongFmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** Fecha larga de HOY con la primera letra en mayúscula: "Lunes, 28 de octubre". */
export function fechaHoyLarga(): string {
  const t = dateLongFmt.format(new Date()); // "lunes, 28 de octubre"
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Fecha corta para espacios reducidos (header colapsado): "Lun 28 oct".
const dateShortFmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** Fecha corta de HOY: "Lun 28 oct" (local, offline-friendly para PWA). */
export function fechaHoyCorta(): string {
  return dateShortFmt.format(new Date()).replace(/\./g, "");
}

/**
 * Convierte a Date. Una fecha SIN hora ("2026-09-30", p. ej. un DateOnly del backend) se toma
 * como ese día en hora LOCAL: `new Date("2026-09-30")` la interpreta como medianoche UTC, que en
 * México (UTC-6) cae el día anterior a las 6 pm y mostraba la fecha un día antes.
 */
function aFechaLocal(value: string | Date): Date {
  if (typeof value !== "string") return value;
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (soloFecha) return new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]));
  return new Date(value);
}
/** Formatea una fecha ISO (o Date) como "27 sept 2026". */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "â€”";
  const d = aFechaLocal(value);
  if (Number.isNaN(d.getTime())) return "â€”";
  return dateFmt.format(d);
}

/** Formatea fecha y hora como "27 sept 2026, 14:30". */
export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return "â€”";
  const d = aFechaLocal(value);
  if (Number.isNaN(d.getTime())) return "â€”";
  return dateTimeFmt.format(d);
}

/** Formatea un número como moneda MXN: "$149.00". */
export function formatCurrency(value: number): string {
  return currencyFmt.format(value);
}

/** Calcula la edad en años desde una fecha ISO de nacimiento (o null). */
export function edadEnAnios(
  fechaNacimiento: string | null | undefined,
): number | null {
  if (!fechaNacimiento) return null;
  const nac = aFechaLocal(fechaNacimiento);
  if (Number.isNaN(nac.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad >= 0 ? edad : null;
}




