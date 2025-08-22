// API Configuration
export const API_CONFIG = {
  // Base URLs - can be overridden by environment variables
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://three-api-9fac.onrender.com/api',
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'https://three-api-9fac.onrender.com',
  
  // Timeouts
  REQUEST_TIMEOUT: 10000, // 10 seconds
  SOCKET_TIMEOUT: 10000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Location update intervals
  LOCATION_UPDATE_INTERVAL: 5000, // 5 seconds
  LOCATION_UPDATE_DISTANCE: 10, // 10 meters
  
  // Ride search configuration
  DEFAULT_SEARCH_RADIUS: 10, // 10 km
  MAX_SEARCH_TIME: 30, // 30 seconds
  
  // Development flags
  ENABLE_API_FALLBACK: true, // Continue with local data if API fails
  LOG_API_CALLS: true, // Log API calls for debugging
};

// Environment detection
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = !isProduction;

// API endpoints
export const ENDPOINTS = {
  // Driver endpoints
  DRIVERS: {
    REGISTER: '/drivers/register',
    STATUS: (id) => `/drivers/${id}/status`,
    LOCATION: (id) => `/drivers/${id}/location`,
    NEARBY: '/drivers/nearby',
    PROFILE: (id) => `/drivers/${id}`,
  },
  
  // Passenger endpoints
  PASSENGERS: {
    REGISTER: '/passengers/register',
    PROFILE: (id) => `/passengers/${id}`,
    RIDES: (id) => `/passengers/${id}/rides`,
    FAVORITES: (id) => `/passengers/${id}/favorites`,
  },
  
  // Ride endpoints
  RIDES: {
    REQUEST: '/rides/request',
    ACCEPT: (id) => `/rides/${id}/accept`,
    REJECT: (id) => `/rides/${id}/reject`,
    START: (id) => `/rides/${id}/start`,
    COMPLETE: (id) => `/rides/${id}/complete`,
    CANCEL: (id) => `/rides/${id}/cancel`,
    LOCATION: (id) => `/rides/${id}/location`,
    PENDING: '/rides/pending',
    DETAILS: (id) => `/rides/${id}`,
  },
  
  // System endpoints
  HEALTH: '/health',
  API_INFO: '/api',
};

export default API_CONFIG;