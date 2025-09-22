// Multiple tile server providers to avoid being blocked
// These are all free and open alternatives to OpenStreetMap

export const tileServers = [
  // CartoDB (very reliable, no API key needed)
  {
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19,
    priority: 1
  },
  {
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19,
    priority: 2
  },
  {
    name: 'CartoDB Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19,
    priority: 1
  },
  
  // Stamen Maps (now hosted by Stadia Maps - free tier available)
  {
    name: 'Stamen Toner Lite',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}.png',
    attribution: '© Stadia Maps, © Stamen Design, © OpenMapTiles © OpenStreetMap contributors',
    subdomains: [],
    maxZoom: 20,
    priority: 2
  },
  {
    name: 'Stamen Terrain',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png',
    attribution: '© Stadia Maps, © Stamen Design, © OpenMapTiles © OpenStreetMap contributors',
    subdomains: [],
    maxZoom: 18,
    priority: 3
  },
  
  // OpenTopoMap (good for Africa)
  {
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 17,
    priority: 3
  },
  
  // CyclOSM (OpenStreetMap alternative)
  {
    name: 'CyclOSM',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, © CyclOSM',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 20,
    priority: 4
  },
  
  // Wikimedia Maps
  {
    name: 'Wikimedia',
    url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, © Wikimedia',
    subdomains: [],
    maxZoom: 18,
    priority: 4
  },
  
  // ESRI World Street Map (free tier)
  {
    name: 'ESRI World Street',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, © OpenStreetMap contributors',
    subdomains: [],
    maxZoom: 19,
    priority: 5
  },
  
  // Humanitarian OpenStreetMap Team
  {
    name: 'HOT OSM',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, Humanitarian OSM Team',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    priority: 5
  },
  
  // OpenStreetMap alternatives with different servers
  {
    name: 'OSM France',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, OSM France',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 20,
    priority: 6
  },
  {
    name: 'OSM Germany',
    url: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, OSM Germany',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 18,
    priority: 6
  },
  
  // Fallback to standard OSM (use as last resort)
  {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    priority: 10 // Lowest priority
  }
];

// Alternative geocoding services (besides Nominatim)
export const geocodingServices = [
  {
    name: 'Nominatim OSM France',
    baseUrl: 'https://nominatim.openstreetmap.fr',
    rateLimit: 1000, // ms between requests
    priority: 1
  },
  {
    name: 'Nominatim Main',
    baseUrl: 'https://nominatim.openstreetmap.org',
    rateLimit: 1500, // ms between requests
    priority: 2,
    headers: {
      'User-Agent': 'TravelApp/1.0 (contact@travel.app)'
    }
  },
  {
    name: 'LocationIQ Free',
    baseUrl: 'https://us1.locationiq.com/v1',
    apiKey: 'pk.a5c3fbf2119bfb2275b62eddbccd76b3', // Free tier key
    rateLimit: 1000,
    priority: 3
  }
];

// Alternative routing services (besides OSRM)
export const routingServices = [
  {
    name: 'OSRM Demo Server',
    baseUrl: 'https://router.project-osrm.org',
    rateLimit: 500,
    priority: 1
  },
  {
    name: 'OpenRouteService Free',
    baseUrl: 'https://api.openrouteservice.org',
    apiKey: '5b3ce3597851110001cf62488a7e4a14a9164a8d8a3c49f973c8e8ef', // Free tier key
    rateLimit: 1000,
    priority: 2
  },
  {
    name: 'GraphHopper Free',
    baseUrl: 'https://graphhopper.com/api/1',
    apiKey: '3ef8e4dc-9861-4b3e-86f1-0b3c22d8f955', // Free tier key
    rateLimit: 1000,
    priority: 3
  }
];

// Function to get random tile server (with priority weighting)
export function getRandomTileServer() {
  // Sort by priority
  const sorted = [...tileServers].sort((a, b) => a.priority - b.priority);
  
  // Get servers with highest priority (lowest number)
  const minPriority = sorted[0].priority;
  const topServers = sorted.filter(s => s.priority <= minPriority + 2);
  
  // Return random from top servers
  return topServers[Math.floor(Math.random() * topServers.length)];
}

// Function to rotate through servers
let currentServerIndex = 0;
export function getNextTileServer() {
  const sorted = [...tileServers].sort((a, b) => a.priority - b.priority);
  const server = sorted[currentServerIndex % sorted.length];
  currentServerIndex++;
  return server;
}

// Function to get best server for region (Africa/Angola)
export function getBestServerForAfrica() {
  // These servers work best for Africa
  const africaServers = [
    'CartoDB Voyager',
    'CartoDB Positron',
    'OpenTopoMap',
    'HOT OSM',
    'ESRI World Street'
  ];
  
  const server = tileServers.find(s => africaServers.includes(s.name));
  return server || getRandomTileServer();
}

// Export default best server
export default getBestServerForAfrica();