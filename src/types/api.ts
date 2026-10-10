/**
 * Tipos de la API de Kahvi. Reflejan los contratos reales del backend .NET.
 *
 * IMPORTANTE: el backend serializa los enums como NÀšMEROS (no strings).
 * Aquí se modelan como enums numéricos para que coincidan 1:1.
 */

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Enums (valores numéricos del backend) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export enum RolUsuario {
  Administrador = 1,
  Mesero = 2,
  Cocina = 3,
  Caja = 4,
  SuperAdmin = 99,
}

/**
 * @deprecated El backend ahora usa categorías dinámicas (CategoriaDto).
 * Conservado solo para compatibilidad con código legacy hasta migración completa.
 */
export enum CategoriaProducto {
  Cafe = 1,
  Desayunos = 2,
  Postres = 3,
  Bebidas = 4,
  Otro = 5,
}

/** Método de pago de una venta (coincide con el backend). */
export enum MetodoPago {
  Efectivo = 1,
  Tarjeta = 2,
  Transferencia = 3,
}

/** Filtro de estado para listados (coincide con el backend). */
export enum FiltroEstado {
  Activos = 0,
  Inactivos = 1,
  Todos = 2,
}

/** Estado de una comanda en su ciclo de vida. */
export type EstadoComanda =
  | "Recibida"
  | "EnPreparacion"
  | "Lista"
  | "Entregada"
  | "Cancelada";

/** Resultado paginado genérico que devuelve el backend. */
export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface LoginRequest {
  identificador: string;
  pin: string;
}

export interface LoginResponse {
  token: string;
  nombre: string;
  rol: RolUsuario;
  cafeteriaId: string;
}

