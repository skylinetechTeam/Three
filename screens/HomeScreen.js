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
  Animated,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-toast-message';
import apiService from '../services/apiService';
import LocalDatabase from '../services/localDatabase';

const { width, height } = Dimensions.get('window');

// OpenStreetMap Configuration (usando Nominatim para geocoding e OSRM para roteamento)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OSRM_BASE_URL = 'https://router.project-osrm.org';

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
  const [routeInfo, setRouteInfo] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [passengerProfile, setPassengerProfile] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null); // 'pending', 'accepted', 'rejected'
  const [driverInfo, setDriverInfo] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [rideEstimate, setRideEstimate] = useState(null);
  const webViewRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  // Animações
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
      
      // Initialize passenger profile
      await initializePassenger();
    })();
  }, []);

  const initializePassenger = async () => {
    try {
      // Get or create passenger profile
      let profile = await LocalDatabase.getPassengerProfile();
      
      if (!profile) {
        // Create default passenger profile
        profile = {
          name: 'Usuário Demo',
          phone: '923456789',
          email: 'usuario@demo.com',
          preferredPaymentMethod: 'cash',
          apiRegistered: false,
        };
        await LocalDatabase.savePassengerProfile(profile);
      }
      
      setPassengerProfile(profile);
      
      // Register with API if not already registered
      if (!profile.apiRegistered) {
        try {
          const passengerData = {
            name: profile.name,
            phone: profile.phone,
            email: profile.email,
            preferredPaymentMethod: profile.preferredPaymentMethod
          };
          
          const apiResponse = await apiService.registerPassenger(passengerData);
          const passengerId = apiResponse.data.passengerId;
          
          // Update local profile with API ID
          await LocalDatabase.updatePassengerProfile({
            apiPassengerId: passengerId,
            apiRegistered: true
          });
          
          setPassengerProfile(prev => ({
            ...prev,
            apiPassengerId: passengerId,
            apiRegistered: true
          }));
          
          // Configure event callbacks ANTES de conectar o socket
          console.log('🎯 Configurando callbacks de eventos ANTES da conexão...');
          
          // Listen for ride updates
          apiService.onEvent('ride_accepted', (data) => {
            console.log('🎉 Corrida aceita pelo motorista:', data);
            console.log('📱 HomeScreen recebeu evento ride_accepted via ApiService');
            
            // Verificar se é um teste manual
            if (data.test) {
              console.log('🧪 TESTE MANUAL FUNCIONOU! Callback foi executado corretamente!');
              console.log('✅ Isso prova que o sistema de callbacks está funcionando');
              return; // Não processar como corrida real
            }
            
            // PARAR BUSCA IMEDIATAMENTE - PRIORIDADE MÁXIMA
            console.log('🛑 PARANDO BUSCA DE MOTORISTAS IMEDIATAMENTE');
            setIsSearchingDrivers(false);
            setDriversFound(true);
            setDriverSearchTime(0);
            
            // Limpar TODOS os intervalos possíveis
            if (window.driverSearchInterval) {
              console.log('🗑️ Limpando window.driverSearchInterval');
              clearInterval(window.driverSearchInterval);
              window.driverSearchInterval = null;
            }
            
            // Limpar qualquer timeout de busca também
            if (searchTimeoutRef.current) {
              console.log('🗑️ Limpando searchTimeoutRef');
              clearTimeout(searchTimeoutRef.current);
              searchTimeoutRef.current = null;
            }
            
            // Update request status
            setRequestStatus('accepted');
            setDriverInfo({
              id: data.driver?.id || data.driverId,
              name: data.driver?.name || 'Motorista',
              phone: data.driver?.phone || '',
              vehicle: data.driver?.vehicle || {},
              rating: data.driver?.rating || 0,
              location: data.driver?.location || null,
              estimatedArrival: data.estimatedArrival || '5-10 minutos'
            });
            
            // Store request ID for tracking
            if (data.rideId) {
              setRequestId(data.rideId);
            }
            
            // Atualizar dados da corrida com informações do motorista
            if (data.ride) {
              setCurrentRide(prev => ({
                ...prev,
                ...data.ride,
                driver: data.driver,
                status: 'accepted'
              }));
            }
            
            // Log final do estado após processamento
            console.log('✅ Estado final após ride_accepted:', {
              isSearchingDrivers: false,
              driversFound: true,
              driverSearchTime: 0,
              requestStatus: 'accepted',
              hasDriverInfo: !!data.driver,
              intervalCleared: !window.driverSearchInterval
            });
            
            // Mostrar toast de sucesso com detalhes do motorista
            Toast.show({
              type: "success",
              text1: "Solicitação Aceita! 🎉",
              text2: `${data.driver?.name || 'Motorista'} está a caminho - ${data.estimatedArrival || '5-10 min'}`,
              visibilityTime: 6000,
            });
          });

          apiService.onEvent('ride_rejected', (data) => {
            console.log('❌ Solicitação rejeitada pelo motorista:', data);
            
            // Update request status
            setRequestStatus('rejected');
            
            // Show rejection message
            Toast.show({
              type: "error",
              text1: "Solicitação Recusada",
              text2: data.reason || "O motorista não pode aceitar sua solicitação no momento",
              visibilityTime: 4000,
            });
            
            // Continue searching for other drivers
            console.log('🔄 Continuando busca por outros motoristas...');
          });

          apiService.onEvent('no_drivers_available', (data) => {
            console.log('🚫 Nenhum motorista disponível:', data);
            
            // Update request status
            setRequestStatus('rejected');
            
            // Stop driver search
            if (window.driverSearchInterval) {
              clearInterval(window.driverSearchInterval);
              window.driverSearchInterval = null;
            }
            
            setIsSearchingDrivers(false);
            setDriversFound(false);
            
            Toast.show({
              type: "error",
              text1: "Nenhum motorista disponível",
              text2: "Tente novamente em alguns minutos",
              visibilityTime: 5000,
            });
          });
          
          apiService.onEvent('ride_started', (data) => {
            console.log('🚗 Corrida iniciada:', data);
            setRequestStatus('started');
            
            Toast.show({
              type: "info",
              text1: "Corrida Iniciada",
              text2: "Sua viagem começou. Tenha uma boa viagem!",
              visibilityTime: 3000,
            });
          });
          
          apiService.onEvent('ride_completed', (data) => {
            console.log('✅ Corrida finalizada:', data);
            setRequestStatus('completed');
            setCurrentRide(null);
            setDriverInfo(null);
            setRequestId(null);
            
            Toast.show({
              type: "success",
              text1: "Viagem Concluída",
              text2: "Obrigado por usar nosso serviço!",
              visibilityTime: 4000,
            });
          });
          
          apiService.onEvent('ride_cancelled', (data) => {
            console.log('❌ Corrida cancelada:', data);
            
            // Update request status
            setRequestStatus('cancelled');
            
            // Parar busca se estava buscando
            setIsSearchingDrivers(false);
            setDriversFound(false);
            setDriverSearchTime(0);
            
            // Limpar intervalos
            if (window.driverSearchInterval) {
              clearInterval(window.driverSearchInterval);
              window.driverSearchInterval = null;
            }
            
            // Limpar corrida atual
            setCurrentRide(null);
            setDriverInfo(null);
            setRequestId(null);
            
            Toast.show({
              type: "error",
              text1: "Corrida Cancelada",
              text2: data.reason || "A corrida foi cancelada",
              visibilityTime: 4000,
            });
          });

          apiService.onEvent('driver_location_update', (data) => {
            console.log('📍 Atualização de localização do motorista:', data);
            if (driverInfo && data.driverId === driverInfo.id) {
              setDriverInfo(prev => ({
                ...prev,
                location: data.location,
                estimatedArrival: data.estimatedArrival
              }));
            }
          });
          
          // AGORA conectar o socket APÓS configurar todos os callbacks
          console.log('🔌 Conectando WebSocket como passageiro APÓS configurar callbacks:', passengerId);
          console.log('📊 Total de callbacks registrados antes da conexão:', apiService.eventCallbacks?.size || 0);
          apiService.connectSocket('passenger', passengerId);
          
        } catch (apiError) {
          console.warn('Passenger API registration failed:', apiError);
        }
      } else if (profile.apiPassengerId) {
        // Configure callbacks FIRST for already registered passenger
        console.log('🎯 Configurando callbacks para passageiro já registrado...');
        
        // Configurar os mesmos callbacks (simplificado)
        apiService.onEvent('ride_accepted', (data) => {
          console.log('🎉 [PASSAGEIRO JÁ REGISTRADO] Corrida aceita pelo motorista:', data);
          if (data.test) {
            console.log('🧪 TESTE MANUAL FUNCIONOU! Callback foi executado corretamente!');
            return;
          }
          console.log('🛑 PARANDO BUSCA DE MOTORISTAS IMEDIATAMENTE');
          setIsSearchingDrivers(false);
          setDriversFound(true);
          setDriverSearchTime(0);
          if (window.driverSearchInterval) {
            clearInterval(window.driverSearchInterval);
            window.driverSearchInterval = null;
          }
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
          }
          setRequestStatus('accepted');
          setDriverInfo({
            id: data.driver?.id || data.driverId,
            name: data.driver?.name || 'Motorista',
            phone: data.driver?.phone || '',
            vehicle: data.driver?.vehicle || {},
            rating: data.driver?.rating || 0,
            location: data.driver?.location || null,
            estimatedArrival: data.estimatedArrival || '5-10 minutos'
          });
          if (data.rideId) {
            setRequestId(data.rideId);
          }
          if (data.ride) {
            setCurrentRide(prev => ({
              ...prev,
              ...data.ride,
              driver: data.driver,
              status: 'accepted'
            }));
          }
          Toast.show({
            type: "success",
            text1: "Solicitação Aceita! 🎉",
            text2: `${data.driver?.name || 'Motorista'} está a caminho - ${data.estimatedArrival || '5-10 min'}`,
            visibilityTime: 6000,
          });
        });
        
        // Connect to socket AFTER configuring callbacks
        console.log('🔌 Conectando WebSocket para passageiro já registrado APÓS callbacks:', profile.apiPassengerId);
        console.log('📊 Total de callbacks registrados antes da conexão:', apiService.eventCallbacks?.size || 0);
        apiService.connectSocket('passenger', profile.apiPassengerId);
      }
      
    } catch (error) {
      console.error('Error initializing passenger:', error);
    }
  };

  // Update map when location changes
  useEffect(() => {
    if (location && webViewRef.current) {
      const accuracy = location.coords.accuracy || 20;
      const js = `window.__setUserLocation(${location.coords.latitude}, ${location.coords.longitude}, ${accuracy}); true;`;
      console.log('📍 Updating user location on map:', js);
      webViewRef.current.injectJavaScript(js);
    }
  }, [location]);

  // Animações de pulso
  useEffect(() => {
    if (isSearchingDrivers) {
      const startPulseAnimation = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.3,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();

        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim2, {
              toValue: 1.2,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim2, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      startPulseAnimation();
    } else {
      pulseAnim.setValue(1);
      pulseAnim2.setValue(1);
    }
  }, [isSearchingDrivers]);

  // OpenStreetMap HTML content with Leaflet
  const osmMapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OpenStreetMap</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body, html { margin: 0; padding: 0; height: 100%; }
            #mapContainer { height: 100%; width: 100%; }
            
            /* Estilo para o círculo de localização azul */
            .user-location-circle {
                border: 3px solid #4285F4;
                background-color: rgba(66, 133, 244, 0.3);
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            
            .user-location-dot {
                background-color: #4285F4;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
            
            @keyframes pulse {
                0% {
                    transform: scale(1);
                    opacity: 0.7;
                }
                50% {
                    transform: scale(1.2);
                    opacity: 0.4;
                }
                100% {
                    transform: scale(1);
                    opacity: 0.7;
                }
            }
        </style>
    </head>
    <body>
        <div id="mapContainer"></div>
        
        <script>
            // Initialize OpenStreetMap with Leaflet
            const map = L.map('mapContainer').setView([${location?.coords.latitude || -8.8390}, ${location?.coords.longitude || 13.2894}], 15);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);

            // Custom markers and route
            let userLocationGroup = null;
            let destinationMarker = null;
            let routeLine = null;
            let routeControl = null;

            // Add user location with blue circle (like Google Maps)
            function addUserLocationMarker(lat, lng, accuracy = 20) {
                if (userLocationGroup) {
                    map.removeLayer(userLocationGroup);
                }
                
                userLocationGroup = L.layerGroup();
                
                // Círculo de precisão (azul transparente)
                const accuracyCircle = L.circle([lat, lng], {
                    radius: accuracy,
                    color: '#4285F4',
                    fillColor: '#4285F4',
                    fillOpacity: 0.2,
                    weight: 2,
                    opacity: 0.6
                });
                
                // Ponto azul central
                const userDot = L.circleMarker([lat, lng], {
                    radius: 8,
                    fillColor: '#4285F4',
                    color: 'white',
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 1
                });
                
                // Adicionar animação de pulso
                const pulseCircle = L.circle([lat, lng], {
                    radius: accuracy * 0.5,
                    color: '#4285F4',
                    fillColor: '#4285F4',
                    fillOpacity: 0.3,
                    weight: 0,
                    className: 'user-location-circle'
                });
                
                userLocationGroup.addLayer(accuracyCircle);
                userLocationGroup.addLayer(pulseCircle);
                userLocationGroup.addLayer(userDot);
                userLocationGroup.addTo(map);
            }

            // Add destination marker
            function addDestinationMarker(lat, lng, title) {
                if (destinationMarker) {
                    map.removeLayer(destinationMarker);
                }
                
                // Criar ícone customizado para destino
                const destIcon = L.divIcon({
                    html: '<div style="background-color: #EF4444; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                    className: 'destination-marker'
                });
                
                destinationMarker = L.marker([lat, lng], { icon: destIcon });
                if (title) {
                    destinationMarker.bindPopup(title);
                }
                destinationMarker.addTo(map);
            }

            // Center map on location
            function centerOnLocation(lat, lng, zoom = 15) {
                map.setView([lat, lng], zoom);
            }

            // Calculate and draw route using OSRM
            async function calculateRoute(startLat, startLng, endLat, endLng) {
                try {
                    console.log('🛣️ Calculating route from', startLat, startLng, 'to', endLat, endLng);
                    
                    // Clear existing route
                    if (routeLine) {
                        map.removeLayer(routeLine);
                        routeLine = null;
                    }
                    
                    // OSRM API call for driving route
                    const routeUrl = \`https://router.project-osrm.org/route/v1/driving/\${startLng},\${startLat};\${endLng},\${endLat}?overview=full&geometries=geojson\`;
                    
                    const response = await fetch(routeUrl);
                    const data = await response.json();
                    
                    if (data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        const coordinates = route.geometry.coordinates;
                        
                        // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
                        const leafletCoords = coordinates.map(coord => [coord[1], coord[0]]);
                        
                        // Create route polyline
                        routeLine = L.polyline(leafletCoords, {
                            color: '#4285F4',
                            weight: 5,
                            opacity: 0.8,
                            smoothFactor: 1
                        }).addTo(map);
                        
                        // Fit map to show entire route
                        const group = new L.featureGroup([routeLine, userLocationGroup, destinationMarker]);
                        map.fitBounds(group.getBounds().pad(0.1));
                        
                        console.log('✅ Route calculated successfully');
                        console.log('📏 Distance:', (route.distance / 1000).toFixed(2), 'km');
                        console.log('⏱️ Duration:', Math.round(route.duration / 60), 'minutes');
                        
                        return {
                            distance: route.distance,
                            duration: route.duration,
                            coordinates: leafletCoords
                        };
                    } else {
                        console.error('❌ No route found');
                        return null;
                    }
                } catch (error) {
                    console.error('❌ Route calculation error:', error);
                    return null;
                }
            }

            // Store current user location for routing
            let currentUserLocation = null;

            // Expose functions for React Native to call via injectJavaScript
            window.__setUserLocation = function(lat, lng, accuracy = 20) {
              currentUserLocation = { lat, lng };
              addUserLocationMarker(lat, lng, accuracy);
              centerOnLocation(lat, lng);
            };
            
            window.__setDestination = async function(lat, lng, title) {
              addDestinationMarker(lat, lng, title);
              
              // Calculate route if user location is available
              if (currentUserLocation) {
                await calculateRoute(currentUserLocation.lat, currentUserLocation.lng, lat, lng);
              }
            };
            
            window.__centerOnUser = function() {
              if (currentUserLocation) {
                map.setView([currentUserLocation.lat, currentUserLocation.lng], 16);
                console.log('📍 Centered on user location:', currentUserLocation);
              } else if (userLocationGroup) {
                // Fallback: tentar obter do grupo
                try {
                  const bounds = userLocationGroup.getBounds();
                  if (bounds.isValid()) {
                    map.setView(bounds.getCenter(), 16);
                  }
                } catch (e) {
                  console.log('❌ Error centering on user location:', e);
                }
              }
            };
            
            window.__clearRoute = function() {
              if (destinationMarker) {
                map.removeLayer(destinationMarker);
                destinationMarker = null;
              }
              if (routeLine) {
                map.removeLayer(routeLine);
                routeLine = null;
              }
            };
            
            window.__calculateRoute = async function(startLat, startLng, endLat, endLng) {
              return await calculateRoute(startLat, startLng, endLat, endLng);
            };

            // Initialize with user location if available
            ${location ? `
              currentUserLocation = { lat: ${location.coords.latitude}, lng: ${location.coords.longitude} };
              addUserLocationMarker(${location.coords.latitude}, ${location.coords.longitude}, ${location.coords.accuracy || 20});
            ` : ''}
        </script>
    </body>
    </html>
  `;

  // Calculate route using OSRM API
  const calculateRouteInfo = async (startLat, startLng, endLat, endLng) => {
    try {
      console.log('🛣️ Calculating route info from React Native...');
      
      const routeUrl = `${OSRM_BASE_URL}/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      
      const response = await fetch(routeUrl);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const routeData = {
          distance: route.distance,
          duration: route.duration,
          distanceText: `${(route.distance / 1000).toFixed(1)} km`,
          durationText: `${Math.round(route.duration / 60)} min`
        };
        
        console.log('✅ Route info calculated:', routeData);
        setRouteInfo(routeData);
        return routeData;
      }
    } catch (error) {
      console.error('❌ Route calculation error:', error);
    }
    return null;
  };

  // Search places with OpenStreetMap Nominatim API
  const searchPlacesWithOSM = async (query) => {
    if (!query || query.length < 2) return [];
    
    console.log('🔍 Searching for:', query);
    setIsSearching(true);
    
    try {
      const userLat = location?.coords.latitude || -8.8390;
      const userLng = location?.coords.longitude || 13.2894;
      
      console.log('📍 User location:', userLat, userLng);
      
      // Nominatim Search API
      const searchUrl = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=20&addressdetails=1&extratags=1&namedetails=1&accept-language=pt&countrycodes=AO`;
      
      console.log('🌐 Search URL:', searchUrl);
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'TaxiApp/1.0 (contact@example.com)'
        }
      });
      const data = await response.json();
      
      console.log('📡 Nominatim API response:', data);
      
      if (data && data.length > 0) {
        const formattedPlaces = data.map((item, index) => ({
          id: `osm_${index}`,
          name: item.display_name.split(',')[0],
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
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
      console.error('❌ OSM Places search error:', error);
      Alert.alert('Erro', 'Não foi possível buscar locais. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = async (selectedLocation) => {
    console.log('🎯 Location selected:', selectedLocation);
    setDestination(selectedLocation.name);
    setSelectedDestination(selectedLocation);
    setIsSearchExpanded(false);
    
    // Send location to OSM Map and calculate route
    if (selectedLocation.lat && selectedLocation.lng && location) {
      // First, send destination to map (this will automatically calculate route in the WebView)
      const js = `window.__setDestination(${selectedLocation.lat}, ${selectedLocation.lng}, ${JSON.stringify(selectedLocation.name)}); true;`;
      console.log('🗺️ Injecting JavaScript:', js);
      webViewRef.current?.injectJavaScript(js);
      
      // Also calculate route info for React Native UI
      await calculateRouteInfo(
        location.coords.latitude, 
        location.coords.longitude, 
        selectedLocation.lat, 
        selectedLocation.lng
      );
      
      // Verificar se já há uma corrida aceita antes de iniciar nova busca
      if (requestStatus === 'accepted' || driversFound) {
        console.log('⚠️ Já há uma corrida aceita, cancelando nova busca');
        return;
      }
      
      // Calcular estimativa da corrida
      console.log('💰 Calculando estimativa da corrida...');
      const estimatedDistance = routeInfo?.distance || 5;
      const estimatedTime = routeInfo?.duration || 15;
      const vehicleType = selectedTaxiType === 'Premium' ? 'privado' : 'coletivo';
      const estimatedFare = apiService.calculateEstimatedFare(estimatedDistance, estimatedTime, vehicleType);
      
      const estimate = {
        distance: estimatedDistance,
        distanceText: routeInfo?.distanceText || `${estimatedDistance} km`,
        time: estimatedTime,
        timeText: routeInfo?.durationText || `${estimatedTime} min`,
        fare: estimatedFare,
        vehicleType: vehicleType,
        destination: selectedLocation
      };
      
      console.log('📊 Estimativa calculada:', estimate);
      setRideEstimate(estimate);
      setShowConfirmationModal(true);
      
          }
  };

  // Nova função para iniciar busca após confirmação
  const startDriverSearch = async () => {
    try {
      console.log('🚗 Iniciando busca de motoristas após confirmação...');
      
      setShowConfirmationModal(false);
      setIsSearchingDrivers(true);
      setDriverSearchTime(0);
      setDriversFound(false);
      setRequestStatus('pending');
      setDriverInfo(null);
      setRequestId(null);

      // Criar solicitação de corrida via API
      if (passengerProfile?.apiPassengerId && rideEstimate) {
        try {
          console.log('🚗 Criando corrida para passageiro:', passengerProfile.apiPassengerId);
          const rideData = {
            passengerId: passengerProfile.apiPassengerId,
            passengerName: passengerProfile.name,
            passengerPhone: passengerProfile.phone,
            pickup: {
              address: 'Localização atual',
              lat: location.coords.latitude,
              lng: location.coords.longitude
            },
            destination: {
              address: rideEstimate.destination.name,
              lat: rideEstimate.destination.lat,
              lng: rideEstimate.destination.lng
            },
            estimatedFare: rideEstimate.fare,
            estimatedDistance: rideEstimate.distance,
            estimatedTime: rideEstimate.time,
            paymentMethod: passengerProfile.preferredPaymentMethod || 'cash',
            vehicleType: rideEstimate.vehicleType === 'privado' ? 'premium' : 'standard'
          };
          
          const rideResponse = await apiService.createRideRequest(rideData);
          setCurrentRide(rideResponse.data.ride);
          
          console.log('✅ Solicitação criada via API:', rideResponse);
          
        } catch (apiError) {
          console.error('❌ Erro ao criar solicitação via API:', apiError);
          // Continue with simulation if API fails
        }
      }

      // Simular busca de motoristas por 30 segundos (tempo para motoristas responderem)
      const driverSearchInterval = setInterval(() => {
        setDriverSearchTime(prev => {
          const newTime = prev + 1;
          console.log('⏱️ Tempo de busca:', newTime, 'segundos');
          
          // LOG DETALHADO DO ESTADO DO SOCKET E EVENTOS
          console.log('🔍 DEBUG SOCKET - Estado atual:', {
            socketConnected: apiService.isConnected,
            socketExists: !!apiService.socket,
            socketId: apiService.socket?.id,
            requestStatus: requestStatus,
            driversFound: driversFound,
            isSearchingDrivers: isSearchingDrivers,
            hasCurrentRide: !!currentRide,
            hasDriverInfo: !!driverInfo,
            hasRequestId: !!requestId,
            callbacksRegistered: apiService.eventCallbacks?.has('ride_accepted'),
            totalCallbacks: apiService.eventCallbacks?.get('ride_accepted')?.length || 0,
            allRegisteredEvents: Array.from(apiService.eventCallbacks?.keys() || [])
          });
          
          // TESTE MANUAL DO SOCKET A CADA 10 SEGUNDOS
          if (newTime % 10 === 0 && apiService.socket && apiService.isConnected) {
            console.log('🧪 TESTE MANUAL - Enviando ping para verificar socket...');
            apiService.socket.emit('ping', { 
              timestamp: Date.now(), 
              from: 'HomeScreen',
              searchTime: newTime 
            });
            
            // Testar se conseguimos ouvir um evento de teste
            console.log('🎯 TESTE MANUAL - Emitindo evento de teste para verificar callbacks...');
            if (apiService.eventCallbacks?.has('ride_accepted')) {
              console.log('📞 Chamando callbacks manualmente para teste...');
              const testData = {
                test: true,
                message: 'Teste manual de callback',
                timestamp: Date.now()
              };
              apiService.triggerCallbacks('ride_accepted', testData);
            }
          }
          
          // Verificar se a corrida já foi aceita durante o intervalo
          if (requestStatus === 'accepted' || driversFound) {
            console.log('🛑 Corrida já foi aceita, parando intervalo de busca');
            clearInterval(driverSearchInterval);
            window.driverSearchInterval = null;
            return prev; // Não incrementar mais o tempo
          }
          
          if (newTime >= 30) {
            clearInterval(driverSearchInterval);
            window.driverSearchInterval = null; // Limpar referência global
            setIsSearchingDrivers(false);
            setDriversFound(false);
            console.log('❌ Nenhum motorista aceitou a corrida após 30 segundos');
            
            Toast.show({
              type: "error",
              text1: "Nenhum motorista encontrado",
              text2: "Tente novamente em alguns minutos",
            });
            
            return 30;
          }
          return newTime;
        });
      }, 1000);
      
      // Armazenar referência global para poder cancelar de outros lugares
      window.driverSearchInterval = driverSearchInterval;
      
    } catch (error) {
      console.error('Erro ao iniciar busca de motoristas:', error);
      setIsSearchingDrivers(false);
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
      searchPlacesWithOSM(text);
    }, 500);
  };

  const handleNewSearch = () => {
    setDestination('');
    setSelectedDestination(null);
    setIsSearchingDrivers(false);
    setDriverSearchTime(0);
    setDriversFound(false);
    setRouteInfo(null);
    setRequestStatus(null);
    setDriverInfo(null);
    setRequestId(null);
    setCurrentRide(null);
    
    // Clear route on map
    const js = `window.__clearRoute(); true;`;
    webViewRef.current?.injectJavaScript(js);
    
    // Clear any ongoing search intervals
    if (window.driverSearchInterval) {
      clearInterval(window.driverSearchInterval);
      window.driverSearchInterval = null;
    }
  };

  const handleCallDriver = () => {
    if (driverInfo && driverInfo.phone) {
      // In a real app, you would use Linking to make a phone call
      console.log('📞 Ligando para motorista:', driverInfo.phone);
      Toast.show({
        type: "info",
        text1: "Ligando para motorista",
        text2: driverInfo.phone,
        visibilityTime: 3000,
      });
      
      // For development, just show the phone number
      Alert.alert(
        "Ligar para motorista",
        `Deseja ligar para ${driverInfo.name}?\n\nTelefone: ${driverInfo.phone}`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Ligar", onPress: () => {
            // In production, use: Linking.openURL(`tel:${driverInfo.phone}`)
            console.log('Fazendo ligação para:', driverInfo.phone);
          }}
        ]
      );
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

  const closeDropdowns = () => {
    setIsDropdownOpen(false);
    setIsNavDropdownOpen(false);
  };

  return (
    <View style={styles.container}>
      {console.log('🏠 HomeScreen render - States:', { isSearchingDrivers, selectedDestination: !!selectedDestination, driverSearchTime, driversFound })}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Status Indicator - WebSocket Connection & Request Status */}
      {(requestStatus === 'pending' || requestStatus === 'accepted') && (
        <View style={styles.statusIndicatorBar}>
          <View style={styles.statusContent}>
            {requestStatus === 'pending' && (
              <>
                <View style={styles.pendingDot} />
                <Text style={styles.statusBarText}>Procurando motorista...</Text>
              </>
            )}
            {requestStatus === 'accepted' && driverInfo && (
              <>
                <View style={styles.acceptedDot} />
                <Text style={styles.statusBarText}>
                  {driverInfo.name} está a caminho - {driverInfo.estimatedArrival}
                </Text>
              </>
            )}
          </View>
        </View>
      )}
      
      {/* Overlay para fechar dropdowns */}
      {(isDropdownOpen || isNavDropdownOpen) && (
        <TouchableOpacity 
          style={styles.dropdownOverlay} 
          onPress={closeDropdowns}
          activeOpacity={1}
        />
      )}

      {/* OpenStreetMap WebView */}
      <WebView
        ref={webViewRef}
        source={{ html: osmMapHTML }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="compatibility"
        onLoad={() => console.log('🗺️ WebView loaded successfully')}
        onError={(error) => console.error('❌ WebView error:', error)}
        onHttpError={(error) => console.error('🌐 WebView HTTP error:', error)}
      />

      {/* Location Button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={centerOnUserLocation}
      >
        <MaterialIcons name="my-location" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Navigation Dropdown - Lado Esquerdo */}
      <View style={styles.navDropdownContainer}>
        <TouchableOpacity
          style={styles.navDropdownButton}
          onPress={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* Navigation Dropdown Options */}
        {isNavDropdownOpen && (
          <View style={styles.navDropdownOptions}>
            <TouchableOpacity
              style={styles.navDropdownOption}
              onPress={() => {
                setIsNavDropdownOpen(false);
                // Já estamos na Home, não precisa navegar
              }}
            >
              <MaterialIcons name="home" size={20} color="#4285F4" />
              <Text style={styles.navDropdownOptionText}>Home</Text>
              <MaterialIcons name="check" size={16} color="#4285F4" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navDropdownOption}
              onPress={() => {
                setIsNavDropdownOpen(false);
                navigation.navigate('Reservas');
              }}
            >
              <MaterialIcons name="event" size={20} color="#6B7280" />
              <Text style={styles.navDropdownOptionText}>Reservas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navDropdownOption}
              onPress={() => {
                setIsNavDropdownOpen(false);
                navigation.navigate('Favoritos');
              }}
            >
              <MaterialIcons name="favorite" size={20} color="#6B7280" />
              <Text style={styles.navDropdownOptionText}>Favoritos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navDropdownOption}
              onPress={() => {
                setIsNavDropdownOpen(false);
                navigation.navigate('Conta');
              }}
            >
              <MaterialIcons name="person" size={20} color="#6B7280" />
              <Text style={styles.navDropdownOptionText}>Conta</Text>
            </TouchableOpacity>

            <View style={styles.navDropdownSeparator} />

            <TouchableOpacity
              style={styles.navDropdownOption}
              onPress={() => {
                setIsNavDropdownOpen(false);
                navigation.navigate('Settings');
              }}
            >
              <MaterialIcons name="settings" size={20} color="#6B7280" />
              <Text style={styles.navDropdownOptionText}>Configurações</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navDropdownOption}
              onPress={() => {
                setIsNavDropdownOpen(false);
                navigation.navigate('Help');
              }}
            >
              <MaterialIcons name="help" size={20} color="#6B7280" />
              <Text style={styles.navDropdownOptionText}>Ajuda</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Taxi Type Dropdown - Lado Direito (mantido menor) */}
      <View style={styles.taxiDropdownContainer}>
        <TouchableOpacity
          style={styles.taxiDropdownButton}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          activeOpacity={0.8}
        >
          <MaterialIcons 
            name={selectedTaxiType === 'Coletivo' ? 'directions-bus' : 'local-taxi'} 
            size={18} 
            color="#4285F4" 
          />
          <Text style={styles.taxiDropdownButtonText}>{selectedTaxiType}</Text>
          <MaterialIcons 
            name={isDropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={16} 
            color="#6B7280" 
          />
        </TouchableOpacity>

        {/* Taxi Dropdown Options */}
        {isDropdownOpen && (
          <View style={styles.taxiDropdownOptions}>
            <TouchableOpacity
              style={[
                styles.taxiDropdownOption,
                selectedTaxiType === 'Coletivo' && styles.taxiDropdownOptionSelected
              ]}
              onPress={() => {
                setSelectedTaxiType('Coletivo');
                setIsDropdownOpen(false);
              }}
            >
              <MaterialIcons name="directions-bus" size={16} color={selectedTaxiType === 'Coletivo' ? '#4285F4' : '#6B7280'} />
              <Text style={[
                styles.taxiDropdownOptionText,
                selectedTaxiType === 'Coletivo' && styles.taxiDropdownOptionTextSelected
              ]}>
                Coletivo
              </Text>
              {selectedTaxiType === 'Coletivo' && (
                <MaterialIcons name="check" size={14} color="#4285F4" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taxiDropdownOption,
                selectedTaxiType === 'Privado' && styles.taxiDropdownOptionSelected
              ]}
              onPress={() => {
                setSelectedTaxiType('Privado');
                setIsDropdownOpen(false);
              }}
            >
              <MaterialIcons name="local-taxi" size={16} color={selectedTaxiType === 'Privado' ? '#4285F4' : '#6B7280'} />
              <Text style={[
                styles.taxiDropdownOptionText,
                selectedTaxiType === 'Privado' && styles.taxiDropdownOptionTextSelected
              ]}>
                Privado
              </Text>
              {selectedTaxiType === 'Privado' && (
                <MaterialIcons name="check" size={14} color="#4285F4" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

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


        </View>
      ) : null}

      {/* Route Info */}
      {routeInfo && selectedDestination && !isSearchingDrivers && (
        <View style={styles.routeInfoCard}>
          <View style={styles.routeInfoContent}>
            <View style={styles.routeInfoRow}>
              <MaterialIcons name="directions" size={20} color="#4285F4" />
              <Text style={styles.routeInfoText}>
                {routeInfo.distanceText} • {routeInfo.durationText}
              </Text>
            </View>
            <Text style={styles.routeDestination} numberOfLines={1}>
              Para: {selectedDestination.name}
            </Text>
          </View>
        </View>
      )}

      {/* Driver Search Animation - Nova Interface */}
      {isSearchingDrivers && (
        <View style={styles.driverSearchOverlay}>
          <View style={styles.driverSearchCard}>
            {/* Cabeçalho com ícone animado */}
            <View style={styles.searchHeader}>
              <View style={styles.searchIconContainer}>
                <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
                <Animated.View style={[styles.pulseCircle2, { transform: [{ scale: pulseAnim2 }] }]} />
                <MaterialIcons name="directions-car" size={32} color="#4285F4" style={styles.carIcon} />
              </View>
            </View>
            
            {/* Conteúdo principal */}
            <View style={styles.searchContent}>
              <Text style={styles.searchingTitle}>Procurando motoristas</Text>
              <Text style={styles.searchingSubtitle}>
                Estamos procurando os melhores motoristas na sua região
              </Text>
              
              {/* Barra de progresso animada */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(driverSearchTime / 10) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{driverSearchTime}/10s</Text>
              </View>
              
              {/* Indicadores de busca */}
              <View style={styles.searchIndicators}>
                <View style={styles.indicatorRow}>
                  <View style={[styles.indicator, driverSearchTime >= 2 && styles.indicatorActive]}>
                    <MaterialIcons name="search" size={16} color={driverSearchTime >= 2 ? "#4285F4" : "#E5E7EB"} />
                  </View>
                  <Text style={[styles.indicatorText, driverSearchTime >= 2 && styles.indicatorTextActive]}>
                    Analisando área
                  </Text>
                </View>
                
                <View style={styles.indicatorRow}>
                  <View style={[styles.indicator, driverSearchTime >= 5 && styles.indicatorActive]}>
                    <MaterialIcons name="location-on" size={16} color={driverSearchTime >= 5 ? "#4285F4" : "#E5E7EB"} />
                  </View>
                  <Text style={[styles.indicatorText, driverSearchTime >= 5 && styles.indicatorTextActive]}>
                    Localizando motoristas
                  </Text>
                </View>
                
                <View style={styles.indicatorRow}>
                  <View style={[styles.indicator, driverSearchTime >= 8 && styles.indicatorActive]}>
                    <MaterialIcons name="phone" size={16} color={driverSearchTime >= 8 ? "#4285F4" : "#E5E7EB"} />
                  </View>
                  <Text style={[styles.indicatorText, driverSearchTime >= 8 && styles.indicatorTextActive]}>
                    Contactando motoristas
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Botão de cancelar */}
            <TouchableOpacity style={styles.cancelButton} onPress={handleNewSearch}>
              <Text style={styles.cancelButtonText}>Cancelar busca</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Request Status - Solicitação Aceita */}
      {requestStatus === 'accepted' && driverInfo && (
        <View style={styles.driverSearchOverlay}>
          <View style={styles.acceptedCard}>
            {/* Cabeçalho de sucesso */}
            <View style={styles.acceptedHeader}>
              <View style={styles.successIconContainer}>
                <MaterialIcons name="check-circle" size={50} color="#10B981" />
              </View>
              <Text style={styles.acceptedTitle}>Solicitação Aceita!</Text>
              <Text style={styles.acceptedSubtitle}>Motorista encontrado e confirmado</Text>
            </View>

            {/* Informações do motorista */}
            <View style={styles.driverInfoCard}>
              <View style={styles.driverInfoHeader}>
                <View style={styles.driverAvatar}>
                  <MaterialIcons name="person" size={30} color="#4285F4" />
                </View>
                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>{driverInfo.name}</Text>
                  <View style={styles.ratingContainer}>
                    <MaterialIcons name="star" size={16} color="#FFC107" />
                    <Text style={styles.driverRating}>{driverInfo.rating || 4.8}</Text>
                  </View>
                </View>
                <View style={styles.estimatedTimeContainer}>
                  <MaterialIcons name="access-time" size={16} color="#6B7280" />
                  <Text style={styles.estimatedTime}>{driverInfo.estimatedArrival}</Text>
                </View>
              </View>

              {/* Informações do veículo */}
              {driverInfo.vehicle && (
                <View style={styles.vehicleInfo}>
                  <MaterialIcons name="directions-car" size={16} color="#6B7280" />
                  <Text style={styles.vehicleText}>
                    {driverInfo.vehicle.make} {driverInfo.vehicle.model} - {driverInfo.vehicle.plate}
                  </Text>
                </View>
              )}

              {/* Status em tempo real */}
              <View style={styles.statusContainer}>
                <View style={styles.statusIndicator}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Motorista a caminho</Text>
                </View>
              </View>
            </View>

            {/* Ações */}
            <View style={styles.acceptedActions}>
              <TouchableOpacity style={styles.callDriverButton} onPress={handleCallDriver}>
                <MaterialIcons name="phone" size={20} color="#ffffff" />
                <Text style={styles.callDriverText}>Ligar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelRideButton} onPress={handleNewSearch}>
                <Text style={styles.cancelRideText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Drivers Not Found - Nova Interface */}
      {!driversFound && !isSearchingDrivers && driverSearchTime >= 10 && (
        <View style={styles.driverSearchOverlay}>
          <View style={styles.notFoundCard}>
            {/* Ícone animado */}
            <View style={styles.notFoundIconContainer}>
              <View style={styles.notFoundIconBg}>
                <MaterialIcons name="search-off" size={40} color="#FF6B6B" />
              </View>
            </View>
            
            {/* Conteúdo */}
            <View style={styles.notFoundContent}>
              <Text style={styles.notFoundTitle}>Nenhum motorista disponível</Text>
              <Text style={styles.notFoundSubtitle}>
                No momento não há motoristas disponíveis na sua área. Tente novamente em alguns minutos.
              </Text>
              
              {/* Sugestões */}
              <View style={styles.suggestionsList}>
                <View style={styles.suggestionItem}>
                  <MaterialIcons name="schedule" size={20} color="#6B7280" />
                  <Text style={styles.suggestionText}>Tente em horários de maior movimento</Text>
                </View>
                <View style={styles.suggestionItem}>
                  <MaterialIcons name="location-on" size={20} color="#6B7280" />
                  <Text style={styles.suggestionText}>Verifique se está numa área de cobertura</Text>
                </View>
              </View>
            </View>
            
            {/* Botões de ação */}
            <View style={styles.notFoundActions}>
              <TouchableOpacity style={styles.tryAgainButton} onPress={handleNewSearch}>
                <MaterialIcons name="refresh" size={20} color="#ffffff" />
                <Text style={styles.tryAgainButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.changeLocationButton} onPress={handleNewSearch}>
                <Text style={styles.changeLocationButtonText}>Mudar Destino</Text>
              </TouchableOpacity>
            </View>
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

      {/* Modal de Confirmação da Corrida */}
      <Modal
        visible={showConfirmationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <View style={styles.confirmationHeader}>
              <Text style={styles.confirmationTitle}>Confirmar Corrida</Text>
              <TouchableOpacity
                onPress={() => setShowConfirmationModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {rideEstimate && (
              <View style={styles.confirmationBody}>
                <View style={styles.routePreview}>
                  <View style={styles.routePoint}>
                    <MaterialIcons name="radio-button-checked" size={20} color="#10B981" />
                    <Text style={styles.routePointText}>Sua localização</Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routePoint}>
                    <MaterialIcons name="place" size={20} color="#EF4444" />
                    <Text style={styles.routePointText}>{rideEstimate.destination.name}</Text>
                  </View>
                </View>

                <View style={styles.estimateCard}>
                  <View style={styles.estimateRow}>
                    <MaterialIcons name="straighten" size={20} color="#6B7280" />
                    <Text style={styles.estimateLabel}>Distância</Text>
                    <Text style={styles.estimateValue}>{rideEstimate.distanceText}</Text>
                  </View>
                  <View style={styles.estimateRow}>
                    <MaterialIcons name="access-time" size={20} color="#6B7280" />
                    <Text style={styles.estimateLabel}>Tempo estimado</Text>
                    <Text style={styles.estimateValue}>{rideEstimate.timeText}</Text>
                  </View>
                  <View style={styles.estimateRow}>
                    <MaterialIcons name="local-taxi" size={20} color="#6B7280" />
                    <Text style={styles.estimateLabel}>Tipo de veículo</Text>
                    <Text style={styles.estimateValue}>
                      {rideEstimate.vehicleType === 'privado' ? 'Privado' : 'Coletivo'}
                    </Text>
                  </View>
                </View>

                <View style={styles.fareCard}>
                  <Text style={styles.fareLabel}>Valor da corrida</Text>
                  <Text style={styles.fareValue}>{rideEstimate.fare} AOA</Text>
                  <Text style={styles.fareNote}>
                    {rideEstimate.vehicleType === 'privado' 
                      ? 'Valor calculado por distância e tempo'
                      : 'Preço fixo para coletivo'
                    }
                  </Text>
                </View>

                <View style={styles.confirmationActions}>
                  <TouchableOpacity
                    style={styles.cancelConfirmButton}
                    onPress={() => setShowConfirmationModal(false)}
                  >
                    <Text style={styles.cancelConfirmText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.confirmRideButton}
                    onPress={startDriverSearch}
                  >
                    <Text style={styles.confirmRideText}>Confirmar e Buscar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    width: 44,
    height: 44,
    backgroundColor: '#2563EB',
    borderRadius: 22,
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
  // Navigation Dropdown Styles
  navDropdownContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1000,
  },
  navDropdownButton: {
    width: 44,
    height: 44,
    backgroundColor: '#4285F4',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  navDropdownOptions: {
    position: 'absolute',
    top: 52,
    left: 0,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    minWidth: 170,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  navDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  navDropdownOptionText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  navDropdownSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
    marginHorizontal: 16,
  },
  
  // Taxi Type Dropdown Styles (reposicionado para baixo do nav)
  taxiDropdownContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    zIndex: 999,
  },
  taxiDropdownButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    minWidth: 90,
  },
  taxiDropdownButtonText: {
    fontSize: 12,
    color: '#1F2937',
    marginHorizontal: 4,
    fontWeight: '500',
  },
  taxiDropdownOptions: {
    position: 'absolute',
    top: 38,
    left: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    minWidth: 100,
    paddingVertical: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  taxiDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 30,
  },
  taxiDropdownOptionSelected: {
    backgroundColor: '#F0F9FF',
  },
  taxiDropdownOptionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  taxiDropdownOptionTextSelected: {
    color: '#4285F4',
    fontWeight: '600',
  },
  
  // Overlay para fechar dropdowns
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  // Nova Interface de Busca de Motoristas
  driverSearchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  driverSearchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    minHeight: 280,
    maxHeight: '70%',
  },
  searchHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  searchIconContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    transform: [{ scale: 1 }],
  },
  pulseCircle2: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
    transform: [{ scale: 1 }],
  },
  carIcon: {
    zIndex: 1,
  },
  searchContent: {
    alignItems: 'center',
    width: '100%',
  },
  searchingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  searchingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4285F4',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchIndicators: {
    width: '100%',
    alignItems: 'flex-start',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  indicatorActive: {
    backgroundColor: '#EBF4FF',
  },
  indicatorText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  indicatorTextActive: {
    color: '#4285F4',
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Nova Interface de Motoristas Não Encontrados
  notFoundCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    minHeight: 250,
    maxHeight: '60%',
  },
  notFoundIconContainer: {
    marginBottom: 15,
  },
  notFoundIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  suggestionsList: {
    alignItems: 'flex-start',
    width: '100%',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  notFoundActions: {
    width: '100%',
    alignItems: 'center',
  },
  tryAgainButton: {
    backgroundColor: '#4285F4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
    justifyContent: 'center',
  },
  tryAgainButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  changeLocationButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  changeLocationButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '500',
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
  routeInfoCard: {
    position: 'absolute',
    top: 175,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  routeInfoContent: {
    alignItems: 'flex-start',
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
  },
  routeDestination: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: '100%',
  },
  // Estilos para Solicitação Aceita
  acceptedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: width - 40,
  },
  acceptedHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconContainer: {
    marginBottom: 12,
  },
  acceptedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  acceptedSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  driverInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  driverInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverRating: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  estimatedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estimatedTime: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  vehicleText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  acceptedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  callDriverButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  callDriverText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelRideButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cancelRideText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  // Status Indicator Bar
  statusIndicatorBar: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBarText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 8,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  acceptedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },

  // Estilos do Modal de Confirmação
  confirmationModal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  confirmationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  confirmationBody: {
    padding: 20,
  },
  routePreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routePointText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  estimateCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  estimateLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  estimateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  fareCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  fareValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
  },
  fareNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelConfirmButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  confirmRideButton: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmRideText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});