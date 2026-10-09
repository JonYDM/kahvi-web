import { useEffect, useRef } from "react";
import anime from "animejs";

function reduceMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Anima un número contando desde 0 hasta el valor (efecto "count up" tipo Nubank).
 * Devuelve un ref para asignar a un elemento de texto.
 */
export function useContador(
  valor: number,
  formato: (n: number) => string = String,
) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceMotion()) {
      el.textContent = formato(valor);
      return;
    }
    const obj = { n: 0 };
    const animation = anime({
      targets: obj,
      n: valor,
      duration: 900,
      easing: "easeOutExpo",
      round: valor % 1 === 0 ? 1 : 100,
      update: () => {
        el.textContent = formato(obj.n);
      },
    });
    return () => animation.pause();
  }, [valor, formato]);

  return ref;
}