/** Claims contenidos en el JWT (se extraen con lib/jwt). */
export interface JwtClaims {
  /** Id del usuario. */
  sub?: string;
  /** Id de la cafetería (tenant). Vacío/ausente para SuperAdmin. */
  cafeteriaId?: string;
  /** Rol (puede venir como nombre en el claim de rol estándar). */
  role?: string;
  exp?: number;
  [key: string]: unknown;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Categorías dinámicas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Categoría dinámica de producto (CRUD por el Administrador). */
export interface CategoriaDto {
  id: string;
  nombre: string;
  orden: number;
  cafeteriaId: string;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Entidades â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Plan de suscripción de la cafetería. */
export enum PlanSuscripcion {
  Mensual = 1,
  Anual = 2,
}

/** Sucursal de la cafetería. */
export interface Sucursal {
  id: string;
  cafeteriaId: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  esMatriz: boolean;
  activa: boolean;
  fechaAlta: string;
}

/** Cafetería (tenant) â€” visible para SuperAdmin. */
export interface Cafeteria {
  id: string;
  nombre: string;
  telefono: string;
  direccion?: string | null;
  activa: boolean;
  fechaAlta: string;
  plan: PlanSuscripcion;
  fechaRenovacion: string;
  sucursales: Sucursal[];
}

/** Alta/edición de cafetería. */
export interface CafeteriaRequest {
  nombre: string;
  telefono: string;
  direccion?: string | null;
  plan?: PlanSuscripcion;
  precio?: number | null;
}

/** Producto del catálogo. */
export interface Producto {
  id: string;
  cafeteriaId: string;
  nombre: string;
  /** ID de la categoría (Guid) â€” referencia a CategoriaDto. */
  categoriaId: string;
  precio: number;
  /** Costo de adquisición. Solo visible para el Administrador (null para otros roles). */
  costo?: number | null;
  activo: boolean;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Comandas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Línea de una comanda. */
export interface LineaComandaDto {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  nota?: string;
}

/** Comanda completa (del backend). */
export interface ComandaDto {
  id: string;
  folio: number;
  mesa: string;
  meseroId: string;
  meseroNombre: string;
  estado: EstadoComanda;
  /** UTC ISO 8601 */
  creadaEn: string;
  total: number;
  /** True si el pedido es para llevar (no se consume en mesa). */
  esParaLlevar: boolean;
  /** Nombre del cliente para pedidos para llevar (opcional). */
  nombreCliente?: string | null;
  items: LineaComandaDto[];
}

/** Payload para crear una comanda. */
export interface EnviarComandaRequest {
  /** Mesa o referencia del pedido (ej. "Mesa 3"). Vacío si esParaLlevar = true. */
  mesa?: string;
  meseroNombre: string;
  items: {
    productoId: string;
    nombre: string;
    cantidad: number;
    precio: number;
    nota?: string;
  }[];
  /** True si el pedido es para llevar. */
  esParaLlevar?: boolean;
  /** Nombre del cliente para pedidos para llevar. */
  nombreCliente?: string | null;
}

/** Payload para cobrar una comanda. */
export interface CobrarComandaRequest {
  metodoPago: MetodoPago;
  montoRecibido?: number;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Ventas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Línea de una venta del historial. */
export interface LineaVentaHistorial {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/** Venta del historial (con sus líneas). */
export interface VentaHistorial {
  id: string;
  fechaHora: string;
  total: number;
  metodoPago: MetodoPago;
  montoRecibido: number | null;
  cambio: number | null;
  lineas: LineaVentaHistorial[];
}

/** Resumen de ventas de un período. */
export interface ResumenVentas {
  total: number;
  numeroVentas: number;
  efectivo: number;
  tarjeta: number;
  transferencia: number;
  totalProductos: number;
}

/** Métricas del dashboard de la cafetería. */
export interface MetricasDashboard {
  ventasHoy: number;
  ventasMes: number;
  numeroVentasMes: number;
  /** Número de comandas activas (Recibida + EnPreparacion). */
  comandasActivas: number;
  /** Top 5 productos más vendidos hoy. */
  topProductos: { nombre: string; cantidad: number }[];
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Requests (comandos/DTOs) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Alta de staff. */
export interface CrearStaffRequest {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  telefono: string;
  curp?: string | null;
  pin: string;
  rol: RolUsuario.Mesero | RolUsuario.Cocina | RolUsuario.Caja;
}

/** Alta de Administrador de cafetería (para SuperAdmin). */
export interface CrearAdminRequest {
  cafeteriaId: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  telefono: string;
  curp?: string | null;
  pin: string;
}

/** Respuesta del alta de staff/admin. */
export interface UsuarioCreado {
  id: string;
  nombreUsuario: string;
  nombreCompleto: string;
}

/** Detalle de un usuario para el drawer de gestión. */
export interface UsuarioDetalle {
  id: string;
  nombreUsuario: string;
  nombre: string;
  nombres: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  telefono: string | null;
  curpEnmascarada: string | null;
  rol: RolUsuario;
  activo: boolean;
  cafeteriaId: string;
}

/** Edición de datos personales. */
export interface EditarDatosUsuarioRequest {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  telefono: string;
  curp?: string | null;
}

/** DTO seguro de usuario (sin hash de PIN) que devuelve la API. */
export interface UsuarioDto {
  id: string;
  nombreUsuario: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
  /** Teléfono de contacto del staff. */
  telefono?: string | null;
  /** Cafetería a la que pertenece. */
  cafeteriaId?: string;
}

export interface AgregarProductoRequest {
  nombre: string;
  /** ID de la categoría dinámica (Guid). */
  categoriaId: string;
  precio: number;
  /** Costo de adquisición. Solo visible para el Administrador. */
  costo?: number | null;
}

export interface ItemVenta {
  productoId: string;
  cantidad: number;
}

export interface RegistrarVentaRequest {
  items: ItemVenta[];
  metodoPago: MetodoPago;
  montoRecibido?: number | null;
}

export interface VentaResponse {
  ventaId: string;
  total: number;
  cambio: number | null;
}

/** Forma del error que devuelve el backend: { error: "mensaje" }. */
export interface ApiErrorBody {
  error: string;
}

/** Métricas SuperAdmin. */
export interface MetricasSuperAdmin {
  totalCafeterias: number;
  cafeteriasActivas: number;
  cafeteriasInactivas: number;
  ganadoMes: number;
  ganadoHistorico: number;
}

/** Datos opcionales del cobro al renovar. */
export interface RenovarRequest {
  monto?: number | null;
  fechaPago?: string | null;
  nota?: string | null;
}




