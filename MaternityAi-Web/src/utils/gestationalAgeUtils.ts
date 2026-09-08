/**
 * Calcula las semanas actuales de gestación a partir de la FUM (Fecha de Última Menstruación).
 */
export const calculateCurrentWeeks = (fechaUltimaMenstruacion?: string | null): number => {
  if (!fechaUltimaMenstruacion) return 0;
  
  // Parsear la fecha usando partes locales para evitar problemas de desfase de zona horaria
  const [year, month, day] = fechaUltimaMenstruacion.split('-').map(Number);
  const fum = new Date(year, month - 1, day);
  const hoy = new Date();
  
  // Forzar las fechas a medianoche
  fum.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);
  
  const diffTime = hoy.getTime() - fum.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 0;
  return Math.floor(diffDays / 7);
};

/**
 * Obtiene el nombre del trimestre o de la fase actual basándose en las semanas actuales de gestación.
 */
export const getFaseOrTrimestre = (semanas?: number | null): string => {
  if (semanas == null) return 'N/A';
  if (semanas <= 13) return 'Trimestre 1';
  if (semanas <= 27) return 'Trimestre 2';
  if (semanas <= 42) return 'Trimestre 3';
  return 'Parto y Puerperio';
};
