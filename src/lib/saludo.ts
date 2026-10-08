/**
 * Saludo según la hora LOCAL del dispositivo (offline-friendly para PWA, sin peso).
 * Una frase por franja para mantener consistencia (ideal en login).
 *  - 05:00â€“11:59 â†’ Buenos días
 *  - 12:00â€“18:59 â†’ Buenas tardes
 *  - 19:00â€“04:59 â†’ Buenas noches
 */
export function saludoPorHora(fecha: Date = new Date()): string {
  const h = fecha.getHours();
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 19) return "Buenas tardes";
  return "Buenas noches";
}


