// Genera los iconos de la PWA a partir de Vito (mascota de Kahvi).
// Uso: node scripts/generar-iconos-pwa.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const fuente = join(publicDir, "vito.png");

// Fondo crema de Kahvi (#FDFAF6) — nunca blanco puro
const fondo = { r: 253, g: 250, b: 246, alpha: 1 };

async function icono(tamano, archivo, padding = 0) {
  const contenido = tamano - padding * 2;
  const vito = await sharp(fuente)
    .resize({ width: contenido, height: contenido, fit: "contain", background: { r: 253, g: 250, b: 246, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: tamano, height: tamano, channels: 4, background: fondo } })
    .composite([{ input: vito, gravity: "center" }])
    .png()
    .toFile(join(publicDir, archivo));
  console.log(`OK ${archivo} (${tamano}x${tamano}, padding ${padding})`);
}

// Normales y maskable (mas padding para el area segura del icono)
await icono(192, "pwa-192x192.png", 20);
await icono(512, "pwa-512x512.png", 50);
await icono(512, "pwa-512x512-maskable.png", 110);
await icono(180, "apple-touch-icon.png", 18);
