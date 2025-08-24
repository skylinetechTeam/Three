/**
 * Utilitários para formatação de valores no app
 */

/**
 * Formatar distância para exibição (máximo 4 dígitos)
 * @param {number} distanceInMeters - Distância em metros
 * @returns {string} - Distância formatada (ex: "10.9 km")
 */
export const formatDistance = (distanceInMeters) => {
  if (!distanceInMeters || isNaN(distanceInMeters)) {
    return "0.0 km";
  }
  
  const km = Math.min(Math.max(distanceInMeters / 1000, 0.1), 999.9);
  return `${km.toFixed(1)} km`;
};

/**
 * Formatar tempo para exibição (máximo 4 dígitos)
 * @param {number} timeInSeconds - Tempo em segundos
 * @returns {string} - Tempo formatado (ex: "22 min")
 */
export const formatTime = (timeInSeconds) => {
  if (!timeInSeconds || isNaN(timeInSeconds)) {
    return "1 min";
  }
  
  const minutes = Math.min(Math.max(Math.round(timeInSeconds / 60), 1), 9999);
  return `${minutes} min`;
};

/**
 * Formatar tarifa para exibição
 * @param {number} fare - Tarifa em AOA
 * @returns {string} - Tarifa formatada (ex: "1500 AOA")
 */
export const formatFare = (fare) => {
  if (!fare || isNaN(fare)) {
    return "0 AOA";
  }
  
  const roundedFare = Math.max(Math.round(fare), 0);
  return `${roundedFare} AOA`;
};

/**
 * Validar se um valor está dentro dos limites seguros
 * @param {number} value - Valor a ser validado
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} - Valor limitado entre min e max
 */
export const clampValue = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};