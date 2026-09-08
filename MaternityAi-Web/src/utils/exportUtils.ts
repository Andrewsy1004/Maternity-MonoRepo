/**
 * Descarga un Blob como archivo en el navegador.
 * Centraliza la lógica de exportación que antes estaba duplicada
 * en AdminUsuarias y AdminCargas.
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

/**
 * Genera un nombre de archivo con fecha actual.
 * Ejemplo: gestantes_2026-07-21.xlsx
 */
export const buildExportFilename = (
  prefix: string,
  format: string
): string => {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}_${date}.${format}`;
};
