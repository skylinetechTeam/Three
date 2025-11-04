// Cache para armazenar resultados de buscas recentes
const searchCache = {};

// Cache desabilitado - sempre buscar preço atualizado
const CACHE_EXPIRATION = 0;

// Variável para controlar o debounce
let searchDebounceTimer = null;

// Termos de busca comuns para pré-carregar
const commonSearchTerms = [
  'aeroporto',
  'hospital',
  'shopping',
  'hotel',
  'restaurante',
  'banco',
  'farmácia',
  'supermercado',
  'escola',
  'universidade'
];

/**
 * Pré-carrega resultados de busca para termos comuns
 * @param {object} location - Localização atual do usuário
 */
export const preloadCommonSearches = async (location) => {
  // Verificar se já temos cache para estes termos
  const termsToLoad = commonSearchTerms.filter(term => !searchCache[term]);
  
  if (termsToLoad.length === 0) return;
  
  console.log(`Pré-carregando ${termsToLoad.length} termos comuns...`);
  
  // Carregar em segundo plano, um por um para não sobrecarregar a API
  setTimeout(async () => {
    for (const term of termsToLoad) {
      try {
        await searchPlaces(term, location);
        // Pequena pausa entre requisições para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Erro ao pré-carregar termo '${term}':`, error);
      }
    }
    console.log('Pré-carregamento concluído');
  }, 5000); // Iniciar após 5 segundos para não interferir com a inicialização do app
};

/**
 * Busca lugares usando a API Nominatim do OpenStreetMap
 * @param {string} searchText - Texto da busca
 * @param {object} location - Localização atual do usuário
 * @returns {Promise<Array>} - Lista de lugares encontrados
 */
export const searchPlaces = async (searchText, location) => {
  // Cancela qualquer busca pendente
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  
  // Retorna uma promessa que será resolvida após o debounce
  return new Promise((resolve) => {
    searchDebounceTimer = setTimeout(async () => {
      try {
        const searchTerm = searchText.trim().toLowerCase();
        
        // Cache desabilitado - sempre buscar dados atualizados
        // if (searchCache[searchTerm] && 
        //     (Date.now() - searchCache[searchTerm].timestamp) < CACHE_EXPIRATION) {
        //   console.log('Usando resultados em cache para:', searchTerm);
        //   return resolve(searchCache[searchTerm].results);
        // }
        
        // Verificar se o termo é muito curto ou genérico
        if (searchTerm.length < 3 || 
            ['rua', 'avenida', 'av', 'r', 'estrada', 'caminho'].includes(searchTerm)) {
          console.log('Termo muito genérico, retornando lista vazia');
          return resolve([]);
        }
        
        // Se o usuário tem localização, podemos priorizar resultados próximos
        let viewbox = '';
        let bounded = '';
        if (location && location.coords) {
          // Cria uma caixa de visualização de aproximadamente 100km ao redor da localização do usuário
          const lat = location.coords.latitude;
          const lon = location.coords.longitude;
          const offset = 0.5; // Aproximadamente 50km em graus
          viewbox = `&viewbox=${lon-offset},${lat-offset},${lon+offset},${lat+offset}`;
          bounded = '&bounded=1'; // Prioriza resultados dentro da viewbox
        }
        
        // Busca global sem restrição de país
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          searchText
        )}&limit=10${viewbox}${bounded}`;
        
        console.log('Fazendo requisição para:', url);
        
        // Adicionar timeout para evitar esperas muito longas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'travel_app/1.0 (seu-email@dominio.com)',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        // Mapeia os resultados incluindo as coordenadas e mais informações
        const results = data.map(item => ({
          place_id: item.place_id,
          structured_formatting: {
            main_text: item.display_name,
            secondary_text: item.address && (
              item.address.city ||
              item.address.town ||
              item.address.village ||
              item.address.county ||
              item.address.state ||
              item.address.country
            ) || ""
          },
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          country: item.address?.country || "",
          region: item.address?.state || item.address?.county || ""
        }));
        
        // Armazena os resultados em cache
        searchCache[searchTerm] = {
          results: results,
          timestamp: Date.now()
        };
        
        // Limpa o cache se ficar muito grande (mais de 20 termos)
        const cacheKeys = Object.keys(searchCache);
        if (cacheKeys.length > 20) {
          // Remove o item mais antigo do cache
          let oldestKey = cacheKeys[0];
          let oldestTime = searchCache[oldestKey].timestamp;
          
          cacheKeys.forEach(key => {
            if (searchCache[key].timestamp < oldestTime) {
              oldestKey = key;
              oldestTime = searchCache[key].timestamp;
            }
          });
          
          delete searchCache[oldestKey];
        }
        
        resolve(results);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('Timeout na busca de lugares');
          // Verificar se temos resultados em cache, mesmo que expirados
          const cacheKeys = Object.keys(searchCache);
          for (const key of cacheKeys) {
            if (key.includes(searchTerm) || searchTerm.includes(key)) {
              console.log('Usando cache expirado como fallback para:', searchTerm);
              return resolve(searchCache[key].results);
            }
          }
        } else {
          console.error('Erro na busca de lugares:', error);
        }
        resolve([]);
      }
    }, 300); // Debounce de 300ms para evitar múltiplas requisições
  });
};


// Cache para detalhes de lugares
const detailsCache = {};

export const getPlaceDetails = async (placeId) => {
  try {
    // Cache desabilitado - sempre buscar detalhes atualizados
    // if (detailsCache[placeId] && 
    //     (Date.now() - detailsCache[placeId].timestamp) < CACHE_EXPIRATION) {
    //   console.log('Usando detalhes em cache para:', placeId);
    //   return detailsCache[placeId].details;
    // }
    
    const url = `https://nominatim.openstreetmap.org/lookup?format=json&place_ids=${placeId}`;
    console.log('Fazendo requisição de detalhes para:', url);
    
    // Adicionar timeout para evitar esperas muito longas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'travel_app/1.0 (seu-email@dominio.com)', // substitua pelo identificador da sua app
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Tenta obter o JSON da resposta
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const details = {
        geometry: {
          location: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
          }
        },
        formatted_address: result.display_name,
        name: result.display_name.split(',')[0]
      };
      
      // Armazenar no cache
      detailsCache[placeId] = {
        details: details,
        timestamp: Date.now()
      };
      
      return details;
    }
    return {};
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Timeout ao obter detalhes do lugar');
    } else {
      console.error('Erro ao obter detalhes do lugar:', error);
    }
    return {};
  }
};