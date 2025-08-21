// Maps API Configuration
export const MAPS_CONFIG = {
  HERE: {
    API_KEY: 'bMtOJnfPZwG3fyrgS24Jif6dt3MXbOoq6H4X4KqxZKY',
    // Alternative API key if the first one doesn't work
    ALTERNATIVE_API_KEY: 'YOUR_ALTERNATIVE_HERE_API_KEY',
    BASE_URL: 'https://js.api.here.com/v3/3.1/',
    SEARCH_URL: 'https://discover.search.hereapi.com/v1/discover',
  },
  GOOGLE: {
    API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
    BASE_URL: 'https://maps.googleapis.com/maps/api/',
  },
  // Fallback coordinates for Luanda, Angola
  DEFAULT_LOCATION: {
    latitude: -8.8390,
    longitude: 13.2894,
    city: 'Luanda',
    country: 'Angola'
  }
};

// Check if we should use alternative API key
export const getHereApiKey = () => {
  return MAPS_CONFIG.HERE.API_KEY;
};

// Get default location
export const getDefaultLocation = () => {
  return MAPS_CONFIG.DEFAULT_LOCATION;
};