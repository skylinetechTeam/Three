export const searchPlaces = async (searchText, location) => {
  try {
    // Restringe a busca a Angola usando o parâmetro countrycodes=ao
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=ao&q=${encodeURIComponent(
      searchText
    )}&limit=5`;
    
    console.log('Fazendo requisição para:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'travel_app/1.0 (seu-email@dominio.com)',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // Mapeia os resultados incluindo as coordenadas
    const results = data.map(item => ({
      place_id: item.place_id,
      structured_formatting: {
        main_text: item.display_name,
        secondary_text: item.address && (
          item.address.city ||
          item.address.town ||
          item.address.village ||
          item.address.country
        ) || ""
      },
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon)
    }));
    
    return results;
  } catch (error) {
    console.error('Erro na busca de lugares:', error);
    return [];
  }
};


export const getPlaceDetails = async (placeId) => {
  try {
    const url = `https://nominatim.openstreetmap.org/lookup?format=json&place_ids=${placeId}`;
    console.log('Fazendo requisição de detalhes para:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'travel_app/1.0 (seu-email@dominio.com)', // substitua pelo identificador da sua app
        'Accept': 'application/json'
      }
    });
    
    // Tenta obter o JSON da resposta
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        geometry: {
          location: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
          }
        },
        formatted_address: result.display_name,
        name: result.display_name.split(',')[0]
      };
    }
    return {};
  } catch (error) {
    console.error('Erro ao obter detalhes do lugar:', error);
    throw error;
  }
};