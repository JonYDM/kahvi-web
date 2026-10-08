import type { ApiErrorBody } from "@/types/api";

/**
 * Cliente HTTP ligero sobre fetch nativo (sin axios).
 * - Base URL configurable: en dev usa el proxy de Vite (/api â†’ Railway),
 *   en prod usa VITE_API_URL.
 * - Inyecta Authorization: Bearer <token> si hay sesión.
 * - Normaliza los errores del backend ({ error: "..." }) a ApiError.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

/** Error tipado de la API, con el código HTTP y el mensaje del backend. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Accessor del token: lo provee la capa de auth (evita acoplar el cliente
// a un almacenamiento concreto). Por defecto no hay token.
let tokenAccessor: () => string | null = () => null;

/** Registra cómo obtener el token actual (lo llama el AuthProvider). */
export function setTokenAccessor(accessor: () => string | null): void {
  tokenAccessor = accessor;
}

// Handler opcional para 401 (sesión inválida/expenrada): lo usa auth para logout.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;

  const headers: Record<string, string> = {};
  const token = tokenAccessor();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  // 401: sesión inválida â†’ notificar a la capa de auth.
  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiError(401, "Sesión expirada. Inicia sesión de nuevo.");
  }

  // 403: autenticado pero sin permiso para esta acción.
  // No hay handler global: el error se propaga como ApiError y las mutaciones
  // (acciones del usuario) muestran el toast; las queries de fondo lo manejan en silencio.
  if (response.status === 403) {
    throw new ApiError(403, "No tienes permiso para esta acción.");
  }

  // Sin contenido.
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message =
      (data as ApiErrorBody | null)?.error ??
      `Error ${response.status}. Intenta de nuevo.`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const http = {
  get: <T>(path: string, signal?: AbortSignal) =>
    request<T>(path, { method: "GET", signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: "POST", body, signal }),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: "PUT", body, signal }),
  delete: <T>(path: string, signal?: AbortSignal) =>
    request<T>(path, { method: "DELETE", signal }),
  /** POST multipart/form-data (para subir archivos). No fija Content-Type (lo hace el navegador con el boundary). */
  postForm: async <T>(path: string, form: FormData, signal?: AbortSignal): Promise<T> => {
    const headers: Record<string, string> = {};
    const token = tokenAccessor();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: form,
      signal,
    });

    if (response.status === 401) {
      onUnauthorized?.();
      throw new ApiError(401, "Sesión expirada. Inicia sesión de nuevo.");
    }
    if (response.status === 403) {
      throw new ApiError(403, "No tienes permiso para esta acción.");
    }
    if (response.status === 204) return undefined as T;

    const text = await response.text();
    const data = text ? safeJsonParse(text) : null;
    if (!response.ok) {
      const message =
        (data as ApiErrorBody | null)?.error ??
        `Error ${response.status}. Intenta de nuevo.`;
      throw new ApiError(response.status, message);
    }
    return data as T;
  },
};


