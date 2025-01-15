import { GOOGLE_MAPS_API_KEY } from '../config/googleMapsConfig';

export const searchPlaces = async (searchText, location) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        searchText
      )}&location=${location.latitude},${location.longitude}&radius=50000&language=pt-BR&components=country:ao&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    return data.predictions;
  } catch (error) {
    console.error('Erro na busca de lugares:', error);
    throw error;
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