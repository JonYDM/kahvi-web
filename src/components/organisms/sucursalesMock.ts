/**
 * [MOCK] Sucursales de ejemplo para el selector del header.
 *
 * Regla de negocio (ver docs/REDISENO-STITCH.md Â§1): un Administrador puede gestionar
 * más de una veterinaria SOLO si el SuperAdmin se lo permite. El backend hoy maneja
 * 1 usuario â†” 1 veterinaria (via token). Datos quemados hasta que exista multi-sucursal.
 */
export interface SucursalMock {
  id: string;
  nombre: string;
  zona: string;
}

export const SUCURSALES_MOCK: SucursalMock[] = [
  { id: "mock-1", nombre: "Kahvi", zona: "Roma Norte" },
  { id: "mock-2", nombre: "Kahvi", zona: "Condesa" },
  { id: "mock-3", nombre: "Kahvi", zona: "Del Valle" },
];


