import { GOOGLE_MAPS_API_KEY } from '../config/googleMapsConfig';

export const searchPlaces = async (searchText, location) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      searchText
    )}&location=${location.latitude},${location.longitude}&radius=50000&language=pt-BR&components=country:ao&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log('Fazendo requisição para:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Resposta da API:', data);
    
    if (data.status === 'OK') {
      return data.predictions;
    } else {
      console.error('Erro na resposta da API:', data.status);
      return [];
    }
  } catch (error) {
    console.error('Erro na busca de lugares:', error);
    return [];
  }
};

export const getPlaceDetails = async (placeId) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Erro ao obter detalhes do lugar:', error);
    throw error;
  }
};