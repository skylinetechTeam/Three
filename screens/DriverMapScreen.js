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

export default function DriverMapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    initializeDriver();
    requestLocationPermission();
  }, []);

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
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                display: none;
            }
            .speed-info {
                position: absolute;
                bottom: 120px;
                right: 20px;
                background: rgba(255, 255, 255, 0.95);
                padding: 10px 15px;
                border-radius: 25px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div id="mapContainer">
            <div class="driver-status">
                <div id="statusText" class="status-offline">OFFLINE - Não recebendo solicitações</div>
            </div>
            <div class="speed-info" id="speedInfo">0 km/h</div>
            <div class="navigation-info" id="navigationInfo">
                <div id="nextInstruction">Aguardando rota...</div>
                <div id="distanceTime">0 km • 0 min</div>
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

            // Start navigation to destination
            function startNavigation(destinationLat, destinationLng, passengerName) {
                if (!driverMarker) return;
                
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
                        
                        // Clear previous route
                        if (routeGroup) {
                            map.removeObject(routeGroup);
                        }
                        
                        routeGroup = new H.map.Group();
                        
                        // Add route polyline
                        const lineString = H.geo.LineString.fromFlexiblePolyline(route.sections[0].polyline);
                        const routeLine = new H.map.Polyline(lineString, {
                            style: {
                                strokeColor: '#2563EB',
                                lineWidth: 6,
                                lineCap: 'round',
                                lineJoin: 'round'
                            }
                        });
                        
                        // Add destination marker
                        const destIcon = new H.map.Icon(
                            'data:image/svg+xml;base64,' + btoa(\`
                                <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 0C6.7 0 0 6.7 0 15c0 15 15 25 15 25s15-10 15-25C30 6.7 23.3 0 15 0z" fill="#EF4444"/>
                                    <circle cx="15" cy="15" r="8" fill="white"/>
                                </svg>
                            \`),
                            { size: { w: 30, h: 40 }, anchor: { x: 15, y: 40 } }
                        );
                        
                        const destMarker = new H.map.Marker({ lat: destinationLat, lng: destinationLng }, { icon: destIcon });
                        
                        routeGroup.addObjects([routeLine, destMarker]);
                        map.addObject(routeGroup);
                        
                        // Show navigation info
                        const navInfo = document.getElementById('navigationInfo');
                        const summary = route.sections[0].summary;
                        const distance = (summary.length / 1000).toFixed(1);
                        const duration = Math.round(summary.duration / 60);
                        
                        document.getElementById('nextInstruction').textContent = 'Navegando até ' + (passengerName || 'destino');
                        document.getElementById('distanceTime').textContent = distance + ' km • ' + duration + ' min';
                        navInfo.style.display = 'block';
                        
                        // Fit view to show route
                        map.getViewModel().setLookAtData({ bounds: routeGroup.getBoundingBox() });
                    }
                }, (error) => {
                    console.error('Routing error:', error);
                });
            }

            // Clear navigation
            function clearNavigation() {
                if (routeGroup) {
                    map.removeObject(routeGroup);
                    routeGroup = null;
                }
                document.getElementById('navigationInfo').style.display = 'none';
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
        />
      </View>

      {/* Floating Action Button for Centering */}
      <TouchableOpacity 
        style={styles.centerLocationButton}
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
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centerLocationButton: {
    position: 'absolute',
    bottom: 100,
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
});