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
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import LocalDatabase from '../services/localDatabase';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

// HERE Maps API Configuration
const HERE_API_KEY = 'bMtOJnfPZwG3fyrgS24Jif6dt3MXbOoq6H4X4KqxZKY';

export default function DriverMapScreen({ navigation, route }) {
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [navigationMode, setNavigationMode] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState('');
  const [remainingDistance, setRemainingDistance] = useState('');
  const [remainingTime, setRemainingTime] = useState('');
  const [ridePhase, setRidePhase] = useState('pickup'); // 'pickup' or 'dropoff'
  const webViewRef = useRef(null);

  useEffect(() => {
    initializeDriver();
    requestLocationPermission();
    
    // Check if we have an active ride from navigation params
    if (route?.params?.activeRide) {
      setActiveRide(route.params.activeRide);
      setNavigationMode(true);
      setRidePhase(route.params.navigateTo || 'pickup');
    }
  }, []);

  useEffect(() => {
    if (activeRide && location && webViewRef.current) {
      startNavigationToDestination();
    }
  }, [activeRide, location]);

  const initializeDriver = async () => {
    try {
      const profile = await LocalDatabase.getDriverProfile();
      const onlineStatus = await LocalDatabase.getDriverOnlineStatus();
      
      if (profile) {
        setDriverProfile(profile);
        setIsOnline(onlineStatus);
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
        }
      );
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const updateMapLocation = (newLocation) => {
    if (webViewRef.current && newLocation) {
      const script = `
        if (typeof updateDriverLocation === 'function') {
          updateDriverLocation(${newLocation.coords.latitude}, ${newLocation.coords.longitude});
        }
      `;
      webViewRef.current.postMessage(script);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
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
            onPress: () => {
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
                type: "success",
                text1: "Corrida concluída!",
                text2: `Você ganhou ${activeRide.fare} AOA`,
              });
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

  // HERE Maps HTML content with navigation mode
  const hereMapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Driver Navigation</title>
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
                font-family: Arial, sans-serif;
            }
            #mapContainer { 
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
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                text-align: center;
            }
            .status-online {
                color: #10B981;
                font-weight: bold;
            }
            .status-offline {
                color: #EF4444;
                font-weight: bold;
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
                padding: 12px 18px;
                border-radius: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                font-weight: bold;
                font-size: 16px;
                color: #1F2937;
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
            }
            .arrival-button:hover {
                background: #059669;
            }
        </style>
    </head>
    <body>
        <div id="mapContainer">
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
        </div>
        
        <script>
            // Initialize HERE Maps
            const platform = new H.service.Platform({
                'apikey': '${HERE_API_KEY}'
            });

            const defaultLayers = platform.createDefaultLayers();
            
            const map = new H.Map(
              document.getElementById('mapContainer'),
              defaultLayers.vector.normal.map,
              {
                zoom: 16,
                center: { lat: ${location?.coords.latitude || -8.8390}, lng: ${location?.coords.longitude || 13.2894} },
                pixelRatio: window.devicePixelRatio || 1
              }
            );

            // Enable map interaction (pan, zoom)
            const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
            const ui = H.ui.UI.createDefault(map, defaultLayers);
            
            // Remove default UI controls and add custom ones
            ui.removeControl('mapsettings');
            ui.removeControl('scalebar');
            ui.removeControl('zoom');
            
            window.addEventListener('resize', () => map.getViewPort().resize());

            let driverMarker = null;
            let routeGroup = null;
            let isDriverOnline = false;
            let currentSpeed = 0;

            // Create driver marker
            function createDriverMarker(lat, lng) {
                if (driverMarker) {
                    map.removeObject(driverMarker);
                }
                
                const driverIcon = new H.map.Icon(
                    'data:image/svg+xml;base64,' + btoa(\`
                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="20" r="18" fill="\${isDriverOnline ? '#10B981' : '#EF4444'}" stroke="white" stroke-width="3"/>
                            <path d="M20 8 L28 32 L20 28 L12 32 Z" fill="white"/>
                        </svg>
                    \`),
                    { size: { w: 40, h: 40 }, anchor: { x: 20, y: 20 } }
                );

                driverMarker = new H.map.Marker({ lat, lng }, { icon: driverIcon });
                map.addObject(driverMarker);
                
                // Center map on driver
                map.getViewModel().setLookAtData({ position: { lat, lng }, zoom: 16 });
            }

            // Update driver location
            function updateDriverLocation(lat, lng, speed = 0) {
                createDriverMarker(lat, lng);
                currentSpeed = speed || 0;
                document.getElementById('speedInfo').textContent = Math.round(currentSpeed * 3.6) + ' km/h';
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
                
                // Update marker color
                if (driverMarker) {
                    const currentPos = driverMarker.getGeometry();
                    createDriverMarker(currentPos.lat, currentPos.lng);
                }
            }

            let routeInstructions = [];
            let currentInstructionIndex = 0;
            let routeSummary = null;
            let simulationInterval = null;
            let currentPhase = 'pickup';

            // Start navigation to destination
            function startNavigation(destinationLat, destinationLng, passengerName, phase) {
                if (!driverMarker) return;
                
                currentPhase = phase;
                const driverPos = driverMarker.getGeometry();
                const router = platform.getRoutingService(null, 8);
                
                const routingParameters = {
                    'routingMode': 'fast',
                    'transportMode': 'car',
                    'origin': driverPos.lat + ',' + driverPos.lng,
                    'destination': destinationLat + ',' + destinationLng,
                    'return': 'polyline,turnByTurnActions,summary'
                };

                router.calculateRoute(routingParameters, (result) => {
                    if (result.routes.length) {
                        const route = result.routes[0];
                        routeSummary = route.sections[0].summary;
                        routeInstructions = route.sections[0].actions || [];
                        currentInstructionIndex = 0;
                        
                        // Clear previous route
                        if (routeGroup) {
                            map.removeObject(routeGroup);
                        }
                        
                        routeGroup = new H.map.Group();
                        
                        // Add route polyline
                        const lineString = H.geo.LineString.fromFlexiblePolyline(route.sections[0].polyline);
                        const routeLine = new H.map.Polyline(lineString, {
                            style: {
                                strokeColor: phase === 'pickup' ? '#2563EB' : '#10B981',
                                lineWidth: 8,
                                lineCap: 'round',
                                lineJoin: 'round'
                            }
                        });
                        
                        // Add destination marker
                        const destIcon = new H.map.Icon(
                            'data:image/svg+xml;base64,' + btoa(\`
                                <svg width="35" height="45" viewBox="0 0 35 45" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.5 0C7.8 0 0 7.8 0 17.5c0 17.5 17.5 27.5 17.5 27.5s17.5-10 17.5-27.5C35 7.8 27.2 0 17.5 0z" fill="\${phase === 'pickup' ? '#2563EB' : '#EF4444'}"/>
                                    <circle cx="17.5" cy="17.5" r="10" fill="white"/>
                                    <text x="17.5" y="22" text-anchor="middle" fill="\${phase === 'pickup' ? '#2563EB' : '#EF4444'}" font-size="12" font-weight="bold">\${phase === 'pickup' ? 'P' : 'D'}</text>
                                </svg>
                            \`),
                            { size: { w: 35, h: 45 }, anchor: { x: 17.5, y: 45 } }
                        );
                        
                        const destMarker = new H.map.Marker({ lat: destinationLat, lng: destinationLng }, { icon: destIcon });
                        
                        routeGroup.addObjects([routeLine, destMarker]);
                        map.addObject(routeGroup);
                        
                        // Update navigation UI
                        updateNavigationUI(phase, passengerName);
                        
                        // Start turn-by-turn simulation
                        startTurnByTurnSimulation();
                        
                        // Show arrival button and navigation info
                        document.getElementById('arrivalButton').style.display = 'block';
                        document.getElementById('navigationInfo').style.display = 'block';
                        
                        // Fit view to show route
                        setTimeout(() => {
                            map.getViewModel().setLookAtData({ bounds: routeGroup.getBoundingBox(), padding: 50 });
                        }, 500);
                    }
                }, (error) => {
                    console.error('Routing error:', error);
                });
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
                
                const distance = (routeSummary.length / 1000).toFixed(1);
                const duration = Math.round(routeSummary.duration / 60);
                const eta = new Date(Date.now() + routeSummary.duration * 1000);
                
                document.getElementById('remainingDistance').textContent = distance + ' km';
                document.getElementById('remainingTime').textContent = duration + ' min';
                document.getElementById('etaInfo').textContent = 'ETA: ' + eta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }

            function startTurnByTurnSimulation() {
                if (simulationInterval) {
                    clearInterval(simulationInterval);
                }
                
                // Simulate progress every 3 seconds
                simulationInterval = setInterval(() => {
                    if (currentInstructionIndex < routeInstructions.length) {
                        const instruction = routeInstructions[currentInstructionIndex];
                        const instructionText = getInstructionText(instruction);
                        
                        document.getElementById('nextInstruction').textContent = instructionText;
                        
                        // Simulate reducing distance and time
                        if (routeSummary) {
                            const progress = currentInstructionIndex / routeInstructions.length;
                            const remainingDistance = routeSummary.length * (1 - progress);
                            const remainingDuration = routeSummary.duration * (1 - progress);
                            
                            document.getElementById('remainingDistance').textContent = (remainingDistance / 1000).toFixed(1) + ' km';
                            document.getElementById('remainingTime').textContent = Math.round(remainingDuration / 60) + ' min';
                            
                            const eta = new Date(Date.now() + remainingDuration * 1000);
                            document.getElementById('etaInfo').textContent = 'ETA: ' + eta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
                        }, 1000);
                    }
                }, 3000);
            }

            function getInstructionText(action) {
                const direction = action.direction || 'straight';
                const roadName = action.roadName || 'via';
                
                const instructions = {
                    'straight': \`Continue em frente em \${roadName}\`,
                    'right': \`Vire à direita em \${roadName}\`,
                    'left': \`Vire à esquerda em \${roadName}\`,
                    'slightRight': \`Mantenha-se à direita em \${roadName}\`,
                    'slightLeft': \`Mantenha-se à esquerda em \${roadName}\`,
                    'sharpRight': \`Vire acentuadamente à direita em \${roadName}\`,
                    'sharpLeft': \`Vire acentuadamente à esquerda em \${roadName}\`,
                    'uTurn': \`Faça retorno em \${roadName}\`,
                    'roundabout': \`Entre na rotatória e siga em \${roadName}\`,
                };
                
                return instructions[direction] || \`Continue em \${roadName}\`;
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
                if (routeGroup) {
                    map.removeObject(routeGroup);
                    routeGroup = null;
                }
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
                createDriverMarker(${location?.coords.latitude || 0}, ${location?.coords.longitude || 0});
            }

            // Listen for messages from React Native
            window.addEventListener('message', function(event) {
                try {
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.openDrawer?.() || navigation.goBack()}
        >
          <Ionicons name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Motorista</Text>
          <Text style={styles.headerSubtitle}>
            {driverProfile?.nome || 'Carregando...'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.statusButton, isOnline ? styles.onlineButton : styles.offlineButton]}
          onPress={toggleOnlineStatus}
          disabled={navigationMode}
        >
          <MaterialIcons 
            name={isOnline ? "radio-button-checked" : "radio-button-unchecked"} 
            size={20} 
            color="#ffffff" 
          />
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
          source={{ html: hereMapHTML }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          bounces={false}
          scrollEnabled={false}
          onError={(error) => console.error('WebView error:', error)}
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

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {!navigationMode ? (
          <>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => navigation.navigate('DriverRequests')}
            >
              <MaterialIcons name="assignment" size={24} color="#2563EB" />
              <Text style={styles.controlButtonText}>Solicitações</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
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
              <MaterialIcons name="my-location" size={24} color="#2563EB" />
              <Text style={styles.controlButtonText}>Centralizar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => navigation.navigate('DriverProfile')}
            >
              <MaterialIcons name="person" size={24} color="#2563EB" />
              <Text style={styles.controlButtonText}>Perfil</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.controlButton, styles.cancelButton]}
              onPress={cancelRide}
            >
              <MaterialIcons name="close" size={24} color="#EF4444" />
              <Text style={[styles.controlButtonText, styles.cancelButtonText]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
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
              <MaterialIcons name="my-location" size={24} color="#2563EB" />
              <Text style={styles.controlButtonText}>Centralizar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlButton, styles.arrivalButton]}
              onPress={simulateArrival}
            >
              <MaterialIcons name="place" size={24} color="#10B981" />
              <Text style={[styles.controlButtonText, styles.arrivalButtonText]}>
                {ridePhase === 'pickup' ? 'Cheguei' : 'Finalizar'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1F2937',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center',
  },
  onlineButton: {
    backgroundColor: '#10B981',
  },
  offlineButton: {
    backgroundColor: '#EF4444',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomControls: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 4,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButtonText: {
    color: '#EF4444',
  },
  arrivalButton: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  arrivalButtonText: {
    color: '#10B981',
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
    marginBottom: 8,
  },
  ridePhaseText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    marginLeft: 8,
    textTransform: 'uppercase',
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
});