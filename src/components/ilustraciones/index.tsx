import { cn } from "@/lib/cn";

/**
 * Ilustraciones vectoriales propias (SVG), sin dependencias ni equipo gráfico.
 * Se usan para dar carácter estilo Nubank: blobs de fondo, huellas decorativas
 * y una mascota simpática para estados vacíos.
 */

/** Blob orgánico decorativo (fondo). Hereda el color vía `text-*` + fill=currentColor. */
export function Blob({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden fill="currentColor">
      <path d="M42.7,-62.9C54.9,-54.3,64.5,-42.2,69.8,-28.2C75.6,-14.2,74,1.7,68.8,15.8C63.6,29.9,54.8,42.2,43.1,52.5C31.4,62.8,16.7,71.1,0.9,69.9C-15,68.7,-30,58,-42.9,46.4C-55.8,34.8,-66.6,22.3,-70.5,7.4C-74.4,-7.6,-71.4,-25,-61.8,-37.9C-52.2,-50.8,-36,-59.2,-20.6,-66.5C-5.2,-73.8,9.4,-80,23.6,-77.3C37.8,-74.6,51.6,-63,42.7,-62.9Z" transform="translate(100 100)" />
    </svg>
  );
}

/** Huella de mascota (decorativa). */
export function Huella({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden fill="currentColor">
      <ellipse cx="50" cy="62" rx="22" ry="18" />
      <ellipse cx="24" cy="40" rx="9" ry="12" />
      <ellipse cx="42" cy="28" rx="9" ry="12" />
      <ellipse cx="58" cy="28" rx="9" ry="12" />
      <ellipse cx="76" cy="40" rx="9" ry="12" />
    </svg>
  );
}

/**
 * Ilustración de mascota (perro estilizado) para estados vacíos. Formas simples
 * con los colores de marca; el fondo es un círculo con gradiente suave.
 */
export function MascotaVacio({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={cn("h-40 w-40", className)} aria-hidden>
      <circle cx="80" cy="80" r="76" fill="#E5EEEE" />
      {/* Cuerpo/cara */}
      <ellipse cx="80" cy="92" rx="42" ry="38" fill="#0D6E6E" />
      {/* Orejas */}
      <ellipse cx="46" cy="60" rx="13" ry="22" fill="#084C4C" transform="rotate(-20 46 60)" />
      <ellipse cx="114" cy="60" rx="13" ry="22" fill="#084C4C" transform="rotate(20 114 60)" />
      {/* Hocico */}
      <ellipse cx="80" cy="104" rx="20" ry="16" fill="#FFF" />
      <circle cx="80" cy="98" r="5" fill="#1A1D2E" />
      {/* Ojos */}
      <circle cx="66" cy="82" r="5" fill="#FFF" />
      <circle cx="94" cy="82" r="5" fill="#FFF" />
      <circle cx="66" cy="82" r="2.5" fill="#1A1D2E" />
      <circle cx="94" cy="82" r="2.5" fill="#1A1D2E" />
      {/* Mejillas terracota */}
      <circle cx="54" cy="96" r="5" fill="#F0954E" opacity="0.75" />
      <circle cx="106" cy="96" r="5" fill="#F0954E" opacity="0.75" />
    </svg>
  );
}




