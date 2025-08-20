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
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
// Removed MapView import - only using WebView for OpenStreetMap

const { width, height } = Dimensions.get('window');

// Removed HERE Maps API Configuration - only using OpenStreetMap

// OpenStreetMap HTML
const openStreetMapHTML = (lat, lng) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mapa</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body, html { margin: 0; padding: 0; height: 100%; }
        #map { height: 100%; width: 100%; }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            background: rgba(255,255,255,0.9);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            color: #2563EB;
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">
        <div>Carregando mapa...</div>
    </div>
    <div id="map"></div>
    
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        console.log('🗺️ Iniciando OpenStreetMap...');
        
        // Initialize map
        const map = L.map('map').setView([${lat}, ${lng}], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
        
        console.log('✅ OpenStreetMap carregado com sucesso');
        
        // Add user marker
        let userMarker = L.marker([${lat}, ${lng}])
            .addTo(map)
            .bindPopup('Sua localização');
        
        // Expose functions for React Native
        window.__setUserLocation = function(lat, lng) {
            if (userMarker) {
                map.removeLayer(userMarker);
            }
            userMarker = L.marker([lat, lng]).addTo(map).bindPopup('Sua localização');
            map.setView([lat, lng], 13);
        };
        
        window.__setDestination = function(lat, lng, title) {
            if (window.destinationMarker) {
                map.removeLayer(window.destinationMarker);
            }
            window.destinationMarker = L.marker([lat, lng]).addTo(map).bindPopup(title);
        };
        
        window.__centerOnUser = function() {
            if (userMarker) {
                map.setView(userMarker.getLatLng(), 13);
            }
        };
        
        window.__clearRoute = function() {
            if (window.destinationMarker) {
                map.removeLayer(window.destinationMarker);
                window.destinationMarker = null;
            }
        };
        
        // Notify React Native
        window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'MAP_READY',
            success: true,
            provider: 'OpenStreetMap'
        }));
    </script>
