// Maps API Configuration
export const MAPS_CONFIG = {
  OPENSTREETMAP: {
    TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION: '© OpenStreetMap contributors',
    MAX_ZOOM: 19,
  },
  ROUTING: {
    // Using OpenRouteService (free with registration) or OSRM (completely free)
    OSRM_URL: 'https://router.project-osrm.org/route/v1/driving/',
    OPENROUTE_URL: 'https://api.openrouteservice.org/v2/directions/driving-car',
  },
  // Fallback coordinates for Luanda, Angola
  DEFAULT_LOCATION: {
    latitude: -8.8390,
    longitude: 13.2894,
    city: 'Luanda',
    country: 'Angola'
  }
};

// Get OpenStreetMap tile configuration
export const getMapTileConfig = () => {
  return MAPS_CONFIG.OPENSTREETMAP;
};

// Get default location
export const getDefaultLocation = () => {
  return MAPS_CONFIG.DEFAULT_LOCATION;
};