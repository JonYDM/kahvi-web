import { useEffect, useState } from "react";

/**
 * Devuelve true si la media query hace match. Reacciona a cambios de tamaño.
 * Uso típico: useMediaQuery("(min-width: 768px)") para distinguir escritorio.
 */
export function useMediaQuery(query: string): boolean {
  const [coincide, setCoincide] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setCoincide(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return coincide;
}




