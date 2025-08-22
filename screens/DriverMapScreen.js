import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import LocalDatabase from '../services/localDatabase';
import apiService from '../services/apiService';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

export default function DriverMapScreen({ navigation, route }) {
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [navigationMode, setNavigationMode] = useState(false);
  const [ridePhase, setRidePhase] = useState('pickup'); // 'pickup' or 'dropoff'
  const [acceptingRequest, setAcceptingRequest] = useState(false);
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    initializeDriver();
    requestLocationPermission();
    
    // Check if we have an active ride from navigation params
    if (route?.params?.activeRide) {
      setActiveRide(route.params.activeRide);
      setNavigationMode(true);
      setRidePhase(route.params.navigateTo || 'pickup');
    }
    
    // Cleanup function
    return () => {};
  }, [isOnline, showRequestModal, navigationMode]);

  useEffect(() => {
    if (activeRide && location && webViewRef.current && navigationMode) {
      startNavigationToDestination();
    }
  }, [activeRide, location, navigationMode]);

  const initializeDriver = async () => {
    try {
      const profile = await LocalDatabase.getDriverProfile();
      const onlineStatus = await LocalDatabase.getDriverOnlineStatus();
      
      if (profile) {
        setDriverProfile(profile);
        setIsOnline(onlineStatus);
        
        // Conectar ao socket se temos ID da API
        if (profile.apiDriverId) {
          const socket = apiService.connectSocket('driver', profile.apiDriverId);
          
          if (socket) {
            // Escutar novas solicitações de corrida
            socket.on('new_ride_request', (data) => {
              console.log('Nova solicitação recebida:', data);
              setCurrentRequest(data.ride);
              setShowRequestModal(true);
              
              Toast.show({
                type: "info",
                text1: "Nova solicitação!",
                text2: `Corrida para ${data.ride.destination.address}`,
              });
            });
            
            // Escutar quando uma corrida não está mais disponível
            socket.on('ride_unavailable', (data) => {
              console.log('Corrida não disponível:', data);
              if (currentRequest?.id === data.rideId) {
                setShowRequestModal(false);
                setCurrentRequest(null);
                Toast.show({
                  type: "info",
                  text1: "Corrida indisponível",
                  text2: data.message,
                });
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error initializing driver:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'O app precisa da permissão de localização para funcionar corretamente.',
          [{ text: 'OK' }]
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      // Start watching position
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation);
          updateMapLocation(newLocation);
          
          // Update driver location in API if online and registered
          if (driverProfile?.apiDriverId && isOnline) {
            try {
              apiService.updateDriverLocation(driverProfile.apiDriverId, newLocation.coords);
            } catch (error) {
              console.warn('Failed to update location in API:', error);
            }
          }
          
          // Update ride location if in active ride
          if (activeRide?.id && driverProfile?.apiDriverId) {
            try {
              apiService.updateRideLocation(activeRide.id, driverProfile.apiDriverId, newLocation.coords);
            } catch (error) {
              console.warn('Failed to update ride location:', error);
            }
          }
        }
      );
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const updateMapLocation = (newLocation) => {
    if (webViewRef.current && newLocation) {
      const speed = newLocation.coords.speed || 0;
      const script = `
        if (typeof updateDriverLocation === 'function') {
          updateDriverLocation(${newLocation.coords.latitude}, ${newLocation.coords.longitude}, ${speed});
        }
      `;
      webViewRef.current.postMessage(script);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      
      // Update status in API if driver is registered
      if (driverProfile?.apiDriverId) {
        try {
          await apiService.updateDriverStatus(driverProfile.apiDriverId, newStatus, location?.coords);
        } catch (apiError) {
          console.warn('API status update failed:', apiError);
        }
      }
      
      await LocalDatabase.setDriverOnlineStatus(newStatus);
      setIsOnline(newStatus);

      Toast.show({
        type: "success",
        text1: newStatus ? "Online" : "Offline",
        text2: newStatus ? "Você está disponível para corridas" : "Você não receberá solicitações",
      });

      // Update map status
      if (webViewRef.current) {
        const script = `
          if (typeof updateDriverStatus === 'function') {
            updateDriverStatus(${newStatus});
          }
        `;
        webViewRef.current.postMessage(script);
      }
    } catch (error) {
      console.error('Error toggling online status:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível alterar o status",
      });
    }
  };



  const acceptRequest = async () => {
    if (!currentRequest || !driverProfile) return;
    
    try {
      setAcceptingRequest(true);
      
      // Aceitar corrida via API
      if (driverProfile.apiDriverId) {
        const driverData = {
          driverId: driverProfile.apiDriverId,
          driverName: driverProfile.nome || 'Motorista',
          driverPhone: driverProfile.telefone || driverProfile.phone,
          vehicleInfo: {
            make: driverProfile.veiculo?.marca || 'Toyota',
            model: driverProfile.veiculo?.modelo || 'Corolla',
            year: driverProfile.veiculo?.ano || 2020,
            color: driverProfile.veiculo?.cor || 'Branco',
            plate: driverProfile.veiculo?.placa || 'LD-12-34-AB'
          }
        };
        
        await apiService.acceptRide(currentRequest.id, driverData);
      }
      
      setActiveRide(currentRequest);
      setNavigationMode(true);
      setRidePhase('pickup');
      
      Toast.show({
        type: "success",
        text1: "Corrida aceita!",
        text2: `Navegando até ${currentRequest.passengerName}`,
      });
      
      setShowRequestModal(false);
      
      // Start navigation immediately after accepting
      setTimeout(() => {
        if (webViewRef.current && location) {
          const destination = currentRequest.pickup;
          const script = `
            if (typeof startNavigation === 'function') {
              console.log('Triggering navigation to pickup location');
              startNavigation(${destination.lat}, ${destination.lng}, '${currentRequest.passengerName}', 'pickup');
            }
          `;
          webViewRef.current.postMessage(script);
        }
      }, 1000);
      
      setCurrentRequest(null);
      
    } catch (error) {
      console.error('Error accepting ride:', error);
      Toast.show({
        type: "error",
        text1: "Erro ao aceitar corrida",
        text2: "Tente novamente",
      });
    } finally {
      setAcceptingRequest(false);
    }
  };

  const rejectRequest = async () => {
    if (!currentRequest || !driverProfile) return;
    
    try {
      // Rejeitar corrida via API
      if (driverProfile.apiDriverId) {
        await apiService.rejectRide(currentRequest.id, driverProfile.apiDriverId, 'Driver declined');
      }
      
      Toast.show({
        type: "info",
        text1: "Corrida recusada",
        text2: "Aguardando nova solicitação...",
      });
      setShowRequestModal(false);
      setCurrentRequest(null);
      
    } catch (error) {
      console.error('Error rejecting ride:', error);
      // Still hide the modal even if API call fails
      setShowRequestModal(false);
      setCurrentRequest(null);
    }
  };

  const startNavigationToDestination = () => {
    if (!activeRide || !location || !webViewRef.current) return;

    const destination = ridePhase === 'pickup' ? activeRide.pickup : activeRide.destination;
    
    const script = `
      if (typeof startNavigation === 'function') {
        startNavigation(${destination.lat}, ${destination.lng}, '${activeRide.passengerName}', '${ridePhase}');
      }
    `;
    webViewRef.current.postMessage(script);
  };

  const simulateArrival = () => {
    if (ridePhase === 'pickup') {
      // Arrived at pickup location
      Alert.alert(
        'Chegou ao local de embarque',
        'Você chegou ao local do passageiro. Confirme que o passageiro entrou no veículo.',
        [
          {
            text: 'Passageiro Embarcou',
            onPress: async () => {
              try {
                // Start ride via API
                if (driverProfile?.apiDriverId && activeRide?.id) {
                  await apiService.startRide(
                    activeRide.id, 
                    driverProfile.apiDriverId, 
                    location?.coords
                  );
                }
                
                setRidePhase('dropoff');
                Toast.show({
                  type: "success",
                  text1: "Corrida iniciada!",
                  text2: "Navegando para o destino",
                });
                
                // Start navigation to destination
                setTimeout(() => {
                  if (webViewRef.current) {
                    const script = `
                      if (typeof startNavigation === 'function') {
                        startNavigation(${activeRide.destination.lat}, ${activeRide.destination.lng}, '${activeRide.passengerName}', 'dropoff');
                      }
                    `;
                    webViewRef.current.postMessage(script);
                  }
                }, 1000);
                
              } catch (error) {
                console.error('Error starting ride:', error);
                Toast.show({
                  type: "error",
                  text1: "Erro ao iniciar corrida",
                  text2: "Continuando localmente",
                });
                
                // Continue locally even if API fails
                setRidePhase('dropoff');
              }
            }
          }
        ]
      );
    } else {
      // Arrived at destination
      Alert.alert(
        'Corrida finalizada',
        'Você chegou ao destino. A corrida foi concluída com sucesso!',
        [
          {
            text: 'Finalizar Corrida',
            onPress: async () => {
              try {
                const fareEarned = activeRide.estimatedFare || activeRide.fare;
                
                // Complete ride via API
                if (driverProfile?.apiDriverId && activeRide?.id) {
                  const completionData = {
                    dropoffLocation: location?.coords,
                    actualFare: fareEarned,
                    paymentConfirmed: true
                  };
                  
                  await apiService.completeRide(
                    activeRide.id, 
                    driverProfile.apiDriverId, 
                    completionData
                  );
                }
                
                setActiveRide(null);
                setNavigationMode(false);
                setRidePhase('pickup');
                
                if (webViewRef.current) {
                  const script = `
                    if (typeof clearNavigation === 'function') {
                      clearNavigation();
                    }
                  `;
                  webViewRef.current.postMessage(script);
                }
                
                Toast.show({
                  type: "success",
                  text1: "Corrida concluída!",
                  text2: `Você ganhou ${fareEarned} AOA`,
                });
                
              } catch (error) {
                console.error('Error completing ride:', error);
                Toast.show({
                  type: "success",
                  text1: "Corrida concluída!",
                  text2: "Finalizando localmente",
                });
                
                // Continue locally even if API fails
                setActiveRide(null);
                setNavigationMode(false);
                setRidePhase('pickup');
              }
            }
          }
        ]
      );
    }
  };

  const cancelRide = () => {
    Alert.alert(
      'Cancelar corrida',
      'Tem certeza que deseja cancelar esta corrida?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: () => {
            setActiveRide(null);
            setNavigationMode(false);
            setRidePhase('pickup');
            
            if (webViewRef.current) {
              const script = `
                if (typeof clearNavigation === 'function') {
                  clearNavigation();
                }
              `;
              webViewRef.current.postMessage(script);
            }
            
            Toast.show({
              type: "info",
              text1: "Corrida cancelada",
              text2: "Você está disponível para novas corridas",
            });
          }
        }
      ]
    );
  };

  // OpenStreetMap with Leaflet (Free) + Advanced Navigation
  const openStreetMapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Driver Navigation</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
        <style>
            body, html { 
                margin: 0; 
                padding: 0; 
                height: 100%; 
                font-family: Arial, sans-serif;
            }
            #map { 
                height: 100%; 
                width: 100%; 
                position: relative;
            }
            .driver-status {
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.95);
                padding: 15px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 1000;
                text-align: center;
                backdrop-filter: blur(10px);
            }
            .status-online {
                color: #10B981;
                font-weight: bold;
                font-size: 16px;
            }
            .status-offline {
                color: #EF4444;
                font-weight: bold;
                font-size: 16px;
            }
            .navigation-info {
                position: absolute;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: rgba(37, 99, 235, 0.95);
                color: white;
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                z-index: 1000;
                display: none;
                backdrop-filter: blur(10px);
            }
            .navigation-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255,255,255,0.2);
            }
            .ride-phase {
                font-size: 14px;
                font-weight: bold;
                text-transform: uppercase;
                opacity: 0.9;
            }
            .eta-info {
                text-align: right;
                font-size: 14px;
            }
            .next-instruction {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
                line-height: 1.3;
            }
            .distance-time {
                font-size: 16px;
                opacity: 0.9;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .speed-info {
                position: absolute;
                bottom: 180px;
                right: 20px;
                background: rgba(255, 255, 255, 0.95);
                padding: 12px 16px;
                border-radius: 25px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                z-index: 1000;
                font-weight: bold;
                font-size: 16px;
                backdrop-filter: blur(10px);
            }
            .arrival-button {
                position: absolute;
                bottom: 200px;
                left: 20px;
                background: #10B981;
                color: white;
                padding: 12px 20px;
                border: none;
                border-radius: 25px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                display: none;
                font-size: 14px;
            }
            .arrival-button:hover {
                background: #059669;
            }
            .leaflet-routing-container {
                display: none;
            }
            .leaflet-control-zoom {
                display: none;
            }
            .leaflet-control-attribution {
                display: none;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <div class="driver-status">
            <div id="statusText" class="status-offline">OFFLINE - Não recebendo solicitações</div>
        </div>
        <div class="speed-info" id="speedInfo">0 km/h</div>
        <button class="arrival-button" id="arrivalButton" onclick="handleArrival()">
            Cheguei ao local
        </button>
        <div class="navigation-info" id="navigationInfo">
            <div class="navigation-header">
                <div class="ride-phase" id="ridePhase">BUSCANDO PASSAGEIRO</div>
                <div class="eta-info" id="etaInfo">ETA: --:--</div>
            </div>
            <div class="next-instruction" id="nextInstruction">Aguardando rota...</div>
            <div class="distance-time">
                <span id="remainingDistance">0 km</span>
                <span id="remainingTime">0 min</span>
            </div>
        </div>
        
        <script>
            // Initialize OpenStreetMap with Leaflet
            const map = L.map('map', {
                zoomControl: false,
                attributionControl: false
            }).setView([${location?.coords.latitude || -8.8390}, ${location?.coords.longitude || 13.2894}], 16);

            // Add OpenStreetMap tiles (free)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);

                         let driverMarker = null;
             let routeControl = null;
             let destinationMarker = null;
             let routeLine = null;
             let isDriverOnline = false;
             let currentSpeed = 0;
             let routeInstructions = [];
             let currentInstructionIndex = 0;
             let routeSummary = null;
             let simulationInterval = null;
             let currentPhase = 'pickup';

            // Custom driver icon
            const createDriverIcon = (online) => {
                const color = online ? '#10B981' : '#EF4444';
                return L.divIcon({
                    html: \`
                        <div style="
                            width: 40px; 
                            height: 40px; 
                            background: \${color}; 
                            border: 3px solid white; 
                            border-radius: 50%; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        ">
                            <div style="
                                width: 0; 
                                height: 0; 
                                border-left: 8px solid transparent; 
                                border-right: 8px solid transparent; 
                                border-bottom: 16px solid white;
                                transform: rotate(0deg);
                            "></div>
                        </div>
                    \`,
                    className: 'driver-marker',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });
            };

            // Create destination icon
            const createDestinationIcon = (phase) => {
                const color = phase === 'pickup' ? '#2563EB' : '#EF4444';
                const label = phase === 'pickup' ? 'P' : 'D';
                return L.divIcon({
                    html: \`
                        <div style="
                            width: 35px; 
                            height: 45px; 
                            background: \${color}; 
                            border: 2px solid white; 
                            border-radius: 50% 50% 50% 0; 
                            transform: rotate(-45deg);
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            position: relative;
                        ">
                            <div style="
                                color: white;
                                font-weight: bold;
                                font-size: 14px;
                                transform: rotate(45deg);
                            ">\${label}</div>
                        </div>
                    \`,
                    className: 'destination-marker',
                    iconSize: [35, 45],
                    iconAnchor: [17.5, 40]
                });
            };

            // Update driver location
            function updateDriverLocation(lat, lng, speed = 0) {
                if (driverMarker) {
                    map.removeLayer(driverMarker);
                }
                
                driverMarker = L.marker([lat, lng], { 
                    icon: createDriverIcon(isDriverOnline) 
                }).addTo(map);
                
                                 if (!routeControl) {
                     map.setView([lat, lng], 16);
                 }
                 
                 // More realistic speed simulation
                 if (speed > 0) {
                     currentSpeed = speed;
                 } else {
                     // Simulate realistic city driving speeds
                     currentSpeed = Math.random() * 25 + 15; // 15-40 km/h in city
                 }
                 document.getElementById('speedInfo').textContent = Math.round(currentSpeed) + ' km/h';
            }

            // Update driver status
            function updateDriverStatus(online) {
                isDriverOnline = online;
                const statusElement = document.getElementById('statusText');
                if (online) {
                    statusElement.textContent = 'ONLINE - Disponível para corridas';
                    statusElement.className = 'status-online';
                } else {
                    statusElement.textContent = 'OFFLINE - Não recebendo solicitações';
                    statusElement.className = 'status-offline';
                }
                
                // Update marker icon
                if (driverMarker) {
                    const pos = driverMarker.getLatLng();
                    map.removeLayer(driverMarker);
                    driverMarker = L.marker([pos.lat, pos.lng], { 
                        icon: createDriverIcon(online) 
                    }).addTo(map);
                }
            }

                         // SUPER SIMPLE NAVIGATION - GUARANTEED TO WORK
             function startNavigation(destinationLat, destinationLng, passengerName, phase) {
                 console.log('🚗 === STARTING NAVIGATION ===');
                 console.log('📍 Driver marker exists:', !!driverMarker);
                 console.log('🎯 Destination:', destinationLat, destinationLng);
                 console.log('🔄 Phase:', phase);
                 
                 // Safety check
                 if (!driverMarker) {
                     console.error('❌ No driver marker found!');
                     alert('Erro: Localização do motorista não encontrada');
                     return;
                 }
                 
                 try {
                     currentPhase = phase;
                     const driverPos = driverMarker.getLatLng();
                     console.log('📍 Driver position:', driverPos.lat, driverPos.lng);
                     
                     // Step 1: Clear everything first
                     console.log('🧹 Clearing previous routes...');
                     clearPreviousRoute();
                     
                     // Step 2: Create destination marker
                     console.log('🎯 Creating destination marker...');
                     destinationMarker = L.marker([destinationLat, destinationLng], { 
                         icon: createDestinationIcon(phase)
                     });
                     map.addLayer(destinationMarker);
                     console.log('✅ Destination marker added');
                     
                     // Step 3: Create route line - MULTIPLE ATTEMPTS TO GUARANTEE SUCCESS
                     console.log('🛣️ Creating route line...');
                     const routeColor = phase === 'pickup' ? '#2563EB' : '#10B981';
                     console.log('🎨 Using color:', routeColor);
                     
                     const coordinates = [
                         [driverPos.lat, driverPos.lng],
                         [destinationLat, destinationLng]
                     ];
                     console.log('📐 Route coordinates:', coordinates);
                     
                     // Method 1: Standard polyline
                     try {
                         routeLine = L.polyline(coordinates, {
                             color: routeColor,
                             weight: 8,
                             opacity: 0.9,
                             lineCap: 'round',
                             lineJoin: 'round'
                         });
                         map.addLayer(routeLine);
                         console.log('✅ Method 1: Standard polyline added');
                     } catch (e) {
                         console.error('❌ Method 1 failed:', e);
                     }
                     
                     // Method 2: Backup thick line
                     try {
                         const backupLine = L.polyline(coordinates, {
                             color: routeColor,
                             weight: 12,
                             opacity: 0.7
                         }).addTo(map);
                         console.log('✅ Method 2: Backup line added');
                     } catch (e) {
                         console.error('❌ Method 2 failed:', e);
                     }
                     
                     // Method 3: Simple line with different approach
                     try {
                         const simpleLine = new L.Polyline(coordinates, {
                             color: routeColor,
                             weight: 6,
                             opacity: 1.0
                         });
                         simpleLine.addTo(map);
                         console.log('✅ Method 3: Simple line added');
                     } catch (e) {
                         console.error('❌ Method 3 failed:', e);
                     }
                     
                     console.log('🛣️ Route line creation attempts completed');
                     
                     // Step 4: Calculate distance and time
                     const distance = driverPos.distanceTo(L.latLng(destinationLat, destinationLng));
                     const estimatedTime = Math.round(distance / 1000 * 2.5);
                     
                     routeSummary = {
                         totalDistance: distance,
                         totalTime: estimatedTime * 60
                     };
                     
                     console.log('📊 Route summary:', routeSummary);
                     
                     // Step 5: Setup instructions
                     routeInstructions = [
                         { text: \`🚗 Siga em direção a \${phase === 'pickup' ? passengerName : 'destino'}\` },
                         { text: '➡️ Continue na rota principal' },
                         { text: '🎯 Mantenha-se na direção indicada' },
                         { text: '🏁 Aproximando-se do destino' },
                         { text: '✅ Você chegou ao destino!' }
                     ];
                     currentInstructionIndex = 0;
                     
                     // Step 6: Update UI
                     console.log('🖥️ Updating navigation UI...');
                     updateNavigationUI(phase, passengerName);
                     
                     // Step 7: Show navigation elements
                     const arrivalBtn = document.getElementById('arrivalButton');
                     const navInfo = document.getElementById('navigationInfo');
                     
                     if (arrivalBtn) arrivalBtn.style.display = 'block';
                     if (navInfo) navInfo.style.display = 'block';
                     console.log('✅ Navigation UI elements shown');
                     
                     // Step 8: Zoom to show route
                     console.log('🔍 Fitting map to route...');
                     setTimeout(() => {
                         const bounds = L.latLngBounds(coordinates);
                         map.fitBounds(bounds, { 
                             padding: [50, 50],
                             maxZoom: 13
                         });
                         console.log('✅ Map fitted to bounds');
                     }, 500);
                     
                     // Step 9: Start simulation
                     startTurnByTurnSimulation();
                     
                     console.log('🎉 === NAVIGATION SETUP COMPLETE ===');
                     
                 } catch (error) {
                     console.error('❌ Error in startNavigation:', error);
                     alert('Erro na navegação: ' + error.message);
                 }
             }

             function clearPreviousRoute() {
                 if (routeControl) {
                     map.removeControl(routeControl);
                     routeControl = null;
                 }
                 if (destinationMarker) {
                     map.removeLayer(destinationMarker);
                     destinationMarker = null;
                 }
                 if (routeLine) {
                     map.removeLayer(routeLine);
                     routeLine = null;
                 }
             }





            function updateNavigationUI(phase, passengerName) {
                const phaseElement = document.getElementById('ridePhase');
                const instructionElement = document.getElementById('nextInstruction');
                
                if (phase === 'pickup') {
                    phaseElement.textContent = 'BUSCANDO PASSAGEIRO';
                    instructionElement.textContent = \`Navegando até \${passengerName}\`;
                } else {
                    phaseElement.textContent = 'LEVANDO PASSAGEIRO';
                    instructionElement.textContent = 'Navegando para o destino';
                }
                
                updateRouteInfo();
            }

            function updateRouteInfo() {
                if (!routeSummary) return;
                
                const distance = (routeSummary.totalDistance / 1000).toFixed(1);
                const duration = Math.round(routeSummary.totalTime / 60);
                const eta = new Date(Date.now() + routeSummary.totalTime * 1000);
                
                document.getElementById('remainingDistance').textContent = distance + ' km';
                document.getElementById('remainingTime').textContent = duration + ' min';
                document.getElementById('etaInfo').textContent = 'ETA: ' + eta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }

                         function startTurnByTurnSimulation() {
                 if (simulationInterval) {
                     clearInterval(simulationInterval);
                 }
                 
                 console.log('Starting turn-by-turn simulation with', routeInstructions.length, 'instructions');
                 
                 // Simulate progress every 5 seconds for more realistic experience
                 simulationInterval = setInterval(() => {
                     if (currentInstructionIndex < routeInstructions.length) {
                         const instruction = routeInstructions[currentInstructionIndex];
                         const instructionText = getInstructionText(instruction);
                         
                         console.log('Current instruction:', instructionText);
                         document.getElementById('nextInstruction').textContent = instructionText;
                         
                         // Simulate reducing distance and time
                         if (routeSummary) {
                             const totalSteps = routeInstructions.length;
                             const progress = (currentInstructionIndex + 1) / totalSteps;
                             const remainingDistance = routeSummary.totalDistance * (1 - progress);
                             const remainingDuration = routeSummary.totalTime * (1 - progress);
                             
                             document.getElementById('remainingDistance').textContent = (remainingDistance / 1000).toFixed(1) + ' km';
                             document.getElementById('remainingTime').textContent = Math.round(remainingDuration / 60) + ' min';
                             
                             const eta = new Date(Date.now() + remainingDuration * 1000);
                             document.getElementById('etaInfo').textContent = 'ETA: ' + eta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                             
                             // Simulate speed changes
                             const simulatedSpeed = 30 + Math.random() * 40; // 30-70 km/h
                             document.getElementById('speedInfo').textContent = Math.round(simulatedSpeed) + ' km/h';
                         }
                         
                         currentInstructionIndex++;
                     } else {
                         // Route completed - show arrival notification
                         clearInterval(simulationInterval);
                         document.getElementById('nextInstruction').textContent = 'Você chegou ao destino!';
                         document.getElementById('remainingDistance').textContent = '0 km';
                         document.getElementById('remainingTime').textContent = '0 min';
                         
                         // Flash the arrival button
                         const arrivalBtn = document.getElementById('arrivalButton');
                         arrivalBtn.style.background = '#F59E0B';
                         arrivalBtn.textContent = 'CHEGOU! Confirmar';
                         setTimeout(() => {
                             arrivalBtn.style.background = '#10B981';
                             arrivalBtn.textContent = 'Cheguei ao local';
                         }, 2000);
                     }
                 }, 5000); // Every 5 seconds for more realistic timing
             }

            function getInstructionText(instruction) {
                const text = instruction.text || instruction.instruction || '';
                
                // Translate common directions to Portuguese
                let translatedText = text
                    .replace(/Continue on/gi, 'Continue em')
                    .replace(/Turn right/gi, 'Vire à direita')
                    .replace(/Turn left/gi, 'Vire à esquerda')
                    .replace(/Slight right/gi, 'Mantenha-se à direita')
                    .replace(/Slight left/gi, 'Mantenha-se à esquerda')
                    .replace(/Sharp right/gi, 'Vire acentuadamente à direita')
                    .replace(/Sharp left/gi, 'Vire acentuadamente à esquerda')
                    .replace(/Head/gi, 'Siga')
                    .replace(/Arrive at/gi, 'Chegue ao')
                    .replace(/destination/gi, 'destino')
                    .replace(/straight/gi, 'em frente')
                    .replace(/onto/gi, 'para');
                
                return translatedText || 'Continue em frente';
            }

            function handleArrival() {
                // Send message to React Native
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'arrival',
                    phase: currentPhase
                }));
            }

                         // Clear navigation
             function clearNavigation() {
                 clearPreviousRoute();
                 
                 if (simulationInterval) {
                     clearInterval(simulationInterval);
                     simulationInterval = null;
                 }
                 document.getElementById('navigationInfo').style.display = 'none';
                 document.getElementById('arrivalButton').style.display = 'none';
                 routeInstructions = [];
                 currentInstructionIndex = 0;
                 routeSummary = null;
             }

                         // Initialize driver marker if location is available
             if (${location?.coords.latitude || 'false'}) {
                 console.log('Initializing driver location...');
                 updateDriverLocation(${location?.coords.latitude || 0}, ${location?.coords.longitude || 0});
             }
             
             // Debug function to test line creation
             function testCreateLine() {
                 console.log('🧪 === TESTING LINE CREATION ===');
                 
                 try {
                     if (!driverMarker) {
                         console.error('❌ No driver marker for test!');
                         alert('Erro: Marker do motorista não encontrado');
                         return;
                     }
                     
                     const driverPos = driverMarker.getLatLng();
                     const testDestination = [driverPos.lat + 0.01, driverPos.lng + 0.01];
                     
                     console.log('📍 Creating test line from', driverPos.lat, driverPos.lng, 'to', testDestination);
                     
                     // Create bright red test line
                     const testLine = L.polyline([
                         [driverPos.lat, driverPos.lng],
                         testDestination
                     ], {
                         color: '#FF0000',
                         weight: 15,
                         opacity: 1.0,
                         lineCap: 'round'
                     });
                     
                     console.log('🛣️ Test line object created');
                     map.addLayer(testLine);
                     console.log('✅ Test line added to map successfully!');
                     
                     // Zoom to show the test line
                     const bounds = L.latLngBounds([
                         [driverPos.lat, driverPos.lng],
                         testDestination
                     ]);
                     map.fitBounds(bounds, { padding: [50, 50] });
                     
                     // Remove after 5 seconds
                     setTimeout(() => {
                         map.removeLayer(testLine);
                         console.log('🗑️ Test line removed');
                     }, 5000);
                     
                 } catch (error) {
                     console.error('❌ Error creating test line:', error);
                     alert('Erro no teste: ' + error.message);
                 }
             }
             
             // Make test function globally available
             window.testCreateLine = testCreateLine;

             // Listen for messages from React Native
             window.addEventListener('message', function(event) {
                 try {
                     console.log('Received message:', event.data);
                     eval(event.data);
                 } catch (e) {
                     console.error('Error executing message:', e);
                 }
             });
        </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.driverInfo}>
            <Text style={styles.headerTitle}>Motorista</Text>
            <Text style={styles.headerSubtitle}>
              {driverProfile?.nome || 'Carregando...'}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.statusButton, isOnline ? styles.onlineButton : styles.offlineButton]}
          onPress={toggleOnlineStatus}
          disabled={navigationMode}
        >
          <MaterialIcons 
            name={isOnline ? "radio-button-checked" : "radio-button-unchecked"} 
            size={18} 
            color="#ffffff" 
          />
          <Text style={styles.statusButtonText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Ride Info */}
      {activeRide && navigationMode && (
        <View style={styles.activeRideInfo}>
          <View style={styles.rideInfoHeader}>
            <MaterialIcons 
              name={ridePhase === 'pickup' ? "person-pin" : "place"} 
              size={20} 
              color={ridePhase === 'pickup' ? "#2563EB" : "#10B981"} 
            />
            <Text style={styles.ridePhaseText}>
              {ridePhase === 'pickup' ? 'BUSCANDO PASSAGEIRO' : 'LEVANDO PASSAGEIRO'}
            </Text>
            <Text style={styles.fareText}>{activeRide.fare} AOA</Text>
          </View>
          <Text style={styles.passengerNameText}>{activeRide.passengerName}</Text>
          <Text style={styles.destinationText}>
            {ridePhase === 'pickup' ? activeRide.pickup.address : activeRide.destination.address}
          </Text>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: openStreetMapHTML }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          bounces={false}
          scrollEnabled={false}
          onError={(error) => console.error('WebView error:', error)}
          onLoad={() => {
            console.log('🌐 WebView loaded successfully');
            // Wait a bit for map to initialize, then update location
            setTimeout(() => {
              if (location) {
                updateMapLocation(location);
              }
            }, 2000);
          }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'arrival') {
                simulateArrival();
              }
            } catch (error) {
              console.error('Error parsing WebView message:', error);
            }
          }}
        />
      </View>

      {/* Floating Action Button for Centering */}
      <TouchableOpacity 
        style={[styles.centerLocationButton, { bottom: insets.bottom + (navigationMode ? 180 : 100) }]}
        onPress={() => {
          if (webViewRef.current && location) {
            const script = `
              if (typeof updateDriverLocation === 'function') {
                updateDriverLocation(${location.coords.latitude}, ${location.coords.longitude});
              }
            `;
            webViewRef.current.postMessage(script);
          }
        }}
      >
        <MaterialIcons name="my-location" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Test Navigation Button (only when not in navigation mode) */}
      {!navigationMode && isOnline && location && (
        <TouchableOpacity 
          style={[styles.testNavigationButton, { bottom: insets.bottom + 170 }]}
          onPress={() => {
            // First test if we can create a simple line
            if (webViewRef.current) {
              const script = `
                console.log('Testing line creation...');
                if (typeof testCreateLine === 'function') {
                  testCreateLine();
                } else {
                  console.error('testCreateLine function not available');
                }
              `;
              webViewRef.current.postMessage(script);
            }
            
            // Then start actual navigation test
            setTimeout(() => {
              const testDestination = {
                lat: location.coords.latitude + 0.01,
                lng: location.coords.longitude + 0.01,
              };
              
              const testRide = {
                id: 'test_ride',
                passengerName: 'Passageiro Teste',
                pickup: testDestination,
                destination: {
                  lat: location.coords.latitude + 0.02,
                  lng: location.coords.longitude + 0.02,
                  address: 'Destino Teste'
                },
                fare: 500,
                paymentMethod: 'Teste'
              };
              
              setActiveRide(testRide);
              setNavigationMode(true);
              setRidePhase('pickup');
              
              Toast.show({
                type: "info",
                text1: "Teste de Navegação",
                text2: "Simulando corrida para teste",
              });
            }, 2000);
          }}
        >
          <MaterialIcons name="navigation" size={20} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Debug Button */}
      {!navigationMode && location && (
        <TouchableOpacity 
          style={[styles.debugButton, { bottom: insets.bottom + 240 }]}
          onPress={() => {
            if (webViewRef.current) {
              const script = `
                console.log('=== DEBUG INFO ===');
                console.log('Map object:', typeof map);
                console.log('Driver marker:', !!driverMarker);
                console.log('L.polyline function:', typeof L.polyline);
                console.log('Current location:', driverMarker ? driverMarker.getLatLng() : 'No driver marker');
                
                // Force create a test line
                if (driverMarker) {
                  const pos = driverMarker.getLatLng();
                  const testLine = L.polyline([
                    [pos.lat, pos.lng],
                    [pos.lat + 0.005, pos.lng + 0.005]
                  ], {
                    color: '#FF0000',
                    weight: 5,
                    opacity: 1.0
                  });
                  
                  console.log('Adding test line to map...');
                  testLine.addTo(map);
                  console.log('Test line added successfully');
                  
                  setTimeout(() => {
                    map.removeLayer(testLine);
                    console.log('Test line removed');
                  }, 3000);
                }
              `;
              webViewRef.current.postMessage(script);
            }
          }}
        >
          <MaterialIcons name="bug-report" size={16} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Navigation Controls */}
      {navigationMode && (
        <View style={[styles.navigationControls, { bottom: insets.bottom + 20 }]}>
          <TouchableOpacity 
            style={styles.cancelRideButton}
            onPress={cancelRide}
          >
            <MaterialIcons name="close" size={20} color="#ffffff" />
            <Text style={styles.cancelRideText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.arrivalButton}
            onPress={simulateArrival}
          >
            <MaterialIcons name="place" size={20} color="#ffffff" />
            <Text style={styles.arrivalButtonText}>
              {ridePhase === 'pickup' ? 'Cheguei' : 'Finalizar'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            {currentRequest && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderIcon}>
                    <MaterialIcons name="local-taxi" size={32} color="#2563EB" />
                  </View>
                  <Text style={styles.modalTitle}>Nova Solicitação!</Text>
                  <Text style={styles.modalSubtitle}>Passageiro aguardando</Text>
                </View>

                <View style={styles.passengerSection}>
                  <MaterialIcons name="person" size={24} color="#1F2937" />
                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName}>{currentRequest.passengerName}</Text>
                    <Text style={styles.requestTime}>
                      Solicitado agora • {currentRequest.paymentMethod}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeSection}>
                  <View style={styles.locationRow}>
                    <MaterialIcons name="radio-button-checked" size={20} color="#10B981" />
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationLabel}>ORIGEM</Text>
                      <Text style={styles.locationAddress}>{currentRequest.pickup.address}</Text>
                    </View>
                  </View>

                  <View style={styles.routeLine} />

                  <View style={styles.locationRow}>
                    <MaterialIcons name="place" size={20} color="#EF4444" />
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationLabel}>DESTINO</Text>
                      <Text style={styles.locationAddress}>{currentRequest.destination.address}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.tripDetails}>
                  <View style={styles.detailCard}>
                    <MaterialIcons name="straighten" size={20} color="#6B7280" />
                    <Text style={styles.detailLabel}>Distância</Text>
                    <Text style={styles.detailValue}>{currentRequest.distance} km</Text>
                  </View>
                  <View style={styles.detailCard}>
                    <MaterialIcons name="access-time" size={20} color="#6B7280" />
                    <Text style={styles.detailLabel}>Tempo</Text>
                    <Text style={styles.detailValue}>{currentRequest.estimatedTime} min</Text>
                  </View>
                  <View style={styles.detailCard}>
                    <MaterialIcons name="attach-money" size={20} color="#6B7280" />
                    <Text style={styles.detailLabel}>Valor</Text>
                    <Text style={styles.detailValue}>{currentRequest.fare} AOA</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.rejectButton} 
                    onPress={rejectRequest}
                  >
                    <MaterialIcons name="close" size={20} color="#EF4444" />
                    <Text style={styles.rejectButtonText}>Recusar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.acceptButton} 
                    onPress={acceptRequest}
                  >
                    <MaterialIcons name="check" size={20} color="#ffffff" />
                    <Text style={styles.acceptButtonText}>Aceitar</Text>
                  </TouchableOpacity>
                </View>
              </>
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
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerLeft: {
    flex: 1,
  },
  driverInfo: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    minWidth: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  onlineButton: {
    backgroundColor: '#10B981',
  },
  offlineButton: {
    backgroundColor: '#EF4444',
  },
  activeRideInfo: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rideInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ridePhaseText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    marginLeft: 8,
    textTransform: 'uppercase',
    flex: 1,
  },
  fareText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  passengerNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  destinationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centerLocationButton: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  testNavigationButton: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  debugButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  navigationControls: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  cancelRideButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelRideText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  arrivalButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  arrivalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
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
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalHeaderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  passengerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  passengerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  requestTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  routeSection: {
    marginBottom: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#D1D5DB',
    marginLeft: 9,
    marginVertical: 4,
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  detailCard: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 6,
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
});