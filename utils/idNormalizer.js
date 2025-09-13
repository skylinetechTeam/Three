/**
 * Utilitário para normalização consistente de IDs em todo o sistema
 * Garante que todos os IDs sejam tratados como strings para evitar problemas de comparação
 */

/**
 * Normaliza um ID para string
 * @param {*} id - ID a ser normalizado (pode ser string, número, etc)
 * @returns {string|null} - ID normalizado como string ou null se inválido
 */
export const normalizeId = (id) => {
  if (id === null || id === undefined) {
    return null;
  }
  
  // Converter para string e remover espaços
  const normalizedId = String(id).trim();
  
  // Retornar null se for string vazia
  if (normalizedId === '') {
    return null;
  }
  
  return normalizedId;
};

/**
 * Normaliza múltiplos IDs de um objeto
 * @param {Object} obj - Objeto contendo IDs
 * @param {Array<string>} idFields - Lista de campos que são IDs
 * @returns {Object} - Objeto com IDs normalizados
 */
export const normalizeObjectIds = (obj, idFields = ['id', 'userId', 'passengerId', 'driverId']) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const normalized = { ...obj };
  
  idFields.forEach(field => {
    if (field in normalized) {
      normalized[field] = normalizeId(normalized[field]);
    }
  });
  
  return normalized;
};

/**
 * Compara dois IDs normalizados
 * @param {*} id1 - Primeiro ID
 * @param {*} id2 - Segundo ID
 * @returns {boolean} - True se os IDs são iguais
 */
export const compareIds = (id1, id2) => {
  const normalized1 = normalizeId(id1);
  const normalized2 = normalizeId(id2);
  
  // Ambos null são considerados iguais
  if (normalized1 === null && normalized2 === null) {
    return true;
  }
  
  // Um null e outro não são diferentes
  if (normalized1 === null || normalized2 === null) {
    return false;
  }
  
  return normalized1 === normalized2;
};

/**
 * Valida se um ID é válido (não null, não vazio)
 * @param {*} id - ID a ser validado
 * @returns {boolean} - True se o ID é válido
 */
export const isValidId = (id) => {
  const normalized = normalizeId(id);
  return normalized !== null && normalized !== '';
};

// Exportar também como default
export default {
  normalizeId,
  normalizeObjectIds,
  compareIds,
  isValidId
};