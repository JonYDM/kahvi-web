/**
 * Genera un CSV a partir de filas y dispara su descarga en el navegador.
 * Todo ocurre en el cliente (Blob), sin llamar al backend.
 */
export function descargarCsv(
  nombreArchivo: string,
  encabezados: string[],
  filas: (string | number)[][],
): void {
  const escapar = (valor: string | number): string => {
    const s = String(valor ?? "");
    // Envuelve en comillas si contiene coma, comilla o salto de línea.
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lineas = [
    encabezados.map(escapar).join(","),
    ...filas.map((fila) => fila.map(escapar).join(",")),
  ];
  // BOM para que Excel abra los acentos correctamente.
  const contenido = "\uFEFF" + lineas.join("\r\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}




