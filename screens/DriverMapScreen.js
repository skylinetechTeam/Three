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
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

export default function DriverMapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    initializeDriver();
    requestLocationPermission();
    
    // Simular solicitações quando estiver online
    const requestInterval = setInterval(() => {
      if (isOnline && !showRequestModal && Math.random() > 0.7) {
        simulateNewRequest();
      }
    }, 15000); // A cada 15 segundos

    return () => clearInterval(requestInterval);
  }, [isOnline, showRequestModal]);

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

  const simulateNewRequest = () => {
    const mockRequest = {
      id: `req_${Date.now()}`,
      passengerName: `${['Ana', 'João', 'Maria', 'Carlos', 'Sofia', 'Pedro'][Math.floor(Math.random() * 6)]} ${['Silva', 'Santos', 'Costa', 'Ferreira', 'Oliveira'][Math.floor(Math.random() * 5)]}`,
      pickup: {
        address: ['Rua da Liberdade, 123', 'Avenida Marginal, 456', 'Rua do Comércio, 789', 'Largo do Ambiente, 321'][Math.floor(Math.random() * 4)],
        lat: location?.coords.latitude + (Math.random() - 0.5) * 0.01 || -8.8390,
        lng: location?.coords.longitude + (Math.random() - 0.5) * 0.01 || 13.2894,
      },
      destination: {
        address: ['Shopping Belas, Talatona', 'Aeroporto Internacional, Luanda', 'Universidade Agostinho Neto', 'Hospital Américo Boavida'][Math.floor(Math.random() * 4)],
        lat: location?.coords.latitude + (Math.random() - 0.5) * 0.02 || -8.8390,
        lng: location?.coords.longitude + (Math.random() - 0.5) * 0.02 || 13.2894,
      },
      fare: Math.floor(Math.random() * 800 + 300), // 300-1100 AOA
      distance: (Math.random() * 15 + 2).toFixed(1), // 2-17 km
      estimatedTime: Math.floor(Math.random() * 35 + 8), // 8-43 min
      paymentMethod: Math.random() > 0.6 ? 'Dinheiro' : 'Cartão',
      requestTime: new Date().toISOString(),
      status: 'pending'
    };

    setCurrentRequest(mockRequest);
    setShowRequestModal(true);
  };

  const acceptRequest = () => {
    if (currentRequest) {
      Toast.show({
        type: "success",
        text1: "Corrida aceita!",
        text2: `Navegando até ${currentRequest.passengerName}`,
      });
      
      // Aqui você pode implementar a navegação para o passageiro
      setShowRequestModal(false);
      setCurrentRequest(null);
    }
  };

  const rejectRequest = () => {
    Toast.show({
      type: "info",
      text1: "Corrida recusada",
      text2: "Aguardando nova solicitação...",
    });
    setShowRequestModal(false);
    setCurrentRequest(null);
  };

  // OpenStreetMap with Leaflet (Free)
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
                padding: 16px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                z-index: 1000;
                display: none;
                backdrop-filter: blur(10px);
            }
            .speed-info {
                position: absolute;
                bottom: 120px;
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
            .leaflet-routing-container {
                display: none;
            }
            .leaflet-control-zoom {
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
        <div class="navigation-info" id="navigationInfo">
            <div id="nextInstruction">Aguardando rota...</div>
            <div id="distanceTime">0 km • 0 min</div>
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
            let isDriverOnline = false;
            let currentSpeed = 0;

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
            const destinationIcon = L.divIcon({
                html: \`
                    <div style="
                        width: 30px; 
                        height: 40px; 
                        background: #EF4444; 
                        border: 2px solid white; 
                        border-radius: 50% 50% 50% 0; 
                        transform: rotate(-45deg);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div style="
                            width: 12px;
                            height: 12px;
                            background: white;
                            border-radius: 50%;
                            transform: rotate(45deg);
                        "></div>
                    </div>
                \`,
                className: 'destination-marker',
                iconSize: [30, 40],
                iconAnchor: [15, 35]
            });

            // Update driver location
            function updateDriverLocation(lat, lng, speed = 0) {
                if (driverMarker) {
                    map.removeLayer(driverMarker);
                }
                
                driverMarker = L.marker([lat, lng], { 
                    icon: createDriverIcon(isDriverOnline) 
                }).addTo(map);
                
                map.setView([lat, lng], 16);
                
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
                
                // Update marker icon
                if (driverMarker) {
                    const pos = driverMarker.getLatLng();
                    map.removeLayer(driverMarker);
                    driverMarker = L.marker([pos.lat, pos.lng], { 
                        icon: createDriverIcon(online) 
                    }).addTo(map);
                }
            }

            // Start navigation to destination
            function startNavigation(destinationLat, destinationLng, passengerName) {
                if (!driverMarker) return;
                
                const driverPos = driverMarker.getLatLng();
                
                // Clear previous route
                if (routeControl) {
                    map.removeControl(routeControl);
                }
                if (destinationMarker) {
                    map.removeLayer(destinationMarker);
                }
                
                // Add destination marker
                destinationMarker = L.marker([destinationLat, destinationLng], { 
                    icon: destinationIcon 
                }).addTo(map);
                
                // Create route
                routeControl = L.Routing.control({
                    waypoints: [
                        L.latLng(driverPos.lat, driverPos.lng),
                        L.latLng(destinationLat, destinationLng)
                    ],
                    routeWhileDragging: false,
                    createMarker: function() { return null; }, // Don't create default markers
                    lineOptions: {
                        styles: [{
                            color: '#2563EB',
                            weight: 6,
                            opacity: 0.8
                        }]
                    }
                }).on('routesfound', function(e) {
                    const routes = e.routes;
                    const summary = routes[0].summary;
                    
                    // Show navigation info
                    const navInfo = document.getElementById('navigationInfo');
                    const distance = (summary.totalDistance / 1000).toFixed(1);
                    const duration = Math.round(summary.totalTime / 60);
                    
                    document.getElementById('nextInstruction').textContent = 'Navegando até ' + (passengerName || 'destino');
                    document.getElementById('distanceTime').textContent = distance + ' km • ' + duration + ' min';
                    navInfo.style.display = 'block';
                }).addTo(map);
            }

            // Clear navigation
            function clearNavigation() {
                if (routeControl) {
                    map.removeControl(routeControl);
                    routeControl = null;
                }
                if (destinationMarker) {
                    map.removeLayer(destinationMarker);
                    destinationMarker = null;
                }
                document.getElementById('navigationInfo').style.display = 'none';
            }

            // Initialize driver marker if location is available
            if (${location?.coords.latitude || 'false'}) {
                updateDriverLocation(${location?.coords.latitude || 0}, ${location?.coords.longitude || 0});
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
          source={{ html: openStreetMapHTML }}
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
        style={[styles.centerLocationButton, { bottom: insets.bottom + 100 }]}
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    maxHeight: height * 0.75,
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