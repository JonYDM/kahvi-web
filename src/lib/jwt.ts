import type { JwtClaims } from "@/types/api";

/**
 * Decodifica el payload de un JWT sin verificar la firma (eso lo hace el backend).
 * Ligero: usa atob nativo, sin dependencias. Devuelve null si el token es inválido.
 */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

const CLAIM_CAFETERIA = "cafeteriaId";

/** Extrae el cafeteriaId del token (o undefined si no está). */
export function getCafeteriaId(claims: JwtClaims | null): string | undefined {
  const v = claims?.[CLAIM_CAFETERIA];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** Indica si el token ya expiró (con margen de 10s para desfaces de reloj). */
export function isExpired(claims: JwtClaims | null): boolean {
  if (!claims?.exp) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return claims.exp <= nowSeconds + 10;
}


