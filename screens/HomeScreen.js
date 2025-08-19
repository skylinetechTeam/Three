import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { getHereApiKey, getDefaultLocation } from '../config/maps';
import { testHereMapsAPI, testMapHTML } from '../utils/testMapsAPI';

const { width, height } = Dimensions.get('window');

// HERE Maps API Configuration
const HERE_API_KEY = getHereApiKey();
const DEFAULT_LOCATION = getDefaultLocation();
const DEFAULT_LAT = DEFAULT_LOCATION.latitude;
const DEFAULT_LNG = DEFAULT_LOCATION.longitude;

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState('');
  const [selectedTaxiType, setSelectedTaxiType] = useState('Coletivo');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isSearchingDrivers, setIsSearchingDrivers] = useState(false);
  const [driverSearchTime, setDriverSearchTime] = useState(0);
  const [driversFound, setDriversFound] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const webViewRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  // Update map when location is available
  useEffect(() => {
    if (location && mapLoaded && webViewRef.current) {
      const js = `
        window.__setUserLocation(${location.coords.latitude}, ${location.coords.longitude});
      `;
      webViewRef.current.injectJavaScript(js);
    }
  }, [location, mapLoaded]);

  // HERE Maps HTML content
  const hereMapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HERE Map</title>
        <script type="text/javascript" src="https://js.api.here.com/v3/3.1/mapsjs-core.js"></script>
        <script type="text/javascript" src="https://js.api.here.com/v3/3.1/mapsjs-service.js"></script>
        <script type="text/javascript" src="https://js.api.here.com/v3/3.1/mapsjs-ui.js"></script>
        <script type="text/javascript" src="https://js.api.here.com/v3/3.1/mapsjs-mapevents.js"></script>
        <link rel="stylesheet" type="text/css" href="https://js.api.here.com/v3/3.1/mapsjs-ui.css" />
        <style>
            body, html { 
                margin: 0; 
                padding: 0; 
                height: 100%; 
                width: 100%;
                overflow: hidden;
            }
            #mapContainer { 
                height: 100%; 
                width: 100%; 
                position: relative;
            }
            #errorContainer {
                display: none;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                background: rgba(255, 255, 255, 0.9);
                padding: 20px;
                border-radius: 10px;
                z-index: 1000;
            }
        </style>
    </head>
    <body>
        <div id="mapContainer">
            <div id="errorContainer">
                <h3>Erro ao carregar o mapa</h3>
                <p>Verifique sua conexão com a internet</p>
            </div>
        </div>
        
        <script>
            let map = null;
            let platform = null;
            
            try {
                // Initialize HERE Maps
                platform = new H.service.Platform({
                    'apikey': '${HERE_API_KEY}'
                });

                const defaultLayers = platform.createDefaultLayers();
                
                map = new H.Map(
                  document.getElementById('mapContainer'),
                  defaultLayers.raster.normal.map,
                  {
                    zoom: 15,
                    center: { lat: ${location?.coords.latitude || DEFAULT_LAT}, lng: ${location?.coords.longitude || DEFAULT_LNG} },
                    pixelRatio: window.devicePixelRatio || 1,
                    engineType: H.map.render.RenderEngine.EngineType.RASTER
                  }
                );

                // Enable map interaction (pan, zoom)
                const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
                const ui = H.ui.UI.createDefault(map, defaultLayers);
                window.addEventListener('resize', () => map.getViewPort().resize());
                
                console.log('HERE Maps initialized successfully');
            } catch (error) {
                console.error('Error initializing HERE Maps:', error);
                document.getElementById('errorContainer').style.display = 'block';
            }

            // Custom markers
            let userMarker = null;
            let destinationMarker = null;
            let routeLine = null;

            // Add user location marker
            function addUserLocationMarker(lat, lng) {
                if (!map) return;
                
                if (userMarker) {
                    map.removeObject(userMarker);
                }
                
                try {
                    const userIcon = new H.map.Icon(
                        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#2563EB" stroke="#ffffff" stroke-width="3"/></svg>',
                        { size: { w: 24, h: 24 } }
                    );
                    
                    userMarker = new H.map.Marker({ lat: lat, lng: lng }, { icon: userIcon });
                    map.addObject(userMarker);
                } catch (error) {
                    console.error('Error adding user marker:', error);
                }
            }

            // Add destination marker
            function addDestinationMarker(lat, lng, title) {
                if (!map) return;
                
                if (destinationMarker) {
                    map.removeObject(destinationMarker);
                }
                
                try {
                    const destIcon = new H.map.Icon(
                        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EF4444"/></svg>',
                        { size: { w: 32, h: 32 } }
                    );
                    
                    destinationMarker = new H.map.Marker({ lat: lat, lng: lng }, { icon: destIcon });
                    destinationMarker.setData(title);
                    map.addObject(destinationMarker);
                } catch (error) {
                    console.error('Error adding destination marker:', error);
                }
            }

            // Center map on location
            function centerOnLocation(lat, lng, zoom = 15) {
                if (!map) return;
                
                try {
                    map.setCenter({ lat: lat, lng: lng });
                    map.setZoom(zoom);
                } catch (error) {
                    console.error('Error centering map:', error);
                }
            }

            // Expose functions for React Native to call via injectJavaScript
            window.__setUserLocation = function(lat, lng) {
              try {
                addUserLocationMarker(lat, lng);
                centerOnLocation(lat, lng);
              } catch (error) {
                console.error('Error in __setUserLocation:', error);
              }
            };
            window.__setDestination = function(lat, lng, title) {
              try {
                addDestinationMarker(lat, lng, title);
              } catch (error) {
                console.error('Error in __setDestination:', error);
              }
            };
            window.__centerOnUser = function() {
              try {
                if (userMarker && map) {
                  const userPos = userMarker.getGeometry();
                  centerOnLocation(userPos.lat, userPos.lng);
                }
              } catch (error) {
                console.error('Error in __centerOnUser:', error);
              }
            };
            window.__clearRoute = function() {
              try {
                if (destinationMarker && map) {
                  map.removeObject(destinationMarker);
                  destinationMarker = null;
                }
                if (routeLine && map) {
                  map.removeObject(routeLine);
                  routeLine = null;
                }
              } catch (error) {
                console.error('Error in __clearRoute:', error);
              }
            };

            // Initialize with user location if available
            ${location ? `
              setTimeout(() => {
                try {
                  addUserLocationMarker(${location.coords.latitude}, ${location.coords.longitude});
                  console.log('User location marker added successfully');
                } catch (error) {
                  console.error('Error adding initial user location:', error);
                }
              }, 1000);
            ` : ''}
        </script>
    </body>
    </html>
  `;

  // Search places with HERE Maps API
  const searchPlacesWithHERE = async (query) => {
    if (!query || query.length < 2) return [];
    
    console.log('🔍 Searching for:', query);
    setIsSearching(true);
    
    try {
      const userLat = location?.coords.latitude || -8.8390;
      const userLng = location?.coords.longitude || 13.2894;
      
      console.log('📍 User location:', userLat, userLng);
      console.log('🔑 HERE API Key:', HERE_API_KEY);
      
      // HERE Geocoding and Search API
      const searchUrl = `https://discover.search.hereapi.com/v1/discover?apikey=${HERE_API_KEY}&q=${encodeURIComponent(query)}&at=${userLat},${userLng}&limit=20&lang=pt-PT`;
      
      console.log('🌐 Search URL:', searchUrl);
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      console.log('📡 HERE API response:', data);
      
      if (data.items && data.items.length > 0) {
        const formattedPlaces = data.items.map((item, index) => ({
          id: `here_${index}`,
          name: item.title,
          address: item.address.label,
          lat: item.position.lat,
          lng: item.position.lng,
          distance: item.distance,
          categories: item.categories || []
        }));
        
        console.log('✅ Formatted places:', formattedPlaces);
        setFilteredResults(formattedPlaces);
      } else {
        console.log('❌ No items in response');
        setFilteredResults([]);
      }
    } catch (error) {
      console.error('❌ HERE Places search error:', error);
      Alert.alert('Erro', 'Não foi possível buscar locais. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (selectedLocation) => {
    console.log('🎯 Location selected:', selectedLocation);
    setDestination(selectedLocation.name);
    setSelectedDestination(selectedLocation);
    setIsSearchExpanded(false);
    
          // Send location to HERE Map
      if (selectedLocation.lat && selectedLocation.lng) {
        const js = `window.__setDestination(${selectedLocation.lat}, ${selectedLocation.lng}, ${JSON.stringify(selectedLocation.name)}); true;`;
        console.log('🗺️ Injecting JavaScript:', js);
        webViewRef.current?.injectJavaScript(js);
        
        // Iniciar busca de motoristas
        console.log('🚗 Iniciando busca de motoristas...');
        setIsSearchingDrivers(true);
        setDriverSearchTime(0);
        setDriversFound(false);
        
        // Simular busca de motoristas por 10 segundos
        const driverSearchInterval = setInterval(() => {
          setDriverSearchTime(prev => {
            const newTime = prev + 1;
            console.log('⏱️ Tempo de busca:', newTime, 'segundos');
            
                       if (newTime >= 10) {
             clearInterval(driverSearchInterval);
             setIsSearchingDrivers(false);
             setDriversFound(false);
             console.log('❌ Motoristas não encontrados após 10 segundos');
             return 10; // Manter em 10 para mostrar a modal
           }
            return newTime;
          });
        }, 1000);
      }
  };

  const centerOnUserLocation = () => {
    if (location) {
      const js = `window.__centerOnUser(); true;`;
      webViewRef.current?.injectJavaScript(js);
    }
  };

  const handleSearchFocus = () => {
    setIsSearchExpanded(true);
    setFilteredResults([]);
  };

  const handleSearchChange = async (text) => {
    console.log('📝 handleSearchChange called with:', text);
    setDestination(text);
    
    if (text.length < 2) {
      console.log('📏 Text too short, clearing results');
      setFilteredResults([]);
      return;
    }
    
    console.log('🚀 Starting search for:', text);
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      console.log('⚡ Executing search for:', text);
      searchPlacesWithHERE(text);
    }, 500);
  };

  const handleNewSearch = () => {
    setDestination('');
    setSelectedDestination(null);
    setIsSearchingDrivers(false);
    setDriverSearchTime(0);
    setDriversFound(false);
    
    // Clear route on map
    const js = `window.__clearRoute(); true;`;
    webViewRef.current?.injectJavaScript(js);
  };

  const getIconForCategory = (categories) => {
    if (!categories || categories.length === 0) return 'place';
    
    const categoryId = categories[0].id;
    
    const categoryIcons = {
      'airport': 'flight',
      'bus-station': 'directions-bus',
      'railway-station': 'train',
      'taxi-stand': 'local-taxi',
      'hotel': 'hotel',
      'restaurant': 'restaurant',
      'fast-food': 'fastfood',
      'cafe': 'local-cafe',
      'shopping-mall': 'shopping-cart',
      'department-store': 'store',
      'hospital': 'local-hospital',
      'school': 'school',
      'cinema': 'movie',
      'bank': 'account-balance',
      'church': 'church',
    };
    
    return categoryIcons[categoryId] || 'place';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* HERE Map WebView */}
      {!mapError ? (
        <WebView
          ref={webViewRef}
          source={{ html: hereMapHTML }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="compatibility"
          onLoad={() => {
            setMapLoaded(true);
            console.log('🗺️ WebView loaded successfully');
          }}
          onError={(error) => {
            setMapError(true);
            console.error('❌ WebView error:', error);
          }}
          onHttpError={(error) => {
            setMapError(true);
            console.error('🌐 WebView HTTP error:', error);
          }}
        />
      ) : (
        <View style={styles.mapFallback}>
          <MaterialIcons name="map" size={64} color="#6B7280" />
          <Text style={styles.mapFallbackTitle}>Mapa não disponível</Text>
          <Text style={styles.mapFallbackSubtitle}>
            Não foi possível carregar o mapa. Verifique sua conexão com a internet.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setMapError(false);
              setMapLoaded(false);
            }}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Indicator */}
      {!mapLoaded && !mapError && (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.mapLoadingText}>Carregando mapa...</Text>
        </View>
      )}

      {/* Debug Info (only in development) */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>Map Loaded: {mapLoaded ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>Map Error: {mapError ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>Location: {location ? 'Available' : 'Not Available'}</Text>
          <Text style={styles.debugText}>API Key: {HERE_API_KEY ? 'Set' : 'Not Set'}</Text>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={async () => {
              console.log('🧪 Testing HERE Maps API...');
              const result = await testHereMapsAPI();
              Alert.alert('Test Result', result.success ? 'API is working!' : 'API failed: ' + result.error);
            }}
          >
            <Text style={styles.testButtonText}>Test API</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Location Button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={centerOnUserLocation}
      >
        <MaterialIcons name="my-location" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Search and Taxi Controls OR Driver Search Animation */}
      {console.log('🔍 Render condition - isSearchingDrivers:', isSearchingDrivers, 'driversFound:', driversFound)}
      {!isSearchingDrivers ? (
        <View style={styles.bottomContainer}>
          {/* Search Input */}
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={handleSearchFocus}
            activeOpacity={0.8}
          >
            <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Para onde você quer ir?"
              placeholderTextColor="#9CA3AF"
              value={destination}
              onChangeText={setDestination}
              onFocus={handleSearchFocus}
              editable={!isSearchExpanded}
            />
          </TouchableOpacity>

          {/* Taxi Type Selection */}
          <View style={styles.taxiButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.taxiButton,
                selectedTaxiType === 'Coletivo' && styles.taxiButtonSelected
              ]}
              onPress={() => setSelectedTaxiType('Coletivo')}
            >
              <Text style={[
                styles.taxiButtonText,
                selectedTaxiType === 'Coletivo' && styles.taxiButtonTextSelected
              ]}>
                Coletivo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taxiButton,
                selectedTaxiType === 'Privado' && styles.taxiButtonSelected
              ]}
              onPress={() => setSelectedTaxiType('Privado')}
            >
              <Text style={[
                styles.taxiButtonText,
                selectedTaxiType === 'Privado' && styles.taxiButtonTextSelected
              ]}>
                Privado
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Driver Search Animation */}
      {isSearchingDrivers && (
        <View style={styles.driverSearchCard}>
          <View style={styles.searchingAnimation}>
            <View style={styles.spinnerContainer}>
              <View style={styles.spinner} />
            </View>
            <Text style={styles.searchingTitle}>Procurando motoristas...</Text>
            <Text style={styles.searchingSubtitle}>
              Tempo de busca: {driverSearchTime}/10 segundos
            </Text>
            <View style={styles.searchingDots}>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.dot}>•</Text>
            </View>
          </View>
        </View>
      )}

      {/* Drivers Not Found */}
      {!driversFound && !isSearchingDrivers && driverSearchTime >= 10 && (
        <View style={styles.driversNotFoundCard}>
          <View style={styles.notFoundContent}>
            <MaterialIcons name="cancel" size={48} color="#EF4444" />
            <Text style={styles.notFoundTitle}>Nenhum motorista encontrado</Text>
            <Text style={styles.notFoundSubtitle}>
              Após 10 segundos de busca, não foi possível encontrar motoristas disponíveis na sua área
            </Text>
            <TouchableOpacity style={styles.tryAgainButton} onPress={handleNewSearch}>
              <Text style={styles.tryAgainButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Full Screen Search Overlay */}
      {isSearchExpanded && (
        <View style={styles.searchOverlay}>
          {/* Header with Search */}
          <View style={styles.searchHeader}>
            <TouchableOpacity
              onPress={() => setIsSearchExpanded(false)}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>

            <View style={styles.searchBarContainer}>
              <MaterialIcons name="search" size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Para onde você quer ir?"
                placeholderTextColor="#9CA3AF"
                value={destination}
                onChangeText={handleSearchChange}
                autoFocus={true}
              />
              {destination.length > 0 && (
                <TouchableOpacity onPress={() => setDestination('')}>
                  <MaterialIcons name="clear" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Current Location */}
          <TouchableOpacity 
            style={styles.currentLocationItem}
            onPress={() => {
              if (location) {
                handleLocationSelect({
                  name: "Localização atual",
                  address: "Minha localização",
                  lat: location.coords.latitude,
                  lng: location.coords.longitude
                });
              }
            }}
          >
            <View style={styles.currentLocationIcon}>
              <MaterialIcons name="my-location" size={20} color="#2563EB" />
            </View>
            <View style={styles.currentLocationInfo}>
              <Text style={styles.currentLocationText}>Usar localização atual</Text>
              <Text style={styles.currentLocationSubtext}>Sua posição no mapa</Text>
            </View>
          </TouchableOpacity>

          {/* Search Results */}
          <View style={styles.searchResultsSection}>
            <Text style={styles.sectionTitle}>
              {isSearching ? 'Buscando...' : 
               filteredResults.length > 0 ? `Resultados da busca (${filteredResults.length})` : 
               'Digite para buscar locais'}
            </Text>

            {isSearching && (
              <View style={styles.searchingIndicator}>
                <MaterialIcons name="search" size={20} color="#2563EB" />
                <Text style={styles.searchingText}>Buscando com HERE Maps...</Text>
              </View>
            )}

            {filteredResults.length > 0 ? (
              <ScrollView
                style={styles.resultsList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {filteredResults.map((result, index) => (
                  <TouchableOpacity
                    key={result.id || `result_${index}`}
                    style={styles.resultItem}
                    onPress={() => handleLocationSelect(result)}
                  >
                    <View style={styles.resultIcon}>
                      <MaterialIcons 
                        name={getIconForCategory(result.categories)} 
                        size={18} 
                        color="#6B7280" 
                      />
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{result.name}</Text>
                      <Text style={styles.resultAddress}>
                        {result.address}
                        {result.distance && ` • ${Math.round(result.distance/1000)}km`}
                      </Text>
                    </View>
                    <View style={styles.hereMapsBadge}>
                      <Text style={styles.hereMapsBadgeText}>HERE</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : destination.length > 0 && !isSearching ? (
              <View style={styles.noResultsContainer}>
                <MaterialIcons name="search-off" size={32} color="#D1D5DB" />
                <Text style={styles.noResultsText}>Nenhum resultado encontrado</Text>
                <Text style={styles.noResultsSubtext}>Tente buscar por outro local</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },
  mapFallbackTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  mapFallbackSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  mapLoadingText: {
    fontSize: 16,
    color: '#2563EB',
    marginTop: 12,
    fontWeight: '500',
  },
  debugInfo: {
    position: 'absolute',
    top: 100,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1001,
  },
  debugText: {
    color: '#ffffff',
    fontSize: 12,
    marginBottom: 2,
  },
  testButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  locationButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2563EB',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  taxiButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  taxiButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  taxiButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  taxiButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  taxiButtonTextSelected: {
    color: '#ffffff',
  },
  // Driver Search Animation Styles
  driverSearchCard: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  searchingAnimation: {
    alignItems: 'center',
  },
  spinnerContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#E5E7EB',
    borderTopColor: '#10B981',
    transform: [{ rotate: '0deg' }],
  },
  searchingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  searchingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    fontSize: 24,
    color: '#10B981',
    marginHorizontal: 4,
    opacity: 0.6,
  },
  // Drivers Not Found Styles
  driversNotFoundCard: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  notFoundContent: {
    alignItems: 'center',
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  tryAgainButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Search Overlay Styles
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    zIndex: 1000,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currentLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currentLocationInfo: {
    flex: 1,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  currentLocationSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchResultsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  searchingText: {
    fontSize: 16,
    color: '#2563EB',
    marginLeft: 8,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  hereMapsBadge: {
    backgroundColor: '#00D4AA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hereMapsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});