// Script de optimización de imágenes: convierte los PNG de public/ a WebP optimizados.
// Ejecutar: node scripts/optimizar-imagenes.mjs
import sharp from "sharp";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

// Imágenes de Kahvi — tamaño máximo según uso en UI
const objetivos = [
  // Ilustraciones grandes (se muestran a ~160px max en mobile)
  { archivo: "spil.png",          ancho: 320 },
  { archivo: "dashboard-hero.png", ancho: 320 },
  { archivo: "sale.png",          ancho: 320 },
  // Mascota Vito (se muestra a ~64px en header, ~160px en login)
  { archivo: "vito.png",          ancho: 320 },
  { archivo: "vito-feliz.png",    ancho: 320 },
];

const kb = (n) => Math.round(n / 1024);

for (const { archivo, ancho } of objetivos) {
  const entrada = join(publicDir, archivo);
  const salida  = join(publicDir, archivo.replace(/\.png$/, ".webp"));

  try {
    const original = (await readFile(entrada)).length;
    const buffer = await sharp(entrada)
      .resize({ width: ancho, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    await writeFile(salida, buffer);
    console.log(`✓ ${archivo} ${kb(original)}KB → ${archivo.replace(/\.png$/, ".webp")} ${kb(buffer.length)}KB (−${Math.round((1 - buffer.length / original) * 100)}%)`);
  } catch (err) {
    console.error(`✗ ${archivo}: ${err.message}`);
  }
}

console.log("\nListo. Actualiza las referencias de .png a .webp en el código.");
