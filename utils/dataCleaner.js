import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves que podem conter dados de favoritos e reservas
const DATA_KEYS = {
  FAVORITES: 'favorite_destinations',
  RESERVAS: 'ride_requests',
  TRIP_HISTORY: 'trip_history',
  SEARCH_HISTORY: 'search_history',
  ROUTES_CACHE: 'routes_cache',
  NOTIFICATIONS: 'notifications',
  USER_PROFILE: 'user_profile',
  APP_SETTINGS: 'app_settings'
};

/**
 * Limpa todos os dados do usuário (favoritos, reservas, histórico, etc.)
 */
export const clearAllUserData = async () => {
  try {
    const keysToRemove = Object.values(DATA_KEYS);
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('Todos os dados do usuário foram limpos');
    return true;
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    return false;
  }
};

/**
 * Limpa apenas dados de favoritos e reservas
 */
export const clearFavoritesAndReservas = async () => {
  try {
    const keysToRemove = [DATA_KEYS.FAVORITES, DATA_KEYS.RESERVAS];
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('Favoritos e reservas foram limpos');
    return true;
  } catch (error) {
    console.error('Erro ao limpar favoritos e reservas:', error);
    return false;
  }
};

/**
 * Lista todas as chaves e valores armazenados no AsyncStorage
 */
export const listAllStoredData = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const allData = {};
    
    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          allData[key] = JSON.parse(value);
        } catch {
          allData[key] = value;
        }
      }
    }
    
    console.log('Dados armazenados no AsyncStorage:', allData);
    return allData;
  } catch (error) {
    console.error('Erro ao listar dados:', error);
    return {};
  }
};

/**
 * Verifica se existem dados de favoritos ou reservas
 */
export const checkForExistingData = async () => {
  try {
    const favorites = await AsyncStorage.getItem(DATA_KEYS.FAVORITES);
    const reservas = await AsyncStorage.getItem(DATA_KEYS.RESERVAS);
    
    const result = {
      hasFavorites: false,
      hasReservas: false,
      favoritesCount: 0,
      reservasCount: 0,
      favoritesData: null,
      reservasData: null
    };
    
    if (favorites) {
      const parsed = JSON.parse(favorites);
      result.hasFavorites = Array.isArray(parsed) && parsed.length > 0;
      result.favoritesCount = Array.isArray(parsed) ? parsed.length : 0;
      result.favoritesData = parsed;
    }
    
    if (reservas) {
      const parsed = JSON.parse(reservas);
      result.hasReservas = Array.isArray(parsed) && parsed.length > 0;
      result.reservasCount = Array.isArray(parsed) ? parsed.length : 0;
      result.reservasData = parsed;
    }
    
    console.log('Verificação de dados existentes:', result);
    return result;
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
    return {
      hasFavorites: false,
      hasReservas: false,
      favoritesCount: 0,
      reservasCount: 0,
      favoritesData: null,
      reservasData: null
    };
  }
};

/**
 * Limpa dados específicos por chave
 */
export const clearDataByKey = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`Dados da chave '${key}' foram limpos`);
    return true;
  } catch (error) {
    console.error(`Erro ao limpar dados da chave '${key}':`, error);
    return false;
  }
};

export { DATA_KEYS };

export default {
  clearAllUserData,
  clearFavoritesAndReservas,
  listAllStoredData,
  checkForExistingData,
  clearDataByKey,
  DATA_KEYS
};