</body>
</html>
`;

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
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  // Removed useHereMap state - only using OpenStreetMap
  const [mapProvider, setMapProvider] = useState('openstreet'); // Only OpenStreetMap
  const webViewRef = useRef(null);
  // Removed mapViewRef - only using WebView for OpenStreetMap
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        Alert.alert(
          'Permissão de Localização',
          'Para usar o mapa, precisamos acessar sua localização. Por favor, permita o acesso nas configurações.',
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 10000,
          maximumAge: 60000,
        });
        console.log('📍 Localização obtida:', location);
        setLocation(location);
      } catch (error) {
        console.error('❌ Erro ao obter localização:', error);
        Alert.alert(
          'Erro de Localização',
          'Não foi possível obter sua localização. Verifique se o GPS está ativado.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  // Effect to update map when location changes
  useEffect(() => {
    if (location && webViewRef.current) {
      console.log('🔄 Atualizando localização no mapa:', location.coords);
      const js = `
        if (window.__setUserLocation) {
          window.__setUserLocation(${location.coords.latitude}, ${location.coords.longitude});
        } else {
          console.log('⚠️ Função __setUserLocation não está disponível ainda');
        }
        true;
      `;
      // Add a delay to ensure WebView is fully loaded
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(js);
      }, 2000);
    }
  }, [location]);

  // Removed HERE Maps HTML - only using OpenStreetMap

  // Removed HERE Maps search - only using Nominatim

  const handleLocationSelect = (selectedLocation) => {
    console.log('🎯 Location selected:', selectedLocation);
    setDestination(selectedLocation.name);
    setSelectedDestination(selectedLocation);
    setIsSearchExpanded(false);
    
    // Send location to Map
    if (selectedLocation.lat && selectedLocation.lng) {
      // For WebView maps (OpenStreetMap)
      const js = `window.__setDestination && window.__setDestination(${selectedLocation.lat}, ${selectedLocation.lng}, ${JSON.stringify(selectedLocation.name)}); true;`;
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
      // WebView maps (OpenStreetMap)
      const js = `window.__centerOnUser && window.__centerOnUser(); true;`;
      webViewRef.current?.injectJavaScript(js);
    }
  };

  // Removed switchMapProvider function - only using OpenStreetMap

  const getMapHTML = () => {
    const lat = location?.coords.latitude || -8.8390;
    const lng = location?.coords.longitude || 13.2894;
    
    return openStreetMapHTML(lat, lng); // Only OpenStreetMap
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
      searchPlacesWithNominatim(text);
    }, 500);
  };

  // Search function using OpenStreetMap Nominatim API
  const searchPlacesWithNominatim = async (query) => {
    if (!query || query.length < 2) return [];
    
    console.log('🔍 Searching with Nominatim for:', query);
    setIsSearching(true);
    
    try {
      const userLat = location?.coords.latitude || -8.8390;
      const userLng = location?.coords.longitude || 13.2894;
      
      // OpenStreetMap Nominatim API (free, no API key required)
      const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1&viewbox=${userLng-0.1},${userLat+0.1},${userLng+0.1},${userLat-0.1}&bounded=1`;
      
      console.log('🌐 Nominatim Search URL:', searchUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TravelApp/1.0',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('📡 Nominatim API response:', data);
      
      if (data && data.length > 0) {
        const formattedPlaces = data.map((item, index) => ({
          id: `nominatim_${index}`,
          name: item.display_name.split(',')[0] || item.display_name,
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          distance: 0, // Nominatim doesn't provide distance
          categories: []
        }));
        
        console.log('✅ Nominatim formatted places:', formattedPlaces);
        setFilteredResults(formattedPlaces);
      } else {
        console.log('❌ No Nominatim results');
        setFilteredResults([]);
      }
    } catch (error) {
      console.error('❌ Nominatim search error:', error);
      console.log('⚠️ Falling back to mock results');
      
      // Provide mock results as final fallback
      const mockResults = [
        {
          id: 'mock_1',
          name: 'Centro Comercial Belas Shopping',
          address: 'Luanda, Angola',
          lat: -8.8390,
          lng: 13.2894,
          distance: 1000,
          categories: [{ id: 'shopping-mall' }]
        },
        {
          id: 'mock_2',
          name: 'Aeroporto Internacional 4 de Fevereiro',
          address: 'Luanda, Angola',
          lat: -8.8584,
          lng: 13.2312,
          distance: 5000,
          categories: [{ id: 'airport' }]
        },
        {
          id: 'mock_3',
          name: 'Restaurante Popular',
          address: 'Luanda, Angola',
          lat: -8.8300,
          lng: 13.2800,
          distance: 2000,
          categories: [{ id: 'restaurant' }]
        }
      ];
      
      setFilteredResults(mockResults);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNewSearch = () => {
    setDestination('');
    setSelectedDestination(null);
    setIsSearchingDrivers(false);
    setDriverSearchTime(0);
    setDriversFound(false);
    
    // Clear route on map
    const js = `window.__clearRoute && window.__clearRoute(); true;`;
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
    <View style={styles.container}>
      {console.log('🏠 HomeScreen render - States:', { isSearchingDrivers, selectedDestination: !!selectedDestination, driverSearchTime, driversFound })}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Map Container - OpenStreetMap Only */}
      <WebView
        ref={webViewRef}
        source={{ html: getMapHTML() }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        allowsBackForwardNavigationGestures={false}
        onLoad={() => {
          console.log('🗺️ WebView carregado com sucesso');
          setMapError(null);
          // Inject user location if available
          if (location) {
            setTimeout(() => {
              const js = `window.__setUserLocation && window.__setUserLocation(${location.coords.latitude}, ${location.coords.longitude}); true;`;
              webViewRef.current?.injectJavaScript(js);
            }, 1000);
          }
        }}
        onLoadStart={() => {
          console.log('🔄 WebView iniciando carregamento...');
          setIsMapLoading(true);
          setMapError(null);
        }}
        onLoadEnd={() => {
          console.log('✅ WebView carregamento finalizado');
          // Keep loading state until we get MAP_READY message
        }}
        onError={(error) => {
          console.error('❌ WebView error:', error);
          setIsMapLoading(false);
          setMapError('Erro ao carregar o mapa');
        }}
        onHttpError={(error) => {
          console.error('🌐 WebView HTTP error:', error);
          setIsMapLoading(false);
          setMapError('Erro de conexão');
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('📨 Mensagem do mapa:', data);
            
            if (data.type === 'MAP_READY') {
              console.log(`✅ OpenStreetMap pronto para uso`);
              setIsMapLoading(false);
              setMapError(null);
            } else if (data.type === 'MAP_ERROR') {
              console.error('❌ Erro no mapa:', data.error);
              setIsMapLoading(false);
              setMapError(data.error);
            }
          } catch (error) {
            console.log('📨 Mensagem do mapa (não JSON):', event.nativeEvent.data);
          }
        }}
      />

      {/* Map Loading Overlay */}
      {isMapLoading && (
        <View style={styles.mapLoadingOverlay}>
          <View style={styles.mapLoadingContainer}>
            <View style={styles.mapLoadingSpinner} />
            <Text style={styles.mapLoadingText}>Carregando mapa...</Text>
          </View>
        </View>
      )}

      {/* Map Error Overlay */}
      {mapError && !isMapLoading && (
        <View style={styles.mapErrorOverlay}>
          <View style={styles.mapErrorContainer}>
            <MaterialIcons name="error" size={48} color="#EF4444" />
            <Text style={styles.mapErrorTitle}>Erro no Mapa</Text>
            <Text style={styles.mapErrorText}>{mapError}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setMapError(null);
                setIsMapLoading(true);
                // Force WebView reload by updating the key
                webViewRef.current?.reload();
              }}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Location Button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={centerOnUserLocation}
      >
        <MaterialIcons name="my-location" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Removed Map Provider Switch Button - Only OpenStreetMap */}

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
                 <Text style={styles.searchingText}>Buscando locais...</Text>
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
                       <Text style={styles.hereMapsBadgeText}>OSM</Text>
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
    </View>
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
  // Removed mapSwitchButton styles - only using OpenStreetMap
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
  // Map Loading Overlay Styles
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  mapLoadingContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mapLoadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#E5E7EB',
    borderTopColor: '#2563EB',
    marginBottom: 16,
  },
  mapLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Map Error Overlay Styles
  mapErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  mapErrorContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mapErrorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  mapErrorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});