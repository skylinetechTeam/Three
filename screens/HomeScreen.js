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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// HERE Maps API Configuration
const HERE_API_KEY = 'bMtOJnfPZwG3fyrgS24Jif6dt3MXbOoq6H4X4KqxZKY';

// OpenStreetMap fallback HTML for when HERE Maps has gray tiles
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
  const [useHereMap, setUseHereMap] = useState(true);
  const [mapProvider, setMapProvider] = useState('here'); // 'here', 'openstreet', 'native'
  const webViewRef = useRef(null);
  const mapViewRef = useRef(null);
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

  // Simplified HERE Maps HTML to fix gray tiles issue
  const hereMapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>HERE Map</title>
        <style>
            * { box-sizing: border-box; }
            body, html { 
                margin: 0; 
                padding: 0; 
                height: 100%; 
                width: 100%;
                overflow: hidden;
                background-color: #E8F4FD;
                font-family: Arial, sans-serif;
            }
            #mapContainer { 
                height: 100%; 
                width: 100%; 
                background-color: #E8F4FD;
                position: relative;
            }
            #loadingIndicator {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: #2563EB;
                z-index: 1000;
                background: rgba(255,255,255,0.9);
                padding: 20px;
                border-radius: 10px;
            }
            .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #2563EB;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div id="loadingIndicator">
            <div class="spinner"></div>
            <div>Carregando mapa...</div>
        </div>
        <div id="mapContainer"></div>
        
        <script>
            console.log('🗺️ Iniciando HERE Maps simplificado...');
            
            // Load HERE Maps scripts dynamically to ensure proper loading
            function loadScript(src) {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            
            async function loadHereScripts() {
                try {
                    await loadScript('https://js.api.here.com/v3/3.1/mapsjs-core.js');
                    await loadScript('https://js.api.here.com/v3/3.1/mapsjs-service.js');
                    await loadScript('https://js.api.here.com/v3/3.1/mapsjs-ui.js');
                    await loadScript('https://js.api.here.com/v3/3.1/mapsjs-mapevents.js');
                    
                    // Load CSS
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'https://js.api.here.com/v3/3.1/mapsjs-ui.css';
                    document.head.appendChild(link);
                    
                    console.log('✅ Scripts HERE Maps carregados');
                    initializeMap();
                } catch (error) {
                    console.error('❌ Erro ao carregar scripts HERE Maps:', error);
                    document.getElementById('loadingIndicator').innerHTML = 
                        '<div style="color: #ef4444;">Erro ao carregar scripts do mapa</div>';
                    
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'MAP_ERROR',
                        error: 'Falha ao carregar scripts HERE Maps'
                    }));
                }
            }
            
            function initializeMap() {
                try {
                    console.log('🔑 HERE API Key:', '${HERE_API_KEY}');
                    
                    // Initialize HERE Maps Platform
                    const platform = new H.service.Platform({
                        'apikey': '${HERE_API_KEY}',
                        'useHTTPS': true
                    });

                    const defaultLayers = platform.createDefaultLayers({
                        tileSize: 256,
                        ppi: window.devicePixelRatio > 1 ? 320 : 72
                    });
                    
                    console.log('🗺️ Usando raster normal map para evitar tiles cinzas');
                    
                    const map = new H.Map(
                      document.getElementById('mapContainer'),
                      defaultLayers.raster.normal.map,
                      {
                        zoom: 13,
                        center: { lat: ${location?.coords.latitude || -8.8390}, lng: ${location?.coords.longitude || 13.2894} }
                      }
                    );

                    console.log('✅ HERE Map criado com sucesso');
                    
                    // Hide loading indicator
                    document.getElementById('loadingIndicator').style.display = 'none';

                    // Enable map interaction
                    const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
                    const ui = H.ui.UI.createDefault(map, defaultLayers);
                    
                    // Handle window resize
                    window.addEventListener('resize', () => {
                        setTimeout(() => map.getViewPort().resize(), 100);
                    });

                    // Force initial resize
                    setTimeout(() => {
                        map.getViewPort().resize();
                        console.log('🔄 Resize inicial executado');
                    }, 500);

                    // Custom markers
                    let userMarker = null;
                    let destinationMarker = null;
                    let routeLine = null;

                    // Check for gray tiles and fix them
                    let tileCheckCount = 0;
                    const maxTileChecks = 3;
                    
                    function checkAndFixGrayTiles() {
                        tileCheckCount++;
                        console.log('🔍 Verificando tiles (tentativa ' + tileCheckCount + ')...');
                        
                        // Force map refresh to load tiles
                        map.getViewPort().resize();
                        
                        if (tileCheckCount < maxTileChecks) {
                            setTimeout(checkAndFixGrayTiles, 2000);
                        } else {
                            console.log('✅ Verificação de tiles concluída');
                            
                            // Notify React Native that map is ready
                            window.ReactNativeWebView?.postMessage(JSON.stringify({
                                type: 'MAP_READY',
                                success: true
                            }));
                        }
                    }
                    
                    // Start tile checking after map is created
                    setTimeout(checkAndFixGrayTiles, 1000);

                    // Add user location marker
                    function addUserLocationMarker(lat, lng) {
                        console.log('📍 Adicionando marcador do usuário:', lat, lng);
                        
                        if (userMarker) {
                            map.removeObject(userMarker);
                        }
                        
                        const userIcon = new H.map.Icon(
                            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#2563EB" stroke="#ffffff" stroke-width="3"/></svg>',
                            { size: { w: 24, h: 24 } }
                        );
                        
                        userMarker = new H.map.Marker({ lat: lat, lng: lng }, { icon: userIcon });
                        map.addObject(userMarker);
                    }

                    // Add destination marker
                    function addDestinationMarker(lat, lng, title) {
                        console.log('🎯 Adicionando marcador de destino:', lat, lng, title);
                        
                        if (destinationMarker) {
                            map.removeObject(destinationMarker);
                        }
                        
                        const destIcon = new H.map.Icon(
                            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EF4444"/></svg>',
                            { size: { w: 32, h: 32 } }
                        );
                        
                        destinationMarker = new H.map.Marker({ lat: lat, lng: lng }, { icon: destIcon });
                        destinationMarker.setData(title);
                        map.addObject(destinationMarker);
                    }

                    // Center map on location
                    function centerOnLocation(lat, lng, zoom = 15) {
                        console.log('🎯 Centralizando mapa em:', lat, lng);
                        map.setCenter({ lat: lat, lng: lng });
                        map.setZoom(zoom);
                    }

                    // Expose functions for React Native to call via injectJavaScript
                    window.__setUserLocation = function(lat, lng) {
                      console.log('🔧 __setUserLocation chamado:', lat, lng);
                      addUserLocationMarker(lat, lng);
                      centerOnLocation(lat, lng);
                    };
                    
                    window.__setDestination = function(lat, lng, title) {
                      console.log('🔧 __setDestination chamado:', lat, lng, title);
                      addDestinationMarker(lat, lng, title);
                    };
                    
                    window.__centerOnUser = function() {
                      console.log('🔧 __centerOnUser chamado');
                      if (userMarker) {
                        const userPos = userMarker.getGeometry();
                        centerOnLocation(userPos.lat, userPos.lng);
                      }
                    };
                    
                    window.__clearRoute = function() {
                      console.log('🔧 __clearRoute chamado');
                      if (destinationMarker) {
                        map.removeObject(destinationMarker);
                        destinationMarker = null;
                      }
                      if (routeLine) {
                        map.removeObject(routeLine);
                        routeLine = null;
                      }
                    };

                    // Initialize with user location if available
                    ${location ? `
                    console.log('🚀 Inicializando com localização do usuário:', ${location.coords.latitude}, ${location.coords.longitude});
                    addUserLocationMarker(${location.coords.latitude}, ${location.coords.longitude});
                    ` : `
                    console.log('📍 Localização não disponível, usando coordenadas padrão');
                    `}
                    
                    // Notify React Native that map is ready
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'MAP_READY',
                        success: true
                    }));
                    
                } catch (error) {
                    console.error('❌ Erro ao inicializar HERE Maps:', error);
                    document.getElementById('loadingIndicator').innerHTML = 
                        '<div style="color: #ef4444;">Erro ao carregar o mapa<br><small>' + error.message + '</small></div>';
                    
                    // Notify React Native about the error
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'MAP_ERROR',
                        error: error.message
                    }));
                }
            }
            
            // Start loading HERE Maps scripts
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', loadHereScripts);
            } else {
                loadHereScripts();
            }
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
    
          // Send location to Map
      if (selectedLocation.lat && selectedLocation.lng) {
        if (mapProvider === 'native') {
          // For React Native Maps, we just update the state - markers are handled in render
          console.log('🗺️ Destino selecionado para React Native Maps');
        } else {
          // For WebView maps (HERE or OpenStreetMap)
          const js = `window.__setDestination && window.__setDestination(${selectedLocation.lat}, ${selectedLocation.lng}, ${JSON.stringify(selectedLocation.name)}); true;`;
          console.log('🗺️ Injecting JavaScript:', js);
          webViewRef.current?.injectJavaScript(js);
        }
        
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
      if (mapProvider === 'native') {
        // React Native Maps
        mapViewRef.current?.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      } else {
        // WebView maps (HERE or OpenStreetMap)
        const js = `window.__centerOnUser && window.__centerOnUser(); true;`;
        webViewRef.current?.injectJavaScript(js);
      }
    }
  };

  const switchMapProvider = () => {
    const providers = ['here', 'openstreet', 'native'];
    const currentIndex = providers.indexOf(mapProvider);
    const nextProvider = providers[(currentIndex + 1) % providers.length];
    
    setMapProvider(nextProvider);
    setIsMapLoading(true);
    setMapError(null);
    console.log('🔄 Alternando para:', nextProvider);
  };

  const getMapHTML = () => {
    const lat = location?.coords.latitude || -8.8390;
    const lng = location?.coords.longitude || 13.2894;
    
    if (mapProvider === 'openstreet') {
      return openStreetMapHTML(lat, lng);
    }
    return hereMapHTML; // Default to HERE Maps
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
    if (mapProvider !== 'native') {
      const js = `window.__clearRoute && window.__clearRoute(); true;`;
      webViewRef.current?.injectJavaScript(js);
    }
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

      {/* Map Container - Multiple Providers */}
      {mapProvider === 'native' ? (
        <MapView
          ref={mapViewRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location?.coords.latitude || -8.8390,
            longitude: location?.coords.longitude || 13.2894,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          loadingEnabled={true}
          onMapReady={() => {
            console.log('✅ React Native Maps pronto');
            setIsMapLoading(false);
            setMapError(null);
          }}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Sua localização"
            />
          )}
          {selectedDestination && (
            <Marker
              coordinate={{
                latitude: selectedDestination.lat,
                longitude: selectedDestination.lng,
              }}
              title={selectedDestination.name}
              pinColor="red"
            />
          )}
        </MapView>
      ) : (
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
          // Auto-switch to next provider on error
          setTimeout(() => {
            if (mapProvider === 'here') {
              console.log('🔄 Alternando para OpenStreetMap devido a erro');
              setMapProvider('openstreet');
              setIsMapLoading(true);
              setMapError(null);
            } else if (mapProvider === 'openstreet') {
              console.log('🔄 Alternando para React Native Maps devido a erro');
              setMapProvider('native');
              setIsMapLoading(true);
              setMapError(null);
            }
          }, 2000);
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
              console.log(`✅ ${data.provider || mapProvider} pronto para uso`);
              setIsMapLoading(false);
              setMapError(null);
            } else if (data.type === 'MAP_ERROR') {
              console.error('❌ Erro no mapa:', data.error);
              setIsMapLoading(false);
              setMapError(data.error);
              
              // Auto-switch to OpenStreetMap if HERE Maps has gray tiles
              if (data.error.includes('cinza') || data.error.includes('tiles')) {
                setTimeout(() => {
                  console.log('🔄 Alternando para OpenStreetMap devido a tiles cinzas');
                  setMapProvider('openstreet');
                  setIsMapLoading(true);
                  setMapError(null);
                }, 1500);
              }
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

      {/* Map Provider Switch Button */}
      <TouchableOpacity
        style={styles.mapSwitchButton}
        onPress={switchMapProvider}
      >
        <MaterialIcons 
          name={mapProvider === 'here' ? "map" : mapProvider === 'openstreet' ? "public" : "satellite"} 
          size={18} 
          color="#ffffff" 
        />
        <Text style={styles.mapSwitchText}>
          {mapProvider === 'here' ? "HERE" : mapProvider === 'openstreet' ? "OSM" : "Google"}
        </Text>
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
  mapSwitchButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  mapSwitchText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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