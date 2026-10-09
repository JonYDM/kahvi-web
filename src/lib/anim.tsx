import { useEffect, useRef, type ReactNode } from "react";
import anime from "animejs";

/** ¿El usuario prefiere menos movimiento? (accesibilidad). */
function reduceMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/** Easing expresivo por defecto (coincide con los tokens). */
const EASE = "cubicBezier(0.16, 1, 0.3, 1)";

interface RevealProps {
  children: ReactNode;
  /** Retraso inicial en ms. */
  delay?: number;
  /** Si es true, anima los hijos directos en cascada (stagger). */
  stagger?: boolean;
  /** Desplazamiento vertical inicial en px. */
  y?: number;
  className?: string;
}

/**
 * Envuelve contenido y lo anima al montar con anime.js (fade + subida).
 * Si `stagger` es true, revela los hijos directos en cascada (ideal para listas/grids).
 * Respeta prefers-reduced-motion (aparece sin animar).
 */
export function Reveal({
  children,
  delay = 0,
  stagger = false,
  y = 12,
  className,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduceMotion()) {
      el.style.opacity = "1";
      return;
    }

    const targets = stagger ? Array.from(el.children) : el;

    // Estado inicial.
    anime.set(targets, { opacity: 0, translateY: y });

    const animation = anime({
      targets,
      opacity: [0, 1],
      translateY: [y, 0],
      duration: 600,
      delay: stagger ? anime.stagger(70, { start: delay }) : delay,
      easing: EASE,
    });

    return () => {
      animation.pause();
    };
  }, [delay, stagger, y]);

  return (
    <div ref={ref} className={className} style={{ opacity: stagger ? 1 : 0 }}>
      {children}
    </div>
  );
}




