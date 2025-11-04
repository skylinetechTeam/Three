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
  Modal,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';
import apiService from '../services/apiService';
import DriverAvatar from '../components/DriverAvatar';
import LocalDatabase from '../services/localDatabase';
import { 
  isValidCollectiveRoute, 
  getCollectiveRouteInfo,
  getCollectiveRoutePrice,
  getAllCollectiveRoutes,
  getLocationCoordinates 
} from '../config/collectiveRoutes';
import PricingHelper from './PricingHelper';

const { width, height } = Dimensions.get('window');

// OpenStreetMap Configuration (usando Nominatim para geocoding e OSRM para roteamento)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OSRM_BASE_URL = 'https://router.project-osrm.org';

export default function HomeScreen({ navigation, route }) {
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
  const [requestStatus, setRequestStatus] = useState(null); // 'pending', 'accepted', 'rejected', 'cancelled', 'completed', 'started'
  const [driverInfo, setDriverInfo] = useState(null);
  
  // Atualizar refs quando os estados mudam
  useEffect(() => {
    driverInfoRef.current = driverInfo;
  }, [driverInfo]);
  
  useEffect(() => {
    requestStatusRef.current = requestStatus;
  }, [requestStatus]);
  const [requestId, setRequestId] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [rideEstimate, setRideEstimate] = useState(null);
  const [isDropdownMinimized, setIsDropdownMinimized] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [showRouteToDriver, setShowRouteToDriver] = useState(false);
  const [driverArrived, setDriverArrived] = useState(false);
  const [driverProximityTimer, setDriverProximityTimer] = useState(null);
  const [isDriverNearby, setIsDriverNearby] = useState(false);
  const webViewRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const searchTimeoutRef = useRef(null);
  const proximityTimerRef = useRef(null);
  const driverInfoRef = useRef(null);
  const requestStatusRef = useRef(null);
  
  // Animações
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;

  // Function to calculate distance between two points (in meters)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Função para validar dados do motorista
  const isValidDriverData = (driverInfo) => {
    if (!driverInfo) {
      console.log('❌ [VALIDAÇÃO] driverInfo é nulo ou undefined');
      return false;
    }
    
    // Verificar nome válido (não pode ser padrão)
    const hasValidName = driverInfo.name && 
                        driverInfo.name !== 'Motorista' && 
                        driverInfo.name.trim().length > 2;
    
    // Verificar ID válido
    const hasValidId = driverInfo.id && 
                      driverInfo.id.toString().trim().length > 0;
    
    // Verificar se tem dados do veículo válidos
    const hasValidVehicle = driverInfo.vehicleInfo && (
      (driverInfo.vehicleInfo.make && driverInfo.vehicleInfo.model) ||
      (driverInfo.vehicleInfo.plate && 
       driverInfo.vehicleInfo.plate !== 'ABC-1234' && 
       driverInfo.vehicleInfo.plate.trim().length > 0) ||
      (driverInfo.vehicleInfo.color && driverInfo.vehicleInfo.color.trim().length > 0)
    );
    
    const isValid = hasValidName && hasValidId;
    
    console.log('🔍 [VALIDAÇÃO] Resultado da validação:', {
      hasValidName: hasValidName,
      hasValidId: hasValidId,
      hasValidVehicle: hasValidVehicle,
      name: driverInfo.name,
      id: driverInfo.id,
      vehicleInfo: driverInfo.vehicleInfo,
      isValid: isValid
    });
    
    return isValid;
  };

  // Função de teste para simular o início da corrida (desenvolvimento)
  const testRideStarted = () => {
    console.log('🧪 TESTE: Simulando evento ride_started');
    console.log('📊 Estado atual:', {
      requestStatus,
      driverInfo: !!driverInfo,
      selectedDestination: !!selectedDestination,
      driverArrived,
      location: !!location,
      webViewRef: !!webViewRef.current,
      callbacksRegistered: apiService.eventCallbacks?.has('ride_started'),
      totalCallbacks: apiService.eventCallbacks?.get('ride_started')?.length || 0
    });
    console.log()
    const testData = {
      rideId: requestId || 'test-ride-123',
      driverId: driverInfo?.id || 'test-driver-456',
      ride: {
        destination: selectedDestination || {
          lat: -8.8284, // Centro de Luanda como fallback
          lng: 13.2436,
          name: 'Destino de Teste',
          address: 'Local de teste - Centro de Luanda'
        }
      },
      status: 'started',
      timestamp: Date.now()
    };
    
    console.log('🎯 Dados do teste:', testData);
    
    // MÉTODO 1: Simular o evento através do callback
    if (apiService.eventCallbacks?.has('ride_started')) {
      console.log('✅ Executando callbacks ride_started...');
      apiService.triggerCallbacks('ride_started', testData);
    } else {
      console.warn('⚠️ Callback ride_started não encontrado!');
      console.log('📋 Eventos registrados:', Array.from(apiService.eventCallbacks?.keys() || []));
    }
    
    // MÉTODO 2: Forçar diretamente via JavaScript (backup)
    if (webViewRef.current && location && selectedDestination) {
      console.log('🔧 BACKUP: Forçando atualização direta do mapa...');
      const forceScript = `
        console.log('🔧 FORCE: Executando atualização forçada do mapa');
        
        // Clear driver marker
        if (typeof window.__clearDriverMarker === 'function') {
          window.__clearDriverMarker();
          console.log('✅ FORCE: Driver marker cleared');
        }
        
        // Set destination
        if (typeof window.__setDestination === 'function') {
          console.log('🎯 FORCE: Setting destination to ${selectedDestination.lat}, ${selectedDestination.lng}');
          window.__setDestination(${selectedDestination.lat}, ${selectedDestination.lng}, ${JSON.stringify(selectedDestination.name || selectedDestination.address)});
          console.log('✅ FORCE: Destination set and route calculated');
        } else {
          console.error('❌ FORCE: __setDestination function not found');
        }
      `;
      
      webViewRef.current.injectJavaScript(forceScript);
    }
    
    // MÉTODO 3: Também tentar via WebSocket se conectado
    if (apiService.socket && apiService.isConnected) {
      console.log('📡 Enviando via WebSocket também...');
      apiService.socket.emit('ride_started_manual', testData);
    }
    
    // MÉTODO 4: Forçar mudança de estado diretamente
    console.log('🎛️ Forçando mudança de estado driverArrived...');
    setDriverArrived(true);
  };

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
      
      // Obter nome da localização atual
      if (location?.coords) {
        const locationName = await reverseGeocode(
          location.coords.latitude, 
          location.coords.longitude
        );
        setCurrentLocationName(locationName);
        console.log('📍 Nome da localização atual definido como:', locationName);
      }
      
      // Initialize passenger profile
      await initializePassenger();
    })();
  }, []);

  // Handle navigation params (from favorites and reservations)
  useEffect(() => {
    console.log('🔍 Verificando parâmetros de navegação:', route?.params);
    
    if (route?.params?.selectedDestination) {
      const dest = route.params.selectedDestination;
      const autoStartFlow = route?.params?.autoStartFlow;
      const fromFavorites = route?.params?.fromFavorites;
      const fromScheduled = route?.params?.fromScheduled;
      
      console.log('📍 Received destination from navigation:', dest);
      console.log('🚀 Auto start flow:', autoStartFlow);
      console.log('⭐ From favorites:', fromFavorites);
      console.log('⏰ From scheduled:', fromScheduled);
      console.log('📱 Current location available:', !!location?.coords);
      
      setSelectedDestination(dest);
      setDestination(dest.name || dest.address);
      
      // Calculate route info if location is available
      if (location?.coords && dest.lat && dest.lng) {
        calculateRouteInfo(
          location.coords.latitude,
          location.coords.longitude,
          dest.lat,
          dest.lng
        );
      }
      
      // Se veio dos favoritos ou reservas agendadas com autoStartFlow, criar estimate e mostrar modal automaticamente
      if (autoStartFlow && (fromFavorites || fromScheduled)) {
        const sourceType = fromScheduled ? 'reserva agendada' : 'favorito';
        console.log(`🚀 Processando fluxo automático de ${sourceType}...`);
        
        // Para reservas agendadas, mostrar alerta adicional
        if (fromScheduled) {
          const originalReservaId = route?.params?.originalReservaId;
          const scheduledTime = route?.params?.scheduledTime;
          console.log(`⏰ Reserva agendada ativada! ID: ${originalReservaId}, Horário: ${scheduledTime}`);
        }
        
        setTimeout(async () => {
          try {
            const estimate = await createRideEstimateForFavorite(dest);
            
            if (estimate) {
              console.log(`✅ Estimate criado para ${sourceType}, definindo estado e mostrando modal...`);
              setRideEstimate(estimate);
              
              // Aguardar um pouco para garantir que o estado foi atualizado
              setTimeout(() => {
                setShowConfirmationModal(true);
                console.log(`🎭 Modal de confirmação exibido para ${sourceType}`);
              }, 200);
            } else {
              console.error('❌ Falha ao criar estimate');
              Alert.alert('Erro', 'Não foi possível calcular a rota. Tente novamente.');
            }
          } catch (error) {
            console.error('❌ Erro no fluxo automático:', error);
            Alert.alert('Erro', 'Ocorreu um erro ao processar a solicitação.');
          }
        }, 1000);
      }
      
      // Clear the params to prevent re-triggering
      navigation.setParams({ 
        selectedDestination: undefined, 
        autoStartFlow: undefined,
        fromFavorites: undefined,
        fromScheduled: undefined,
        originalReservaId: undefined,
        scheduledTime: undefined,
        observacoes: undefined
      });
    }
  }, [route?.params?.selectedDestination, location]);

  // Cleanup effect for timers and intervals
  useEffect(() => {
    return () => {
      // Limpar timer de proximidade
      if (proximityTimerRef.current) {
        clearTimeout(proximityTimerRef.current);
        proximityTimerRef.current = null;
      }
      
      // Limpar interval de movimento do motorista
      if (window.driverMovementInterval) {
        clearInterval(window.driverMovementInterval);
        window.driverMovementInterval = null;
      }
      
      // Limpar polling de localização
      if (window.driverLocationPolling) {
        clearInterval(window.driverLocationPolling);
        window.driverLocationPolling = null;
      }
      
      // Limpar interval de busca
      if (window.driverSearchInterval) {
        clearInterval(window.driverSearchInterval);
        window.driverSearchInterval = null;
      }
    };
  }, []);

  const initializePassenger = async () => {
    try {
      console.log('🚀 Inicializando passageiro com sistema seguro de nomes...');
      
      // 1. Obter ou criar perfil seguro usando as novas funções utilitárias
      let profile = await LocalDatabase.getOrCreateSafePassengerProfile();
      console.log('📁 Perfil seguro obtido/criado:', profile);
      
      setPassengerProfile(profile);
      
      // 2. Verificar se precisa registrar na API
      if (!profile.apiRegistered) {
        try {
          // Criar dados para registro usando nome seguro
          const passengerData = {
            name: LocalDatabase.getSafePassengerName(profile), // ✅ CORREÇÃO: Usar função segura
            phone: profile.phone || '',
            email: profile.email || '',
            preferredPaymentMethod: profile.preferredPaymentMethod || 'cash'
          };
          
          console.log('📤 Dados para registro na API com nome seguro:', passengerData);
          console.log('✅ Nome verificado é seguro:', passengerData.name);
          
          // Validar que o nome não é demo antes de enviar
          if (passengerData.name === 'userdemo' || passengerData.name.toLowerCase().includes('demo')) {
            console.warn('⚠️ DETECTADO NOME DEMO após verificação! Usando fallback...');
            passengerData.name = 'Passageiro';
          }
          
          console.log('📦 Dados finais para API:', passengerData);
          
          const apiResponse = await apiService.registerPassenger(passengerData);
          const passengerId = apiResponse.data.passengerId;
          
          // Atualizar perfil local com ID da API
          const updatedProfile = {
            ...profile,
            apiPassengerId: passengerId,
            apiRegistered: true,
            lastApiSync: new Date().toISOString()
          };
          
          await LocalDatabase.updatePassengerProfile(updatedProfile);
          setPassengerProfile(updatedProfile);
          
          console.log('✅ Passageiro registrado na API com sucesso - ID:', passengerId);
          
          // Configurar callbacks ANTES de conectar socket
          console.log('🎯 Configurando callbacks de eventos ANTES da conexão...');
          
          // ✅ CALLBACKS COMPLETOS PARA NOVO USUÁRIO
          console.log('🎯 [NOVO USUÁRIO] Configurando callbacks de eventos...');
          
          // Handler para corrida aceita
          apiService.onEvent('ride_accepted', (data) => {
            console.log('🎉 [NOVO USUÁRIO] Corrida aceita pelo motorista:', data);
            
            // PREVENIR EVENTOS DUPLICADOS
            if (requestStatus === 'accepted' && driversFound) {
              console.log('⏭️ [DUPLICADO] Evento ride_accepted ignorado - já processado anteriormente');
              return;
            }
            
            // EXTRAIR DADOS DO VEÍCULO CORRETAMENTE
            let vehicleData = null;
            
            // Tentar múltiplas fontes para dados do veículo
            if (data.ride?.vehicleInfo) {
              vehicleData = data.ride.vehicleInfo;
              console.log('🚗 [VEÍCULO] Dados encontrados em data.ride.vehicleInfo:', vehicleData);
            } else if (data.driver?.vehicleInfo) {
              vehicleData = data.driver.vehicleInfo;
              console.log('🚗 [VEÍCULO] Dados encontrados em data.driver.vehicleInfo:', vehicleData);
            } else if (data.vehicleInfo) {
              vehicleData = data.vehicleInfo;
              console.log('🚗 [VEÍCULO] Dados encontrados em data.vehicleInfo:', vehicleData);
            }
            
            console.log('🚗 INFO DO MOTORISTA CHEGOU:', {
              motorista: data.driver,
              tempoEstimado: data.estimatedArrival,
              localizacao: data.driver?.location,
              veiculo: vehicleData,
              avaliacao: data.driver?.rating
            });
            
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
            console.log('📦 [NOVO USUÁRIO] Dados finais do veículo sendo salvos:', vehicleData);
            
            // SALVAR INFORMAÇÕES DO MOTORISTA COM DADOS CORRETOS DO VEÍCULO
            setDriverInfo({
              id: data.driver?.id || data.driverId || data.ride?.driverId,
              name: data.driver?.name || data.ride?.driverName || 'Motorista',
              phone: data.driver?.phone || data.ride?.driverPhone || '',
              vehicleInfo: vehicleData || {},
              rating: data.driver?.rating || data.ride?.rating || 0,
              location: data.driver?.location || null,
              estimatedArrival: data.estimatedArrival || '5-10 minutos'
            });
            
            if (data.rideId || data.ride?.id) {
              setRequestId(data.rideId || data.ride.id);
            }
            
            if (data.ride) {
              setCurrentRide(prev => ({
                ...prev,
                ...data.ride,
                driver: {
                  ...data.driver,
                  vehicleInfo: vehicleData
                },
                status: 'accepted'
              }));
            }
            
            Toast.show({
              type: "success",
              text1: "Solicitação Aceita! 🎉",
              text2: `${data.driver?.name || data.ride?.driverName || 'Motorista'} está a caminho - ${data.estimatedArrival || '5-10 min'}`,
              visibilityTime: 6000,
            });
          });

          // Handler para corrida rejeitada
          apiService.onEvent('ride_rejected', (data) => {
            console.log('❌ [NOVO USUÁRIO] Solicitação rejeitada pelo motorista:', data);
            
            setRequestStatus('rejected');
            
            Toast.show({
              type: "error",
              text1: "Solicitação Recusada",
              text2: data.reason || "O motorista não pode aceitar sua solicitação no momento",
              visibilityTime: 4000,
            });
            
            console.log('🔄 Continuando busca por outros motoristas...');
          });

          // 🆕 CORREÇÃO CRÍTICA: Handler para quando nenhum motorista está disponível
          apiService.onEvent('no_drivers_available', (data) => {
            console.log('🚫 [NOVO USUÁRIO] Nenhum motorista disponível:', data);
            
            // 🛑 PARAR BUSCA IMEDIATAMENTE
            console.log('🛑 PARANDO BUSCA - NENHUM MOTORISTA DISPONÍVEL');
            setIsSearchingDrivers(false);
            setDriversFound(false);
            setDriverSearchTime(0);
            
            // Limpar TODOS os intervalos
            if (window.driverSearchInterval) {
              console.log('🗑️ Limpando window.driverSearchInterval');
              clearInterval(window.driverSearchInterval);
              window.driverSearchInterval = null;
            }
            
            if (searchTimeoutRef.current) {
              console.log('🗑️ Limpando searchTimeoutRef');
              clearTimeout(searchTimeoutRef.current);
              searchTimeoutRef.current = null;
            }
            
            setRequestStatus('rejected');
            
            Toast.show({
              type: "error",
              text1: "Nenhum motorista disponível",
              text2: "Tente novamente em alguns minutos",
              visibilityTime: 5000,
            });
            
            console.log('✅ [NOVO USUÁRIO] Busca parada após no_drivers_available');
          });

          // Handler para corrida cancelada
          apiService.onEvent('ride_cancelled', (data) => {
            console.log('❌ [NOVO USUÁRIO] Corrida cancelada:', data);
            
            setRequestStatus('cancelled');
            setIsSearchingDrivers(false);
            setDriversFound(false);
            setDriverSearchTime(0);
            
            if (window.driverSearchInterval) {
              clearInterval(window.driverSearchInterval);
              window.driverSearchInterval = null;
            }
            
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
          apiService.onEvent('ride_started', (data) => {
            console.log('🚗 Corrida iniciada:', data);
            setRequestStatus('started');
            
            // NOVA FUNCIONALIDADE: Quando motorista inicia a corrida (chegou no cliente), 
            // mudar o mapa para mostrar rota do cliente ao destino
            console.log('🎯 Corrida iniciada! Mudando para rota cliente->destino');
            setDriverArrived(true);
            
            // Limpar timer de proximidade se existir
            if (proximityTimerRef.current) {
              clearTimeout(proximityTimerRef.current);
              proximityTimerRef.current = null;
            }
            
                      // Forçar atualização do mapa para mostrar rota ao destino
          if (location && webViewRef.current) {
            console.log('🗺️ Atualizando mapa para mostrar rota ao destino após início da corrida');
            
            // Limpar marcador do motorista usando JavaScript injection
            const clearDriverScript = `
              if (typeof window.__clearDriverMarker === 'function') {
                window.__clearDriverMarker();
                console.log('✅ Driver marker cleared');
              }
            `;
            webViewRef.current.injectJavaScript(clearDriverScript);
            
            // Determinar destino a usar
            let destinationToUse = selectedDestination;
            if (!destinationToUse && data.ride?.destination) {
              destinationToUse = {
                lat: data.ride.destination.lat,
                lng: data.ride.destination.lng,
                name: data.ride.destination.address || data.ride.destination.name,
                address: data.ride.destination.address
              };
              console.log('🎯 Usando destino dos dados da corrida:', destinationToUse);
              
              // Atualizar estado local do destino também
              setSelectedDestination(destinationToUse);
            }
            
            // Mostrar rota do cliente ao destino usando JavaScript injection
            if (destinationToUse) {
              const destinationScript = `
                if (typeof window.__setDestination === 'function') {
                  console.log('🎯 Setting destination to:', ${destinationToUse.lat}, ${destinationToUse.lng});
                  window.__setDestination(${destinationToUse.lat}, ${destinationToUse.lng}, ${JSON.stringify(destinationToUse.name)});
                  console.log('✅ Destination set and route calculated');
                } else {
                  console.error('❌ __setDestination function not found');
                }
              `;
              console.log('🚀 Injetando script para mostrar rota ao destino:', destinationScript);
              webViewRef.current.injectJavaScript(destinationScript);
            } else {
              console.warn('⚠️ Nenhum destino disponível para mostrar rota');
            }
          }
            
            Toast.show({
              type: "success",
              text1: "Corrida Iniciada",
              text2: "Motorista chegou! Seguindo para o destino.",
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
            console.log('🗺️ LOCALIZAÇÃO DO MOTORISTA ATUALIZADA:', {
              idMotorista: data.driverId,
              novaLocalizacao: data.location,
              tempoEstimadoChegada: data.estimatedArrival,
              distancia: data.distance || 'N/A'
            });
            if (driverInfo && data.driverId === driverInfo.id) {
              setDriverInfo(prev => ({
                ...prev,
                location: data.location,
                estimatedArrival: data.estimatedArrival
              }));
              
              // Update driver location for map
              if (data.location) {
                setDriverLocation(data.location);
                
                // Check if driver is nearby (within 100 meters)
                if (location && location.coords) {
                  const distance = calculateDistance(
                    location.coords.latitude,
                    location.coords.longitude,
                    data.location.latitude,
                    data.location.longitude
                  );
                  
                  console.log(`📏 Distância até o motorista: ${Math.round(distance)}m`);
                  
                  // If driver is very close (within 50 meters) and wasn't nearby before
                  if (distance <= 50 && !isDriverNearby) {
                    console.log('🚗 Motorista está muito perto! Iniciando timer de 5 segundos...');
                    setIsDriverNearby(true);
                    
                    // Clear any existing timer
                    if (proximityTimerRef.current) {
                      clearTimeout(proximityTimerRef.current);
                    }
                    
                    // Set timer for 5 seconds before switching to destination route
                    proximityTimerRef.current = setTimeout(() => {
                      console.log('⏰ 5 segundos passaram! Mudando para rota do destino...');
                      setDriverArrived(true);
                      setIsDriverNearby(false);
                      
                      Toast.show({
                        type: "success",
                        text1: "Motorista chegou!",
                        text2: "Seguindo para o destino",
                        visibilityTime: 3000,
                      });
                    }, 5000); // 5 seconds
                    
                    Toast.show({
                      type: "info",
                      text1: "Motorista próximo",
                      text2: "Preparando para embarque...",
                      visibilityTime: 3000,
                    });
                  }
                  // If driver moves away, reset proximity
                  else if (distance > 100 && isDriverNearby) {
                    console.log('📍 Motorista se afastou, cancelando timer...');
                    setIsDriverNearby(false);
                    if (proximityTimerRef.current) {
                      clearTimeout(proximityTimerRef.current);
                      proximityTimerRef.current = null;
                    }
                  }
                }
              }
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
        // ✅ CONFIGURAR MESMOS CALLBACKS PARA PASSAGEIRO JÁ REGISTRADO
        console.log('🎯 [PASSAGEIRO JÁ REGISTRADO] Configurando callbacks...');
        
        // CORREÇÃO CRÍTICA: Sempre registrar todos os callbacks, mesmo para passageiros já registrados
        console.log('🔄 [PASSAGEIRO JÁ REGISTRADO] Registrando todos os callbacks necessários...');
        
        // Handler para corrida aceita
        apiService.onEvent('ride_accepted', (data) => {
          console.log('🎉 [PASSAGEIRO JÁ REGISTRADO] Corrida aceita pelo motorista:', data);
          
          // PREVENIR EVENTOS DUPLICADOS
          if (requestStatus === 'accepted' && driversFound) {
            console.log('⏭️ [DUPLICADO] Evento ride_accepted ignorado - já processado anteriormente');
            return;
          }
          
          // EXTRAIR DADOS DO VEÍCULO CORRETAMENTE
          let vehicleData = null;
          
          // Tentar múltiplas fontes para dados do veículo
          if (data.ride?.vehicleInfo) {
            vehicleData = data.ride.vehicleInfo;
            console.log('🚗 [VEÍCULO] Dados encontrados em data.ride.vehicleInfo:', vehicleData);
          } else if (data.driver?.vehicleInfo) {
            vehicleData = data.driver.vehicleInfo;
            console.log('🚗 [VEÍCULO] Dados encontrados em data.driver.vehicleInfo:', vehicleData);
          } else if (data.vehicleInfo) {
            vehicleData = data.vehicleInfo;
            console.log('🚗 [VEÍCULO] Dados encontrados em data.vehicleInfo:', vehicleData);
          }
          
          console.log('🚗 INFO DO MOTORISTA CHEGOU (Passageiro Registrado):', {
            motorista: data.driver,
            tempoEstimado: data.estimatedArrival,
            localizacao: data.driver?.location,
            veiculo: vehicleData,
            avaliacao: data.driver?.rating
          });
          
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
          console.log('📦 Dados finais do veículo sendo salvos:', vehicleData);
          
          // PREPARAR dados do motorista
          const driverData = {
            id: data.driver?.id || data.driverId || data.ride?.driverId,
            name: data.driver?.name || data.ride?.driverName,
            phone: data.driver?.phone || data.ride?.driverPhone || '',
            vehicleInfo: vehicleData,
            rating: data.driver?.rating || data.ride?.rating || 0,
            location: data.driver?.location || null,
            estimatedArrival: data.estimatedArrival
          };

          console.log('🔍 [PREPARAÇÃO] Dados preparados do motorista:', driverData);

          // SÓ SALVAR se os dados são válidos
          if (isValidDriverData(driverData)) {
            setDriverInfo(driverData);
            console.log('✅ [SUCESSO] Dados válidos do motorista salvos');
          } else {
            console.warn('⚠️ [AVISO] Dados do motorista são padrão/inválidos, não exibindo modal');
            console.warn('🔍 [DEBUG] Motivo da rejeição:', {
              name: driverData.name,
              isNameValid: driverData.name && driverData.name !== 'Motorista',
              id: driverData.id,
              isIdValid: driverData.id && driverData.id.toString().trim().length > 0
            });
          }
          
          if (data.rideId || data.ride?.id) {
            setRequestId(data.rideId || data.ride.id);
          }
          
          if (data.ride) {
            setCurrentRide(prev => ({
              ...prev,
              ...data.ride,
              driver: {
                ...data.driver,
                vehicleInfo: vehicleData
              },
              status: 'accepted'
            }));
          }
          
          Toast.show({
            type: "success",
            text1: "Solicitação Aceita! 🎉",
            text2: `${data.driver?.name || data.ride?.driverName || 'Motorista'} está a caminho - ${data.estimatedArrival || '5-10 min'}`,
            visibilityTime: 6000,
          });
        });

        // Handler para corrida rejeitada
        apiService.onEvent('ride_rejected', (data) => {
          console.log('❌ [PASSAGEIRO JÁ REGISTRADO] Solicitação rejeitada pelo motorista:', data);
          
          setRequestStatus('rejected');
          
          Toast.show({
            type: "error",
            text1: "Solicitação Recusada",
            text2: data.reason || "O motorista não pode aceitar sua solicitação no momento",
            visibilityTime: 4000,
          });
          
          console.log('🔄 Continuando busca por outros motoristas...');
        });

        // Handler para quando nenhum motorista está disponível
        apiService.onEvent('no_drivers_available', (data) => {
          console.log('🚫 [PASSAGEIRO JÁ REGISTRADO] Nenhum motorista disponível:', data);
          
          console.log('🛑 PARANDO BUSCA - NENHUM MOTORISTA DISPONÍVEL');
          setIsSearchingDrivers(false);
          setDriversFound(false);
          setDriverSearchTime(0);
          
          if (window.driverSearchInterval) {
            clearInterval(window.driverSearchInterval);
            window.driverSearchInterval = null;
          }
          
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
          }
          
          setRequestStatus('rejected');
          
          Toast.show({
            type: "error",
            text1: "Nenhum motorista disponível",
            text2: "Tente novamente em alguns minutos",
            visibilityTime: 5000,
          });
        });

        // Handler para corrida cancelada
        apiService.onEvent('ride_cancelled', (data) => {
          console.log('❌ [PASSAGEIRO JÁ REGISTRADO] Corrida cancelada:', data);
          
          setRequestStatus('cancelled');
          setIsSearchingDrivers(false);
          setDriversFound(false);
          setDriverSearchTime(0);
          
          if (window.driverSearchInterval) {
            clearInterval(window.driverSearchInterval);
            window.driverSearchInterval = null;
          }
          
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
        
        // Handler para corrida iniciada
        apiService.onEvent('ride_started', (data) => {
          console.log('🚗 [PASSAGEIRO JÁ REGISTRADO] Corrida iniciada:', data);
          setRequestStatus('started');
          setDriverArrived(true);
          
          if (proximityTimerRef.current) {
            clearTimeout(proximityTimerRef.current);
            proximityTimerRef.current = null;
          }
          
          Toast.show({
            type: "success",
            text1: "Corrida Iniciada",
            text2: "Motorista chegou! Seguindo para o destino.",
            visibilityTime: 3000,
          });
        });
        
        // Handler para corrida completada
        apiService.onEvent('ride_completed', (data) => {
          console.log('✅ [PASSAGEIRO JÁ REGISTRADO] Corrida finalizada:', data);
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
        
        // Handler para atualização de localização do motorista
        apiService.onEvent('driver_location_update', (data) => {
          console.log('🗺️ LOCALIZAÇÃO DO MOTORISTA ATUALIZADA (Passageiro Registrado):', {
            idMotorista: data.driverId,
            novaLocalizacao: data.location,
            tempoEstimadoChegada: data.estimatedArrival,
            motoristaAtual: driverInfo?.id,
            corresponde: driverInfo && data.driverId === driverInfo.id
          });
          
          if (driverInfo && data.driverId === driverInfo.id) {
            setDriverInfo(prev => ({
              ...prev,
              location: data.location,
              estimatedArrival: data.estimatedArrival
            }));
            
            if (data.location) {
              setDriverLocation(data.location);
            }
          }
        });
        
        // Verificar se todos os callbacks foram registrados
        console.log('📊 [PASSAGEIRO JÁ REGISTRADO] Total de callbacks registrados:', apiService.eventCallbacks?.size || 0);
        
        // Connect to socket AFTER configuring callbacks
        console.log('🔌 Conectando WebSocket para passageiro já registrado APÓS callbacks:', profile.apiPassengerId);
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
      
      // Atualizar nome da localização se mudou significativamente
      const updateLocationName = async () => {
        const newLocationName = await reverseGeocode(
          location.coords.latitude, 
          location.coords.longitude
        );
        if (newLocationName !== currentLocationName) {
          console.log('📍 Localização mudou de', currentLocationName, 'para', newLocationName);
          setCurrentLocationName(newLocationName);
        }
      };
      
      updateLocationName();
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
            
            /* Traffic car styling */
            .traffic-car {
                transition: transform 0.1s linear;
                will-change: transform;
                pointer-events: none;
            }
            
            .traffic-car svg {
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }
            .leaflet-control-zoom { display: none; }
            .leaflet-control-attribution { display: none; }
        </style>
    </head>
    <body>
        <div id="mapContainer"></div>
        
        <script>
            // Initialize OpenStreetMap with Leaflet
            const map = L.map('mapContainer', { zoomControl: false, attributionControl: false }).setView([${location?.coords.latitude || -8.8390}, ${location?.coords.longitude || 13.2894}], 15);
            
            // Tile servers - usar CartoDB Voyager como padrão (mais parecido com Google Maps)
            const tileServers = [
                {
                    name: 'CartoDB Voyager (Google-like)',
                    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                    options: {
                        attribution: '© OpenStreetMap contributors, © CartoDB',
                        subdomains: 'abcd',
                        maxZoom: 20,
                        tileSize: 256,
                        zoomOffset: 0
                    }
                },
                {
                    name: 'CartoDB Voyager Labeled',  
                    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png',
                    options: {
                        attribution: '© OpenStreetMap contributors, © CartoDB',
                        subdomains: 'abcd',
                        maxZoom: 20
                    }
                },
                {
                    name: 'CartoDB Positron (Clean)',
                    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                    options: {
                        attribution: '© OpenStreetMap contributors, © CartoDB',
                        subdomains: 'abcd',
                        maxZoom: 20
                    }
                },
                {
                    name: 'ESRI World Street (Google-like)',
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
                    options: {
                        attribution: '© Esri, © OpenStreetMap contributors',
                        maxZoom: 19
                    }
                },
                {
                    name: 'Wikimedia Maps',
                    url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
                    options: {
                        attribution: '© OpenStreetMap contributors, © Wikimedia',
                        maxZoom: 19
                    }
                }
            ];
            
            // Sempre usar o primeiro (CartoDB Voyager) que é mais parecido com Google Maps
            const selectedServer = tileServers[0]; // Usar sempre CartoDB Voyager
            console.log('Using tile server:', selectedServer.name);
            
            // Add tile layer with error handling
            const tileLayer = L.tileLayer(selectedServer.url, {
                ...selectedServer.options,
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
                crossOrigin: true
            });
            
            // Add error handling for tile loading - tentar próximo servidor se falhar
            let currentServerIndex = 0;
            tileLayer.on('tileerror', function(error, tile) {
                console.log('Tile error, trying alternative server...');
                currentServerIndex = (currentServerIndex + 1) % tileServers.length;
                const nextServer = tileServers[currentServerIndex];
                tile.src = tile.src.replace(selectedServer.url.split('{')[0], nextServer.url.split('{')[0]);
            });
            
            tileLayer.addTo(map);

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

            // Add driver marker with car icon
            let driverMarker = null;
            function addDriverMarker(lat, lng, driverName) {
                if (driverMarker) {
                    map.removeLayer(driverMarker);
                }
                
                // Criar ícone de carro para o motorista
                const carIcon = L.divIcon({
                    html: \`<div style="
                        background-color: #10B981; 
                        width: 40px; 
                        height: 40px; 
                        border-radius: 50%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        border: 3px solid white; 
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        font-size: 20px;
                        color: white;
                    ">🚗</div>\`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                    className: 'driver-marker'
                });
                
                driverMarker = L.marker([lat, lng], { icon: carIcon });
                if (driverName) {
                    driverMarker.bindPopup(\`Motorista: \${driverName}\`);
                }
                driverMarker.addTo(map);
            }

            // Calculate route to driver first, then to destination
            let routeToDriver = null;
            async function calculateRouteToDriver(userLat, userLng, driverLat, driverLng) {
                try {
                    console.log('🚗 Calculating route to driver');
                    
                    // Clear existing route to driver
                    if (routeToDriver) {
                        map.removeLayer(routeToDriver);
                        routeToDriver = null;
                    }
                    
                    // Try multiple routing services with fallback
                    const routingServices = [
                        \`https://router.project-osrm.org/route/v1/driving/\${userLng},\${userLat};\${driverLng},\${driverLat}?overview=full&geometries=geojson\`,
                        \`https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf62488a7e4a14a9164a8d8a3c49f973c8e8ef&start=\${userLng},\${userLat}&end=\${driverLng},\${driverLat}\`
                    ];
                    
                    let routeUrl = routingServices[0];
                    let data = null;
                    
                    // Try each service until one works
                    for (let i = 0; i < routingServices.length; i++) {
                        try {
                            routeUrl = routingServices[i];
                            console.log('Trying routing service:', routeUrl.split('?')[0]);
                            const response = await fetch(routeUrl);
                            if (response.ok) {
                                data = await response.json();
                                break;
                            }
                        } catch (err) {
                            console.log('Service failed, trying next...');
                        }
                    }
                    
                    if (data.routes && data.routes?.length > 0) {
                        const route = data.routes[0];
                        const coordinates = route.geometry.coordinates;
                        const leafletCoords = coordinates.map(coord => [coord[1], coord[0]]);
                        
                        // Create route polyline to driver (green color)
                        routeToDriver = L.polyline(leafletCoords, {
                            color: '#10B981',
                            weight: 4,
                            opacity: 0.8,
                            dashArray: '10, 5' // Linha tracejada
                        }).addTo(map);
                        
                        // Fit map to show user and driver
                        const group = new L.featureGroup([
                            L.marker([userLat, userLng]),
                            L.marker([driverLat, driverLng])
                        ]);
                        map.fitBounds(group.getBounds().pad(0.1));
                        
                        return {
                            distance: route.distance,
                            duration: route.duration
                        };
                    }
                } catch (error) {
                    console.error('❌ Error calculating route to driver:', error);
                }
                return null;
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
                    
                    // Try multiple routing services with fallback
                    const routingServices = [
                        \`https://router.project-osrm.org/route/v1/driving/\${startLng},\${startLat};\${endLng},\${endLat}?overview=full&geometries=geojson\`,
                        \`https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf62488a7e4a14a9164a8d8a3c49f973c8e8ef&start=\${startLng},\${startLat}&end=\${endLng},\${endLat}\`
                    ];
                    
                    let routeUrl = routingServices[0];
                    let data = null;
                    
                    // Try each service until one works
                    for (let i = 0; i < routingServices.length; i++) {
                        try {
                            routeUrl = routingServices[i];
                            console.log('Trying routing service:', routeUrl.split('?')[0]);
                            const response = await fetch(routeUrl);
                            if (response.ok) {
                                data = await response.json();
                                break;
                            }
                        } catch (err) {
                            console.log('Service failed, trying next...');
                        }
                    }
                    
                    if (data.routes && data.routes?.length > 0) {
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

            // Expose driver functions with enhanced features
            window.__addDriverMarker = function(lat, lng, driverName) {
              addDriverMarker(lat, lng, driverName);
            };
            
            window.__calculateRouteToDriver = async function(userLat, userLng, driverLat, driverLng) {
              return await calculateRouteToDriver(userLat, userLng, driverLat, driverLng);
            };
            
            window.__clearDriverMarker = function() {
              if (driverMarker) {
                map.removeLayer(driverMarker);
                driverMarker = null;
              }
              if (routeToDriver) {
                map.removeLayer(routeToDriver);
                routeToDriver = null;
              }
            };
            
            // 🆕 NOVA FUNCIONALIDADE: Sistema avançado de visualização de corrida
            window.__showRideAcceptedView = function(driverLat, driverLng, driverName, userLat, userLng) {
              console.log('🎉 [RIDE ACCEPTED] Configurando visualização completa da corrida aceita');
              
              // Limpar qualquer rota anterior
              if (routeLine) {
                map.removeLayer(routeLine);
                routeLine = null;
              }
              
              // Adicionar marcador do motorista
              addDriverMarker(driverLat, driverLng, driverName);
              
              // Calcular e mostrar rota até o motorista
              calculateRouteToDriver(userLat, userLng, driverLat, driverLng).then(() => {
                console.log('✅ [RIDE ACCEPTED] Rota até o motorista configurada');
                
                // Ajustar visualização para mostrar usuário e motorista
                const bounds = L.latLngBounds([
                  [userLat, userLng],
                  [driverLat, driverLng]
                ]);
                
                map.fitBounds(bounds.pad(0.15)); // 15% de padding
                console.log('✅ [RIDE ACCEPTED] Mapa ajustado para mostrar usuário e motorista');
              });
            };
            
            window.__updateDriverLocation = function(driverLat, driverLng, driverName) {
              console.log('📍 [DRIVER UPDATE] Atualizando localização do motorista');
              
              // Atualizar posição do marcador do motorista
              if (driverMarker) {
                const newPos = L.latLng(driverLat, driverLng);
                driverMarker.setLatLng(newPos);
                
                // Atualizar popup se existir
                if (driverName) {
                  driverMarker.bindPopup('Motorista: ' + driverName);
                }
                
                // Recalcular rota se necessário
                if (currentUserLocation && routeToDriver) {
                  calculateRouteToDriver(
                    currentUserLocation.lat, 
                    currentUserLocation.lng, 
                    driverLat, 
                    driverLng
                  );
                }
              }
            };
            
            window.__transitionToDestinationRoute = function(destLat, destLng, destName) {
              console.log('🎯 [RIDE STARTED] Iniciando transição para rota do destino');
              
              // Animação suave: primeiro limpar marcador do motorista
              if (driverMarker) {
                // Adicionar efeito de fade out
                driverMarker.getElement().style.transition = 'opacity 0.5s';
                driverMarker.getElement().style.opacity = '0';
                
                setTimeout(() => {
                  if (driverMarker) {
                    map.removeLayer(driverMarker);
                    driverMarker = null;
                  }
                  if (routeToDriver) {
                    map.removeLayer(routeToDriver);
                    routeToDriver = null;
                  }
                  
                  // Adicionar destino e calcular rota
                  addDestinationMarker(destLat, destLng, destName);
                  
                  if (currentUserLocation) {
                    calculateRoute(
                      currentUserLocation.lat, 
                      currentUserLocation.lng, 
                      destLat, 
                      destLng
                    ).then(() => {
                      console.log('✅ [RIDE STARTED] Transição completa para rota do destino');
                    });
                  }
                }, 500); // Aguardar animação de fade
              } else {
                // Se não há motorista, ir direto para o destino
                addDestinationMarker(destLat, destLng, destName);
                if (currentUserLocation) {
                  calculateRoute(
                    currentUserLocation.lat, 
                    currentUserLocation.lng, 
                    destLat, 
                    destLng
                  );
                }
              }
            };
            
            window.__resetMapView = function() {
              console.log('🔄 [RESET] Resetando visualização do mapa');
              
              // Limpar todos os marcadores e rotas
              if (driverMarker) {
                map.removeLayer(driverMarker);
                driverMarker = null;
              }
              if (destinationMarker) {
                map.removeLayer(destinationMarker);
                destinationMarker = null;
              }
              if (routeLine) {
                map.removeLayer(routeLine);
                routeLine = null;
              }
              if (routeToDriver) {
                map.removeLayer(routeToDriver);
                routeToDriver = null;
              }
              
              // Centralizar na localização do usuário
              if (currentUserLocation) {
                map.setView([currentUserLocation.lat, currentUserLocation.lng], 15);
              }
              
              console.log('✅ [RESET] Mapa resetado com sucesso');
            };

            // Handle messages from React Native
            window.addEventListener('message', function(event) {
              try {
                const message = JSON.parse(event.data);
                console.log('📱 Received message:', message);
                
                switch(message.action) {
                  case 'addDriverMarker':
                    addDriverMarker(message.lat, message.lng, message.driverName);
                    break;
                  case 'calculateRouteToDriver':
                    calculateRouteToDriver(message.userLat, message.userLng, message.driverLat, message.driverLng);
                    break;
                  case 'clearDriverMarker':
                    if (driverMarker) {
                      map.removeLayer(driverMarker);
                      driverMarker = null;
                    }
                    if (routeToDriver) {
                      map.removeLayer(routeToDriver);
                      routeToDriver = null;
                    }
                    break;
                }
              } catch (error) {
                console.error('❌ Error processing message:', error);
              }
            });

            // Initialize with user location if available
            ${location ? `
              currentUserLocation = { lat: ${location.coords.latitude}, lng: ${location.coords.longitude} };
              addUserLocationMarker(${location.coords.latitude}, ${location.coords.longitude}, ${location.coords.accuracy || 20});
            ` : ''}
        </script>
    </body>
    </html>
  `;

  // Create ride estimate for favorites flow
  const createRideEstimateForFavorite = async (destination) => {
    console.log('🎯 Criando estimate para favorito:', destination);
    
    try {
      // Calcular rota primeiro
      let routeData = null;
      if (location?.coords && destination.lat && destination.lng) {
        routeData = await calculateRouteInfo(
          location.coords.latitude,
          location.coords.longitude,
          destination.lat,
          destination.lng
        );
      }
      
      // Usar dados da rota ou calcular valores mais realistas
      let estimatedDistance, estimatedTime;
      
      if (routeData?.distance && routeData?.duration) {
        estimatedDistance = routeData.distance;
        estimatedTime = routeData.duration;
        console.log('✅ Usando dados da rota OSRM');
      } else {
        // Calcular distância em linha reta como fallback mais realista
        const straightLineDistance = apiService.calculateDistance(
          location?.coords?.latitude || -8.8390,
          location?.coords?.longitude || 13.2894,
          destination.lat,
          destination.lng
        );
        
        // Validar e limitar valores
        if (straightLineDistance < 0.1 || straightLineDistance > 100) {
          console.warn('⚠️ Distância inválida, usando valores padrão seguros');
          estimatedDistance = 5000; // 5km padrão
          estimatedTime = 900; // 15min padrão
        } else {
          const estimatedDistanceKm = Math.min(straightLineDistance * 1.3, 100);
          estimatedDistance = estimatedDistanceKm * 1000;
          
          const averageSpeedKmh = estimatedDistanceKm <= 10 ? 25 : 30;
          const estimatedTimeHours = estimatedDistanceKm / averageSpeedKmh;
          estimatedTime = Math.max(estimatedTimeHours * 3600, 300);
        }
        
        console.log('⚠️ OSRM falhou, usando cálculo fallback:');
        console.log(`📏 Distância em linha reta: ${straightLineDistance.toFixed(2)} km`);
        console.log(`📏 Distância estimada: ${(estimatedDistance/1000).toFixed(2)} km`);
        console.log(`⏱️ Tempo estimado: ${Math.round(estimatedTime/60)} min`);
      }
      const vehicleType = selectedTaxiType === 'Privado' ? 'privado' : 'coletivo';
      console.log('🚗 [Favorito] selectedTaxiType:', selectedTaxiType);
      console.log('🎯 [Favorito] vehicleType mapeado:', vehicleType);
      
      // Calcular tarifa
      let estimatedFare;
      try {
        if (vehicleType === 'coletivo') {
          // Para coletivos, usar preço da rota específica
          estimatedFare = getCollectiveRoutePrice(destination.name || destination.address);
          console.log('🚌 [Favorito] Preço fixo do coletivo:', estimatedFare, 'AOA');
        } else {
          // Para privados, calcular baseado na distância e tempo
          const distanceInKm = estimatedDistance / 1000;
          const timeInMinutes = estimatedTime / 60;
          console.log('📏 [Favorito] Distância em km:', distanceInKm);
          console.log('⏱️ [Favorito] Tempo em minutos:', timeInMinutes);
          estimatedFare = apiService.calculateEstimatedFare(distanceInKm, timeInMinutes, vehicleType);
          console.log('💰 [Favorito] Tarifa calculada privado:', estimatedFare, 'AOA');
        }
      } catch (error) {
        console.error('❌ Erro ao calcular tarifa:', error);
        estimatedFare = vehicleType === 'privado' ? 1000 : 500;
      }
      
      // Validar valores antes de formatação
      if (!estimatedDistance || isNaN(estimatedDistance) || estimatedDistance <= 0) {
        console.warn('⚠️ estimatedDistance inválido:', estimatedDistance, '. Usando padrão.');
        estimatedDistance = 5000; // 5km padrão
      }
      if (!estimatedTime || isNaN(estimatedTime) || estimatedTime <= 0) {
        console.warn('⚠️ estimatedTime inválido:', estimatedTime, '. Usando padrão.');
        estimatedTime = 900; // 15min padrão
      }
      if (!estimatedFare || isNaN(estimatedFare) || estimatedFare <= 0) {
        console.warn('⚠️ estimatedFare inválido:', estimatedFare, '. Recalculando.');
        const distanceInKm = estimatedDistance / 1000;
        const timeInMinutes = estimatedTime / 60;
        estimatedFare = apiService.calculateEstimatedFare(distanceInKm, timeInMinutes, vehicleType);
      }
      
      // Garantir formatação correta dos textos
      const distanceInKm = Math.min(Math.max(estimatedDistance / 1000, 0.1), 999.9);
      const timeInMin = Math.min(Math.max(Math.round(estimatedTime / 60), 1), 9999);
      
      const estimate = {
        distance: estimatedDistance,
        distanceText: routeData?.distanceText || `${distanceInKm.toFixed(1)} km`,
        time: estimatedTime,
        timeText: routeData?.durationText || `${timeInMin} min`,
        fare: estimatedFare,
        vehicleType: vehicleType,
        destination: {
          name: destination.name || destination.address,
          address: destination.address,
          lat: destination.lat,
          lng: destination.lng
        }
      };
      
      console.log('📊 Estimate criado:', estimate);
      return estimate;
      
    } catch (error) {
      console.error('❌ Erro ao criar estimate:', error);
      return null;
    }
  };

  // Calculate route using OSRM API
  const calculateRouteInfo = async (startLat, startLng, endLat, endLng) => {
    try {
      console.log('🛣️ Calculating route info from React Native...');
      console.log(`📍 From: ${startLat}, ${startLng} To: ${endLat}, ${endLng}`);
      
      // Try multiple routing services
      const routingServices = [
        {
          url: `${OSRM_BASE_URL}/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TravelApp/1.0'
          }
        },
        {
          url: `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf62488a7e4a14a9164a8d8a3c49f973c8e8ef&start=${startLng},${startLat}&end=${endLng},${endLat}`,
          headers: {
            'Accept': 'application/json'
          }
        }
      ];
      
      let data = null;
      let response = null;
      
      // Try each service until one works
      for (const service of routingServices) {
        try {
          console.log('Trying routing service:', service.url.split('?')[0]);
          response = await fetch(service.url, {
            method: 'GET',
            headers: service.headers,
            timeout: 10000
          });
          
          console.log('📡 Response status:', response.status);
          
          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch (err) {
          console.log('Routing service failed, trying next...');
        }
      }
      
      if (!data) {
        throw new Error('All routing services failed');
      }
      console.log('📊 OSRM Response:', JSON.stringify(data, null, 2));
      
      if (data.routes && data.routes?.length > 0) {
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
      } else {
        console.warn('⚠️ No routes found in OSRM response');
        console.log('📄 Full response:', data);
      }
    } catch (error) {
      console.error('❌ Route calculation error:', error);
      console.error('❌ Error details:', error.message);
      
      // Tentar calcular distância em linha reta como fallback
      try {
        const straightLineDistance = apiService.calculateDistance(startLat, startLng, endLat, endLng);
        
        // Validar se a distância é realista (entre 0.1km e 100km para Luanda)
        if (straightLineDistance < 0.1 || straightLineDistance > 100) {
          console.warn('⚠️ Distância calculada fora do esperado:', straightLineDistance, 'km');
          return null;
        }
        
        // Calcular distância de rota (30% maior que linha reta)
        const estimatedDistanceKm = Math.min(straightLineDistance * 1.3, 100); // Max 100km
        const estimatedDistance = estimatedDistanceKm * 1000; // Converter para metros
        
        // Calcular tempo baseado na velocidade média em Luanda (20-30 km/h)
        const averageSpeedKmh = estimatedDistanceKm <= 10 ? 25 : 30; // Mais lento na cidade
        const estimatedTimeHours = estimatedDistanceKm / averageSpeedKmh;
        const estimatedTime = Math.max(estimatedTimeHours * 3600, 300); // Mínimo 5 min
        
        console.log('🔄 Using fallback calculation:');
        console.log(`📏 Straight line: ${straightLineDistance.toFixed(2)} km`);
        console.log(`📏 Estimated route: ${estimatedDistanceKm.toFixed(2)} km`);
        console.log(`⏱️ Estimated time: ${Math.round(estimatedTime/60)} min`);
        console.log(`🚗 Average speed: ${averageSpeedKmh} km/h`);
        
        const fallbackRouteData = {
          distance: estimatedDistance,
          duration: estimatedTime,
          distanceText: `${estimatedDistanceKm.toFixed(1)} km`,
          durationText: `${Math.round(estimatedTime / 60)} min`
        };
        
        setRouteInfo(fallbackRouteData);
        return fallbackRouteData;
      } catch (fallbackError) {
        console.error('❌ Fallback calculation also failed:', fallbackError);
      }
    }
    return null;
  };

  // Search places with OpenStreetMap Nominatim API
  const searchPlacesWithOSM = async (query) => {
    if (!query || query?.length < 2) return [];
    
    console.log('🔍 Searching for:', query);
    setIsSearching(true);
    
    try {
      const userLat = location?.coords.latitude || -8.8390;
      const userLng = location?.coords.longitude || 13.2894;
      
      console.log('📍 User location:', userLat, userLng);
      
      // Try multiple geocoding services for search
      const searchServices = [
        {
          url: `https://nominatim.openstreetmap.fr/search?format=json&q=${encodeURIComponent(query)}&limit=20&addressdetails=1&extratags=1&namedetails=1&accept-language=pt&countrycodes=AO`,
          headers: {
            'User-Agent': 'TravelApp/1.0 (Angola Taxi Service)',
            'Referer': 'https://travel-app.com'
          }
        },
        {
          url: `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=20&addressdetails=1&extratags=1&namedetails=1&accept-language=pt&countrycodes=AO`,
          headers: {
            'User-Agent': 'TravelApp/1.0 (contact@travel-app.com)',
            'Referer': 'https://travel-app.com'
          }
        },
        {
          url: `https://us1.locationiq.com/v1/search.php?key=pk.a5c3fbf2119bfb2275b62eddbccd76b3&q=${encodeURIComponent(query)}&format=json&limit=20&countrycodes=AO&accept-language=pt`,
          headers: {}
        }
      ];
      
      let data = null;
      
      // Try each service until one works
      for (const service of searchServices) {
        try {
          console.log('Trying search service:', service.url.split('?')[0]);
          const response = await fetch(service.url, {
            headers: service.headers
          });
          
          if (response.ok) {
            data = await response.json();
            console.log('📡 Search API response:', data);
            break;
          }
        } catch (err) {
          console.log('Search service failed, trying next...');
        }
      }
      
      if (!data) {
        throw new Error('All search services failed');
      }
      
      console.log('📡 Nominatim API response:', data);
      
      if (data && data?.length > 0) {
        let formattedPlaces = data.map((item, index) => ({
          id: `osm_${index}`,
          name: item.display_name.split(',')[0],
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          distance: item.distance,
          categories: item.categories || [],
          isValidForCollective: isValidCollectiveRoute(item.display_name.split(',')[0])
        }));
        
        // Se coletivo estiver selecionado, filtrar apenas rotas válidas
        if (selectedTaxiType === 'Coletivo') {
          const validPlaces = formattedPlaces.filter(place => place.isValidForCollective);
          const invalidCount = formattedPlaces.length - validPlaces.length;
          
          if (invalidCount > 0) {
            console.log(`🚌 Filtrando para coletivo: ${validPlaces.length} válidos de ${formattedPlaces.length} encontrados`);
            Toast.show({
              type: "info",
              text1: `${validPlaces.length} destinos disponíveis`,
              text2: `Para táxis coletivos (${invalidCount} destinos filtrados)`,
              visibilityTime: 3000,
            });
          }
          
          formattedPlaces = validPlaces;
        }
        
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
    
    // Validar se a rota é permitida para coletivos
    if (!validateCollectiveRoute(selectedLocation)) {
      // Se a rota não é válida para coletivo, não continuar
      return;
    }
    
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
      console.log('📊 routeInfo disponível:', !!routeInfo, routeInfo);
      
      let estimatedDistance, estimatedTime;
      
      if (routeInfo?.distance && routeInfo?.duration) {
        estimatedDistance = routeInfo.distance;
        estimatedTime = routeInfo.duration;
        console.log('✅ Usando dados do routeInfo');
      } else {
        // Calcular distância em linha reta como fallback mais realista
        const straightLineDistance = apiService.calculateDistance(
          location?.coords?.latitude || -8.8390,
          location?.coords?.longitude || 13.2894,
          selectedLocation.lat,
          selectedLocation.lng
        );
        
        // Validar e limitar valores
        if (straightLineDistance < 0.1 || straightLineDistance > 100) {
          console.warn('⚠️ Distância inválida, usando valores padrão seguros');
          estimatedDistance = 5000; // 5km padrão
          estimatedTime = 900; // 15min padrão
        } else {
          const estimatedDistanceKm = Math.min(straightLineDistance * 1.3, 100);
          estimatedDistance = estimatedDistanceKm * 1000;
          
          const averageSpeedKmh = estimatedDistanceKm <= 10 ? 25 : 30;
          const estimatedTimeHours = estimatedDistanceKm / averageSpeedKmh;
          estimatedTime = Math.max(estimatedTimeHours * 3600, 300);
        }
        
        console.log('⚠️ routeInfo indisponível, usando cálculo fallback:');
        console.log(`📏 Distância em linha reta: ${straightLineDistance.toFixed(2)} km`);
        console.log(`📏 Distância estimada: ${(estimatedDistance/1000).toFixed(1)} km`);
        console.log(`⏱️ Tempo estimado: ${Math.round(estimatedTime/60)} min`);
      }
      const vehicleType = selectedTaxiType === 'Privado' ? 'privado' : 'coletivo';
      console.log('🚗 selectedTaxiType:', selectedTaxiType);
      console.log('🎯 vehicleType mapeado:', vehicleType);
      console.log('📏 Distância estimada:', estimatedDistance, 'metros');
      console.log('⏱️ Tempo estimado:', estimatedTime, 'segundos');
      
      let estimatedFare;
      if (vehicleType === 'coletivo') {
        // Para coletivos, usar preço da rota específica
        estimatedFare = getCollectiveRoutePrice(selectedLocation.name || selectedLocation.address);
        console.log('🚌 Preço fixo do coletivo:', estimatedFare, 'AOA');
      } else {
        // Para privados, calcular baseado na distância e tempo
        const distanceInKm = estimatedDistance / 1000;
        const timeInMinutes = estimatedTime / 60;
        console.log('📏 Distância em km:', distanceInKm);
        console.log('⏱️ Tempo em minutos:', timeInMinutes);
        
        // Calcular tarifa original usando dados do Supabase
        const originalFare = await apiService.calculateEstimatedFareAsync(distanceInKm, timeInMinutes, vehicleType);
        console.log('💰 Tarifa original privado (Supabase):', originalFare, 'AOA');
        
        // Aplicar precificação competitiva usando PricingHelper
        const competitivePricing = PricingHelper.calculateCompetitivePrice(
          originalFare, 
          null, // Sem preço da Yango por enquanto (pode ser adicionado via input depois)
          vehicleType, 
          distanceInKm
        );
        
        // Usar o preço competitivo como fare final
        estimatedFare = competitivePricing.finalPrice;
        console.log('💰 Tarifa competitiva aplicada:', estimatedFare, 'AOA');
        console.log('💰 Economia gerada:', competitivePricing.savings, 'AOA');
      }
      
      // Validar valores antes de formatação
      if (!estimatedDistance || isNaN(estimatedDistance) || estimatedDistance <= 0) {
        console.warn('⚠️ estimatedDistance inválido:', estimatedDistance, '. Usando padrão.');
        estimatedDistance = 5000; // 5km padrão
      }
      if (!estimatedTime || isNaN(estimatedTime) || estimatedTime <= 0) {
        console.warn('⚠️ estimatedTime inválido:', estimatedTime, '. Usando padrão.');
        estimatedTime = 900; // 15min padrão
      }
      if (!estimatedFare || isNaN(estimatedFare) || estimatedFare <= 0) {
        console.warn('⚠️ estimatedFare inválido:', estimatedFare, '. Recalculando.');
        const distanceInKm = estimatedDistance / 1000;
        const timeInMinutes = estimatedTime / 60;
        estimatedFare = apiService.calculateEstimatedFare(distanceInKm, timeInMinutes, vehicleType);
      }
      
      // Garantir formatação correta dos textos
      const distanceInKm = Math.min(Math.max(estimatedDistance / 1000, 0.1), 999.9);
      const timeInMin = Math.min(Math.max(Math.round(estimatedTime / 60), 1), 9999);
      
      console.log('🔍 Debug formatação:');
      console.log('📏 estimatedDistance (metros):', estimatedDistance);
      console.log('📏 distanceInKm:', distanceInKm);
      console.log('⏱️ estimatedTime (segundos):', estimatedTime);
      console.log('⏱️ timeInMin:', timeInMin);
      console.log('💰 estimatedFare:', estimatedFare);
      console.log('📄 routeInfo?.distanceText:', routeInfo?.distanceText);
      console.log('📄 routeInfo?.durationText:', routeInfo?.durationText);
      
      const estimate = {
        distance: estimatedDistance,
        distanceText: routeInfo?.distanceText || `${distanceInKm.toFixed(1)} km`,
        time: estimatedTime,
        timeText: routeInfo?.durationText || `${timeInMin} min`,
        fare: estimatedFare,
        vehicleType: vehicleType,
        destination: selectedLocation
      };
      
      console.log('📊 Estimativa calculada:', estimate);
                console.log('🎭 Definindo rideEstimate e mostrando modal...');
          console.log('🔍 DEBUG - estimate final:', JSON.stringify(estimate, null, 2));
          setRideEstimate(estimate);
          setShowConfirmationModal(true);
          console.log('✅ Modal de confirmação deve estar visível agora!');
      
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

      // Conectar WebSocket se não estiver conectado
      if (!apiService.socket || !apiService.isConnected) {
        console.log('🔌 Conectando WebSocket...');
        const socketUserId = passengerProfile?.id || passengerProfile?.phone || 'passenger_temp';
        apiService.connectSocket('passenger', socketUserId);
        // Aguardar um pouco para conexão
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // CRÍTICO: Registrar callback para ride_accepted ANTES de criar a solicitação
      console.log('🎯 Registrando callback para ride_accepted...');
      const removeCallback = apiService.onEvent('ride_accepted', (data) => {
        console.log('🎉 CORRIDA ACEITA PELO MOTORISTA!', data);
        
        // Parar busca imediatamente
        setIsSearchingDrivers(false);
        setDriversFound(true);
        setRequestStatus('accepted');
        
        // Limpar intervalos
        if (window.driverSearchInterval) {
          clearInterval(window.driverSearchInterval);
          window.driverSearchInterval = null;
        }
        
        // Extrair dados do veículo
        const vehicleData = data.vehicleInfo || data.ride?.vehicleInfo || data.driver?.vehicleInfo;
        console.log('🚗 Dados do veículo:', vehicleData);
        
        // PREPARAR dados do motorista
        const driverData = {
          id: data.driverId || data.driver?.id || data.ride?.driverId,
          name: data.driverName || data.driver?.name || data.ride?.driverName,
          phone: data.driverPhone || data.driver?.phone || data.ride?.driverPhone || '',
          vehicleInfo: vehicleData,
          rating: data.driver?.rating || data.ride?.rating || 4.5,
          estimatedArrival: data.estimatedArrival
        };

        console.log('🔍 [BUSCA] Dados preparados do motorista:', driverData);

        // SÓ SALVAR se os dados são válidos
        if (isValidDriverData(driverData)) {
          setDriverInfo(driverData);
          console.log('✅ [BUSCA] Dados válidos do motorista salvos');
        } else {
          console.warn('⚠️ [BUSCA] Dados do motorista inválidos, rejeitando corrida');
          // Se os dados são inválidos, rejeitar a aceitação
          setRequestStatus('rejected');
          setIsSearchingDrivers(true); // Continuar procurando
          return;
        }
        
        // Atualizar corrida atual
        if (data.ride) {
          setCurrentRide(data.ride);
        }
        
        // Mostrar notificação
        Toast.show({
          type: "success",
          text1: "Motorista a caminho! 🚗",
          text2: `${data.driverName || data.driver?.name || 'Motorista'} - ${vehicleData.model || 'Veículo'} ${vehicleData.color || ''}`,
          visibilityTime: 5000,
        });
        
        // Mostrar localização do motorista no mapa
        // IMPORTANTE: Se não há localização, simular uma próxima
        let driverLoc = data.driver?.location || data.driverLocation;
        
        if (!driverLoc || (!driverLoc.lat && !driverLoc.latitude)) {
          console.log('⚠️ Localização do motorista não disponível, usando localização simulada...');
          // Simular localização próxima (500m de distância)
          if (location?.coords) {
            const offsetLat = (Math.random() - 0.5) * 0.01; // ~500m
            const offsetLng = (Math.random() - 0.5) * 0.01; // ~500m
            driverLoc = {
              lat: location.coords.latitude + offsetLat,
              lng: location.coords.longitude + offsetLng
            };
            console.log('🎯 Localização simulada criada:', driverLoc);
          } else {
            console.error('❌ Não foi possível criar localização simulada');
            return;
          }
        }
        
        // Iniciar polling de localização real do motorista
        console.log('📍 Iniciando polling de localização real do motorista...');
        const startLocationPolling = () => {
          const pollingInterval = setInterval(async () => {
            // Usar refs para obter valores atuais
            const currentDriverInfo = driverInfoRef.current;
            const currentStatus = requestStatusRef.current;
            
            if (!currentDriverInfo || !currentDriverInfo.id || 
                currentStatus === 'cancelled' || 
                currentStatus === 'completed') {
              console.log('🛑 Parando polling - corrida finalizada ou motorista não definido');
              clearInterval(pollingInterval);
              if (window.driverLocationPolling === pollingInterval) {
                window.driverLocationPolling = null;
              }
              return;
            }
            
            try {
              // Requisitar localização via socket
              if (apiService.socket && apiService.isConnected) {
                apiService.socket.emit('request_driver_location', {
                  driverId: driverInfo.id,
                  requestId: requestId || currentRide?.id
                });
                console.log('📡 Solicitando localização real do motorista...');
              }
            } catch (error) {
              console.error('❌ Erro ao solicitar localização:', error);
            }
          }, 10000); // A cada 10 segundos
          
          // Salvar referência do interval
          window.driverLocationPolling = pollingInterval;
        };
        
        // Iniciar polling após 3 segundos
        setTimeout(startLocationPolling, 3000);
        
        console.log('🗺️ Usando localização do motorista:', driverLoc);
        setDriverLocation(driverLoc);
        
          // SIMULAR MOVIMENTO DO MOTORISTA (apenas se não há polling ativo)
          if (location?.coords && driverLoc && !window.driverLocationPolling) {
            console.log('🎮 Iniciando simulação de movimento do motorista');
            
            // Limpar simulação anterior se existir
            if (window.driverMovementInterval) {
              clearInterval(window.driverMovementInterval);
            }
            
            // Função para simular movimento
            const simulateMovement = () => {
              let steps = 0;
              const maxSteps = 30; // 30 passos = 1.5 minutos de simulação
            
            const movementInterval = setInterval(() => {
              // Usar refs para obter valores atuais
              const currentDriverInfo = driverInfoRef.current;
              const currentStatus = requestStatusRef.current;
              
              if (!currentDriverInfo || !currentDriverInfo.id || 
                  currentStatus === 'cancelled' || 
                  currentStatus === 'completed') {
                console.log('❌ Parando simulação - corrida finalizada');
                clearInterval(movementInterval);
                if (window.driverMovementInterval === movementInterval) {
                  window.driverMovementInterval = null;
                }
                return;
              }
              
              if (steps >= maxSteps) {
                console.log('🎯 Motorista chegou (simulação)');
                setDriverArrived(true);
                // NÃO limpar o intervalo aqui - manter motorista visível
                // Apenas parar de mover
                return;
              }
              
              // Calcular nova posição (mover em direção ao passageiro)
              const currentLoc = driverLocation || driverLoc;
              const targetLat = location.coords.latitude;
              const targetLng = location.coords.longitude;
              
              const latDiff = targetLat - (currentLoc.lat || currentLoc.latitude);
              const lngDiff = targetLng - (currentLoc.lng || currentLoc.longitude);
              
              // Mover 5% da distância a cada passo (mais lento)
              const newLat = (currentLoc.lat || currentLoc.latitude) + (latDiff * 0.05);
              const newLng = (currentLoc.lng || currentLoc.longitude) + (lngDiff * 0.05);
              
              // Adicionar variação aleatória pequena
              const randomLat = (Math.random() - 0.5) * 0.0002;
              const randomLng = (Math.random() - 0.5) * 0.0002;
              
              const newLocation = {
                lat: newLat + randomLat,
                lng: newLng + randomLng
              };
              
              console.log(`🚗 [SIMULAÇÃO] Passo ${steps + 1}/${maxSteps}:`, newLocation);
              
              // Atualizar estado diretamente e disparar evento
              setDriverLocation(newLocation);
              
              // Disparar evento de atualização de localização
              if (apiService.eventCallbacks && apiService.eventCallbacks.has('driver_location_update')) {
                const currentDriver = driverInfoRef.current;
                apiService.triggerCallbacks('driver_location_update', {
                  driverId: currentDriver?.id || data.driver?.id || data.driverId,
                  location: newLocation,
                  estimatedArrival: `${Math.max(1, maxSteps - steps)} min`
                });
              }
              
              // Atualizar marcador no mapa diretamente
              if (webViewRef.current) {
                const updateScript = `
                  if (typeof window.__updateDriverLocation === 'function') {
                    window.__updateDriverLocation(
                      ${newLocation.lat}, 
                      ${newLocation.lng}
                    );
                  }
                `;
                webViewRef.current.injectJavaScript(updateScript);
              }
              
              steps++;
            }, 3000); // Atualizar a cada 3 segundos (mais frequente)
            
            // Salvar intervalo para poder parar se necessário
            window.driverMovementInterval = movementInterval;
          };
          
          // Iniciar simulação após 2 segundos
          setTimeout(simulateMovement, 2000);
        }
        
        // Atualizar mapa para mostrar motorista
        if (webViewRef.current && driverLoc.lat && driverLoc.lng) {
            const driverScript = `
              if (typeof window.__addDriverMarker === 'function') {
                window.__addDriverMarker(
                  ${driverLoc.lat || driverLoc.latitude}, 
                  ${driverLoc.lng || driverLoc.longitude},
                  ${JSON.stringify(data.driverName || 'Motorista')}
                );
                console.log('✅ Marcador do motorista adicionado no mapa');
                
                // Calcular rota do motorista até o passageiro
                if (window.currentUserLocation) {
                  window.__calculateRouteToDriver(
                    window.currentUserLocation.lat,
                    window.currentUserLocation.lng,
                    ${driverLoc.lat || driverLoc.latitude},
                    ${driverLoc.lng || driverLoc.longitude}
                  ).then(() => {
                    console.log('✅ Rota do motorista calculada');
                  });
                }
              } else {
                console.error('❌ Função __addDriverMarker não encontrada');
              }
            `;
            webViewRef.current.injectJavaScript(driverScript);
        }
      });
      
      // Guardar função para remover callback se necessário
      window.removeRideAcceptedCallback = removeCallback;
      
      // Registrar callback para atualização de localização do motorista
      console.log('📍 Registrando callback para atualização de localização...');
      apiService.onEvent('driver_location_update', (data) => {
        console.log('📍 Localização do motorista atualizada:', data);
        
        // Verificar se é o motorista da corrida atual
        if (driverInfo && data.driverId === driverInfo.id) {
          // Atualizar estado da localização
          const newLocation = {
            lat: data.location?.lat || data.location?.latitude,
            lng: data.location?.lng || data.location?.longitude
          };
          
          setDriverLocation(newLocation);
          
          // Atualizar informações do motorista
          setDriverInfo(prev => ({
            ...prev,
            location: newLocation,
            estimatedArrival: data.estimatedArrival || prev.estimatedArrival
          }));
          
          // Atualizar mapa em tempo real
          if (webViewRef.current && newLocation.lat && newLocation.lng) {
            const updateScript = `
              if (typeof window.__updateDriverLocation === 'function') {
                window.__updateDriverLocation(
                  ${newLocation.lat}, 
                  ${newLocation.lng}, 
                  ${JSON.stringify(driverInfo.name || 'Motorista')}
                );
                console.log('🔄 Localização do motorista atualizada no mapa');
              } else if (typeof window.__addDriverMarker === 'function') {
                // Fallback: adicionar marcador se update não existir
                window.__addDriverMarker(
                  ${newLocation.lat}, 
                  ${newLocation.lng},
                  ${JSON.stringify(driverInfo.name || 'Motorista')}
                );
              }
            `;
            webViewRef.current.injectJavaScript(updateScript);
            
            // Calcular distância até o passageiro
            if (location?.coords) {
              const distance = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                newLocation.lat,
                newLocation.lng
              );
              
              console.log(`📏 Distância até o motorista: ${Math.round(distance)}m`);
              
              // Se motorista está muito perto (menos de 50 metros)
              if (distance <= 50 && !isDriverNearby) {
                setIsDriverNearby(true);
                Toast.show({
                  type: "info",
                  text1: "Motorista chegou! 🚗",
                  text2: "Prepare-se para embarcar",
                  visibilityTime: 4000,
                });
              }
            }
          }
        }
      })

      // Criar solicitação de corrida via API
      // FIX: Removido check de apiPassengerId que sempre falhava
      if (passengerProfile && rideEstimate) {
        try {
          // Gerar ID se não existir
          const passengerId = passengerProfile.apiPassengerId || 
                              passengerProfile.id || 
                              passengerProfile.phone || 
                              `passenger_${Date.now()}`;
          console.log('🚗 Criando corrida para passageiro:', passengerId);
          console.log('📸 Foto do perfil do passageiro:', passengerProfile.profileImageUrl || 'Nenhuma foto');
          
          const rideData = {
            passengerId: passengerId, // Usar o ID gerado acima
            passengerName: passengerProfile.name || 'Passageiro',
            passengerPhone: passengerProfile.phone,
            pickup: {
              address: currentLocationName,
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
          
          console.log('🔍 DEBUG - rideData enviado para API:', JSON.stringify(rideData, null, 2));
          console.log('🔍 DEBUG - Valores específicos:');
          console.log('   - estimatedFare:', rideEstimate.fare, typeof rideEstimate.fare);
          console.log('   - estimatedDistance:', rideEstimate.distance, typeof rideEstimate.distance);
          console.log('   - estimatedTime:', rideEstimate.time, typeof rideEstimate.time);
          
          const rideResponse = await apiService.createRideRequest(rideData);
          setCurrentRide(rideResponse.data.ride);
          
          console.log('✅ Solicitação criada via API:', rideResponse);
          
          // IMPLEMENTAR POLLING COMO FALLBACK
          if (rideResponse.data?.ride?.id) {
            console.log('🔄 Iniciando polling de fallback para corrida:', rideResponse.data.ride.id);
            
            const stopPolling = apiService.startRideStatusPolling(
              rideResponse.data.ride.id,
              (updatedRide) => {
                console.log('🔍 [POLLING] Status atualizado:', updatedRide.status);
                
                console.log('🔍 [POLLING DEBUG] Dados completos do updatedRide:', JSON.stringify(updatedRide, null, 2));
                console.log('🔍 [POLLING DEBUG] Status atual:', updatedRide.status);
                console.log('🔍 [POLLING DEBUG] Status anterior:', requestStatus);
                
                // Se corrida foi aceita e ainda não tínhamos essa informação
                if (updatedRide.status === 'accepted' && requestStatus !== 'accepted') {
                  console.log('🎆 [POLLING] Corrida aceita detectada via polling!');
                  
                  // EXTRAIR DADOS DO VEÍCULO DO POLLING
                  let vehicleData = updatedRide.vehicleInfo || {};
                  console.log('🚗 [POLLING] Dados do veículo encontrados:', vehicleData);
                  
                  // Simular evento ride_accepted para atualizar UI
                  const acceptedData = {
                    rideId: updatedRide.id,
                    ride: {
                      ...updatedRide,
                      vehicleInfo: vehicleData
                    },
                    driver: {
                      id: updatedRide.driverId,
                      name: updatedRide.driverName || 'Motorista',
                      phone: updatedRide.driverPhone,
                      rating: updatedRide.rating || 4.8,
                      vehicleInfo: vehicleData
                    },
                    vehicleInfo: vehicleData,
                    estimatedArrival: '5-10 minutos',
                    fromPolling: true
                  };
                  
                  console.log('🚀 [POLLING] Disparando ride_accepted via polling:', acceptedData);
                  
                  // Disparar callbacks manualmente
                  apiService.triggerCallbacks('ride_accepted', acceptedData);
                }
              },
              2000, // Verificar a cada 2 segundos
              45000 // Por até 45 segundos
            );
            
            // Guardar função para parar polling se necessário
            window.stopRidePolling = stopPolling;
          }
          
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
    
    // Salvar interval globalmente para poder parar quando motorista aceitar
    window.driverSearchInterval = driverSearchInterval;
      
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

 

  // Load app settings on component mount
  useEffect(() => {
    const loadAppSettings = async () => {
      try {
        const settings = await LocalDatabase.getAppSettings();
        if (settings && settings.defaultTaxiType) {
          console.log('📱 Loading saved taxi type:', settings.defaultTaxiType);
          setSelectedTaxiType(settings.defaultTaxiType);
        }
      } catch (error) {
        console.error('Error loading app settings:', error);
      }
    };

    loadAppSettings();
  }, []);

  // Animate dropdown when request is accepted or minimized
  useEffect(() => {
    if (requestStatus === 'accepted') {
      // Ajustar valores para melhor visibilidade
      // Quando minimizado, deixar 180px visível (suficiente para ver e clicar)
      const targetValue = isDropdownMinimized ? height - 180 : 0; 
      console.log('🎛️ Animando dropdown:', { isDropdownMinimized, targetValue, height });
      
      Animated.spring(slideAnim, {
        toValue: targetValue,
        useNativeDriver: true,
        tension: 100,
        friction: 12, // Mais fricção para movimento mais suave
      }).start();
      
      // Simular localização do motorista quando aceito
      if (location) {
        const driverLat = location.latitude + (Math.random() - 0.5) * 0.01; // ~500m de distância
        const driverLng = location.longitude + (Math.random() - 0.5) * 0.01;
        setDriverLocation({ latitude: driverLat, longitude: driverLng });
        setShowRouteToDriver(true);
        setDriverArrived(false);
        
        // Simular chegada do motorista após 30 segundos
        setTimeout(() => {
          console.log('🚗 Driver arrived! Switching to destination route');
          setDriverArrived(true);
        }, 30000); // 30 segundos
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setShowRouteToDriver(false);
      setDriverLocation(null);
    }
  }, [requestStatus, isDropdownMinimized]);

  // Handle driver location and route display com sistema avançado
  useEffect(() => {
    if (driverLocation && location && webViewRef.current && !driverArrived) {
      // Show route to driver when driver hasn't arrived yet - USAR NOVA FUNÇÃO MELHORADA
      console.log('🚗 [ENHANCED] Configurando visualização avançada da corrida aceita:', {
        driverLat: driverLocation.lat || driverLocation.latitude,
        driverLng: driverLocation.lng || driverLocation.longitude,
        driverName: driverInfo?.name,
        userLat: location.coords.latitude,
        userLng: location.coords.longitude
      });
      
      const driverLat = driverLocation.lat || driverLocation.latitude;
      const driverLng = driverLocation.lng || driverLocation.longitude;
      
      const enhancedDriverScript = `
        console.log('🎆 [ENHANCED] Executando visualização avançada da corrida aceita');
        console.log('Localização do motorista: ${driverLat}, ${driverLng}');
        
        // Usar nova função avançada para mostrar corrida aceita
        if (typeof window.__showRideAcceptedView === 'function') {
          console.log('🎉 [ENHANCED] Configurando visualização completa da corrida aceita');
          window.__showRideAcceptedView(
            ${driverLat}, 
            ${driverLng},
            ${JSON.stringify(driverInfo?.name || 'Motorista')},
            ${location.coords.latitude},
            ${location.coords.longitude}
          );
          console.log('✅ [ENHANCED] Visualização avançada configurada com sucesso');
        } else {
          // Fallback para método anterior
          console.log('⚠️ [ENHANCED] Função avançada não encontrada, usando fallback');
          
          if (typeof window.__addDriverMarker === 'function') {
            window.__addDriverMarker(${driverLat}, ${driverLng}, ${JSON.stringify(driverInfo?.name || 'Motorista')});
          }
          
          if (typeof window.__calculateRouteToDriver === 'function') {
            window.__calculateRouteToDriver(${location.coords.latitude}, ${location.coords.longitude}, ${driverLat}, ${driverLng});
          }
        }
      `;
      
      console.log('🚀 [ENHANCED] Injetando script avançado para visualização da corrida');
      webViewRef.current.injectJavaScript(enhancedDriverScript);
      
    } else if (driverArrived && selectedDestination && location && webViewRef.current) {
      // Switch to destination route when driver arrives - USAR NOVA FUNÇÃO DE TRANSIÇÃO
      console.log('🎯 [ENHANCED] Motorista chegou, executando transição avançada para destino');
      
      const transitionScript = `
        console.log('🎆 [ENHANCED] Executando transição avançada para rota do destino');
        
        // Usar nova função de transição suave
        if (typeof window.__transitionToDestinationRoute === 'function') {
          console.log('🎯 [ENHANCED] Iniciando transição suave para destino');
          window.__transitionToDestinationRoute(
            ${selectedDestination.lat}, 
            ${selectedDestination.lng}, 
            ${JSON.stringify(selectedDestination.name || selectedDestination.address)}
          );
          console.log('✅ [ENHANCED] Transição avançada iniciada');
        } else {
          // Fallback para método anterior
          console.log('⚠️ [ENHANCED] Função de transição não encontrada, usando fallback');
          
          if (typeof window.__clearDriverMarker === 'function') {
            window.__clearDriverMarker();
          }
          
          if (typeof window.__setDestination === 'function') {
            window.__setDestination(${selectedDestination.lat}, ${selectedDestination.lng}, ${JSON.stringify(selectedDestination.name || selectedDestination.address)});
          }
        }
      `;
      
      console.log('🚀 [ENHANCED] Executando script de transição avançada');
      webViewRef.current.injectJavaScript(transitionScript);
      
    } else if (!driverLocation && webViewRef.current) {
      // Clear driver marker when no driver - USAR FUNÇÃO DE RESET
      console.log('🧹 [ENHANCED] Nenhuma localização de motorista, resetando visualização');
      
      const resetScript = `
        console.log('🔄 [ENHANCED] Resetando visualização do mapa');
        
        if (typeof window.__clearDriverMarker === 'function') {
          window.__clearDriverMarker();
          console.log('✅ [ENHANCED] Marcador do motorista limpo');
        }
      `;
      
      webViewRef.current.injectJavaScript(resetScript);
    }
  }, [driverLocation, location, driverInfo, driverArrived, selectedDestination]);

  const handleSearchChange = async (text) => {
    console.log('📝 handleSearchChange called with:', text);
    setDestination(text);
    
    if (text?.length < 2) {
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
    setRideEstimate(null);
    setDriverLocation(null);
    setDriverArrived(false);
    setIsDriverNearby(false);
    
    // Clear route and driver marker on map
    const clearScript = `
      if (typeof window.__clearRoute === 'function') {
        window.__clearRoute();
      }
      if (typeof window.__clearDriverMarker === 'function') {
        window.__clearDriverMarker();
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(clearScript);
    
    // Clear all intervals
    if (window.driverSearchInterval) {
      clearInterval(window.driverSearchInterval);
      window.driverSearchInterval = null;
    }
    if (window.driverMovementInterval) {
      clearInterval(window.driverMovementInterval);
      window.driverMovementInterval = null;
    }
    if (window.driverLocationPolling) {
      clearInterval(window.driverLocationPolling);
      window.driverLocationPolling = null;
    }
  };

  // Estado para armazenar nome da localização atual
  const [currentLocationName, setCurrentLocationName] = useState('Minha localização');

  // Função para encontrar local mais próximo das rotas conhecidas
  const findNearestKnownLocation = (latitude, longitude) => {
    try {
      let closestLocation = null;
      let minDistance = Infinity;
      
      // Calcular distância para todos os locais conhecidos
      Object.entries({
        'Vila de Viana': { lat: -8.9167, lng: 13.3667 },
        '1° De Maio': { lat: -8.8295, lng: 13.2441 },
        'Kilamba': { lat: -8.9833, lng: 13.2167 },
        'Ponte Amarela': { lat: -8.8500, lng: 13.2600 },
        'Golf 2': { lat: -8.8940, lng: 13.2894 },
        'Sequele': { lat: -8.8200, lng: 13.2300 },
        'Estalagem': { lat: -8.8350, lng: 13.2450 },
        'Mutamba': { lat: -8.8390, lng: 13.2894 },
        'Benfica': { lat: -8.8600, lng: 13.2700 },
        'Talatona': { lat: -8.9500, lng: 13.1833 },
        'Kimbango': { lat: -8.8800, lng: 13.3200 },
        'Cuca': { lat: -8.8100, lng: 13.2200 },
        'Capalanga': { lat: -8.8580, lng: 13.3540 },
        'Desvio': { lat: -8.8700, lng: 13.2800 },
        'Zango Oito Mil': { lat: -8.8800, lng: 13.3800 },
        'Hoje Yenda': { lat: -8.8400, lng: 13.2600 },
        'Ilha': { lat: -8.7775, lng: 13.2437 },
        'Camama': { lat: -8.9043, lng: 13.2868 },
        'Zango 3': { lat: -8.8580, lng: 13.3540 }
      }).forEach(([name, coords]) => {
        const distance = calculateDistance(latitude, longitude, coords.lat, coords.lng);
        if (distance < minDistance) {
          minDistance = distance;
          closestLocation = name;
        }
      });
      
      // Se estiver a menos de 500 metros, usar o local conhecido
      if (minDistance < 500) {
        console.log(`📍 Localização próxima encontrada: ${closestLocation} (${Math.round(minDistance)}m)`);
        return closestLocation;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao encontrar local mais próximo:', error);
      return null;
    }
  };

  // Função para fazer geocodificação reversa
  const reverseGeocode = async (latitude, longitude) => {
    try {
      console.log('🔍 Fazendo geocodificação reversa para:', latitude, longitude);
      
      // Primeiro, verificar se está próximo de algum local conhecido
      const nearestKnownLocation = findNearestKnownLocation(latitude, longitude);
      if (nearestKnownLocation) {
        return nearestKnownLocation;
      }
      
      // Try multiple geocoding services with fallback
      const geocodingServices = [
        {
          url: `https://nominatim.openstreetmap.fr/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt&addressdetails=1`,
          headers: {
            'User-Agent': 'TravelApp/1.0 (Angola Taxi Service)',
            'Referer': 'https://travel-app.com'
          }
        },
        {
          url: `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt&addressdetails=1`,
          headers: {
            'User-Agent': 'TravelApp/1.0 (contact@travel-app.com)',
            'Referer': 'https://travel-app.com'
          }
        },
        {
          url: `https://us1.locationiq.com/v1/reverse.php?key=pk.a5c3fbf2119bfb2275b62eddbccd76b3&lat=${latitude}&lon=${longitude}&format=json&accept-language=pt`,
          headers: {}
        }
      ];
      
      let response = null;
      let data = null;
      
      // Try each service until one works
      for (const service of geocodingServices) {
        try {
          console.log('Trying geocoding service:', service.url.split('?')[0]);
          response = await fetch(service.url, {
            headers: service.headers
          });
          
          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch (err) {
          console.log('Geocoding service failed, trying next...');
        }
      }
      
      if (!data) {
        throw new Error('All geocoding services failed');
      }
      
      console.log('🔍 Resultado da geocodificação reversa:', data);
      
      if (data && data.display_name) {
        // Extrair o nome mais relevante (primeiro item antes da primeira vírgula)
        const locationName = data.display_name.split(',')[0].trim();
        console.log('📍 Nome do local extraído:', locationName);
        return locationName;
      }
      
      return 'Localização atual';
    } catch (error) {
      console.error('❌ Erro na geocodificação reversa:', error);
      return 'Localização atual';
    }
  };

  // Função para validar rota de coletivo
  const validateCollectiveRoute = (destination) => {
    console.log('🔍 Validando rota de coletivo:', destination.name, 'para tipo:', selectedTaxiType);
    if (selectedTaxiType !== 'Coletivo') return true; // Privado pode ir a qualquer lugar
    
    const isValid = isValidCollectiveRoute(destination.name || destination.address);
    
    if (!isValid) {
      console.log('❌ Rota não permitida para coletivo:', destination.name);
      
      Toast.show({
        type: "error",
        text1: "Rota não disponível para coletivo",
        text2: "Esta rota não está disponível para táxis coletivos. Selecione 'Privado' ou escolha outro destino.",
        visibilityTime: 5000,
      });
      
      return false;
    }
    
    const routeInfo = getCollectiveRouteInfo(destination.name || destination.address);
    if (routeInfo) {
      console.log('✅ Rota válida para coletivo:', routeInfo.routeName);
      console.log('📍 Coordenadas origem:', routeInfo.originCoords);
      console.log('📍 Coordenadas destino:', routeInfo.destinationCoords);
      Toast.show({
        type: "success",
        text1: "Rota disponível",
        text2: `${routeInfo.routeName} - ${routeInfo.price} AOA`,
        visibilityTime: 3000,
      });
    }
    
    return true;
  };

  // Função para cancelar a modal de confirmação
  const handleCancelConfirmation = () => {
    console.log('❌ Cancelando modal de confirmação e limpando estado...');
    console.log('🧹 Estado antes da limpeza:', {
      destination,
      selectedDestination: !!selectedDestination,
      routeInfo: !!routeInfo,
      rideEstimate: !!rideEstimate
    });
    
    setShowConfirmationModal(false);
    // Resetar todos os estados relacionados
    setDestination('');
    setSelectedDestination(null);
    setRouteInfo(null);
    setRideEstimate(null);
    
    // Limpar rota no mapa
    const js = `window.__clearRoute(); true;`;
    webViewRef.current?.injectJavaScript(js);
    
    console.log('✅ Estado limpo - modal de confirmação cancelada');
  };

  const handleCallDriver = () => {
    if (driverInfo && driverInfo.phone) {
      // In a real app, you would use Linking to make a phone call
      console.log('📞 Ligando para motorista:', driverInfo);
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
    if (!categories || categories?.length === 0) return 'place';
    
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
    console.log('driverinfo: ' + JSON.stringify(driverInfo))
    
    return categoryIcons[categoryId] || 'place';
  };

  const closeDropdowns = () => {
    setIsDropdownOpen(false);
    setIsNavDropdownOpen(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
      {console.log('🏠 HomeScreen render - States:', { isSearchingDrivers, selectedDestination: !!selectedDestination, driverSearchTime, driversFound, selectedTaxiType })}
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

      {/* Zoom Controls - REMOVIDOS */}

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

      {/* Taxi Type Dropdown - Lado Esquerdo Inferior - Redesenhado */}
      {/* Esconder quando corrida é aceita para não sobrepor informações do motorista */}
      {requestStatus !== 'accepted' && (
      <View style={styles.taxiDropdownContainer}>
        <TouchableOpacity
          style={styles.taxiDropdownButton}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          activeOpacity={0.8}
        >
          <View style={styles.taxiDropdownIconContainer}>
            {selectedTaxiType === 'Coletivo' ? (
              <MaterialIcons name="directions-bus" size={24} color="#4285F4" />
            ) : (
              <FontAwesome5 name="car" size={20} color="#4285F4" solid />
            )}
          </View>
          <View style={styles.taxiDropdownTextContainer}>
            <Text style={styles.taxiDropdownLabel}>Tipo de serviço</Text>
            <Text style={styles.taxiDropdownButtonText}>{selectedTaxiType}</Text>
          </View>
          <MaterialIcons 
            name={isDropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={20} 
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
              onPress={async () => {
                console.log('🚌 Changing taxi type to Coletivo');
                
                // Se já tem um destino selecionado, validar se é permitido para coletivo
                if (selectedDestination) {
                  const isValid = isValidCollectiveRoute(selectedDestination.name || selectedDestination.address);
                  if (!isValid) {
                    Toast.show({
                      type: "error",
                      text1: "Rota não disponível para coletivo",
                      text2: "O destino selecionado não está disponível para táxis coletivos. Escolha outro destino ou mantenha 'Privado'.",
                      visibilityTime: 5000,
                    });
                    setIsDropdownOpen(false);
                    return; // Não mudar para coletivo
                  } else {
                    // Rota válida, mostrar informações
                    const routeInfo = getCollectiveRouteInfo(selectedDestination.name || selectedDestination.address);
                    if (routeInfo) {
                      Toast.show({
                        type: "success",
                        text1: "Mudança para coletivo",
                        text2: `${routeInfo.routeName} - ${routeInfo.price} AOA`,
                        visibilityTime: 3000,
                      });
                    }
                  }
                } else {
                  // Se não tem destino selecionado, mostrar dica sobre rotas disponíveis
                  Toast.show({
                    type: "info",
                    text1: "Coletivo selecionado",
                    text2: "Escolha um dos destinos disponíveis para táxis coletivos",
                    visibilityTime: 4000,
                  });
                }
                
                setSelectedTaxiType('Coletivo');
                setIsDropdownOpen(false);
                // Save preference
                try {
                  await LocalDatabase.saveAppSettings({ defaultTaxiType: 'Coletivo' });
                } catch (error) {
                  console.error('Error saving taxi type preference:', error);
                }
              }}
            >
              <View style={styles.taxiOptionIconContainer}>
                <MaterialIcons name="directions-bus" size={24} color={selectedTaxiType === 'Coletivo' ? '#4285F4' : '#6B7280'} />
              </View>
              <View style={styles.taxiOptionTextContainer}>
                <Text style={[
                  styles.taxiDropdownOptionText,
                  selectedTaxiType === 'Coletivo' && styles.taxiDropdownOptionTextSelected
                ]}>
                  Coletivo
                </Text>
                <Text style={styles.taxiOptionDescription}>Rotas fixas, preço mais baixo</Text>
              </View>
              {selectedTaxiType === 'Coletivo' && (
                <MaterialIcons name="check-circle" size={24} color="#4285F4" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taxiDropdownOption,
                selectedTaxiType === 'Privado' && styles.taxiDropdownOptionSelected
              ]}
              onPress={async () => {
                console.log('🚗 Changing taxi type to Privado');
                setSelectedTaxiType('Privado');
                setIsDropdownOpen(false);
                // Save preference
                try {
                  await LocalDatabase.saveAppSettings({ defaultTaxiType: 'Privado' });
                } catch (error) {
                  console.error('Error saving taxi type preference:', error);
                }
              }}
            >
              <View style={styles.taxiOptionIconContainer}>
                <FontAwesome5 name="car" size={20} color={selectedTaxiType === 'Privado' ? '#4285F4' : '#6B7280'} solid />
              </View>
              <View style={styles.taxiOptionTextContainer}>
                <Text style={[
                  styles.taxiDropdownOptionText,
                  selectedTaxiType === 'Privado' && styles.taxiDropdownOptionTextSelected
                ]}>
                  Privado
                </Text>
                <Text style={styles.taxiOptionDescription}>Só para você, qualquer destino</Text>
              </View>
              {selectedTaxiType === 'Privado' && (
                <MaterialIcons name="check-circle" size={24} color="#4285F4" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      )}

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
              editable={true}
              returnKeyType="search"
              blurOnSubmit={false}
              enablesReturnKeyAutomatically={true}
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
                <View style={styles.carIconWrapper}>
                  <FontAwesome5 name="car-side" size={44} color={COLORS.primary[500]} style={styles.carIcon} solid />
                  <View style={styles.carShadow} />
                </View>
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
                <Text style={styles.progressText}>{driverSearchTime}/30s</Text>
              </View>
              
              {/* Indicadores de busca */}
              <View style={styles.searchIndicators}>
                <View style={styles.indicatorRow}>
                  <View style={[styles.indicator, driverSearchTime >= 2 && styles.indicatorActive]}>
                    <MaterialIcons name="search" size={16} color={driverSearchTime >= 2 ? COLORS.primary[500] : "#E5E7EB"} />
                  </View>
                  <Text style={[styles.indicatorText, driverSearchTime >= 2 && styles.indicatorTextActive]}>
                    Analisando área
                  </Text>
                </View>
                
                <View style={styles.indicatorRow}>
                  <View style={[styles.indicator, driverSearchTime >= 5 && styles.indicatorActive]}>
                    <MaterialIcons name="location-on" size={16} color={driverSearchTime >= 5 ? COLORS.primary[500] : "#E5E7EB"} />
                  </View>
                  <Text style={[styles.indicatorText, driverSearchTime >= 5 && styles.indicatorTextActive]}>
                    Localizando motoristas
                  </Text>
                </View>
                
                <View style={styles.indicatorRow}>
                  <View style={[styles.indicator, driverSearchTime >= 8 && styles.indicatorActive]}>
                    <MaterialIcons name="phone" size={16} color={driverSearchTime >= 8 ? COLORS.primary[500] : "#E5E7EB"} />
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

      {/* Request Status - Solicitação Aceita - Dropdown Bottom */}
      {requestStatus === 'accepted' && driverInfo && isValidDriverData(driverInfo) && (
        <Animated.View style={[styles.driverAcceptedDropdown, {
          transform: [{ translateY: slideAnim }]
        }]}>
          {/* Handle Bar - Área clicável melhorada */}
          <TouchableOpacity 
            style={[styles.dropdownHandleContainer, {
              paddingVertical: isDropdownMinimized ? 15 : 8,
              backgroundColor: isDropdownMinimized ? 'rgba(66, 133, 244, 0.05)' : 'transparent',
              borderTopWidth: isDropdownMinimized ? 2 : 0,
              borderTopColor: '#4285F4',
            }]}
            onPress={() => {
              console.log('🎛️ Alternando estado do dropdown:', !isDropdownMinimized);
              setIsDropdownMinimized(!isDropdownMinimized);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.dropdownHandle, isDropdownMinimized && { backgroundColor: '#4285F4', height: 5 }]} />
            {isDropdownMinimized && (
              <View style={styles.expandHintContainer}>
                <MaterialIcons name="keyboard-arrow-up" size={20} color="#4285F4" />
                <Text style={styles.expandHint}>Toque para ver detalhes</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {isDropdownMinimized ? (
            /* Versão Minimizada */
            <View style={styles.minimizedContent}>
              <View style={styles.minimizedRow}>
                <DriverAvatar 
                  driverId={driverInfo.id}
                  size={40}
                  style={styles.driverAvatarSmall}
                />
                <View style={styles.minimizedInfo}>
                  <Text style={styles.minimizedDriverName}>{driverInfo.name}</Text>
                  <Text style={styles.minimizedStatus}>
                    {driverArrived ? '🚦 Chegou • Indo ao destino' : `🚗 A caminho • ${driverInfo.estimatedArrival}`}
                  </Text>
                </View>
                <View style={styles.minimizedActions}>
                  <TouchableOpacity style={styles.callButtonSmall} onPress={handleCallDriver}>
                    <MaterialIcons name="phone" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Botão de cancelar sempre visível mesmo minimizado */}
              <TouchableOpacity 
                style={[styles.cancelButtonMinimized]} 
                onPress={handleNewSearch}
              >
                <MaterialIcons name="close" size={16} color="#DC2626" />
                <Text style={styles.cancelButtonTextMinimized}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Versão Expandida */
            <>
              {/* Header com status */}
              <View style={styles.dropdownHeader}>
                <View style={styles.statusIconContainer}>
                  <MaterialIcons name="check-circle" size={24} color="#10B981" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.dropdownTitle}>Motorista Encontrado!</Text>
                  <Text style={styles.dropdownSubtitle}>Chegará em {driverInfo.estimatedArrival}</Text>
                </View>
              </View>

              {/* Informações do Motorista */}
              <View style={styles.driverSection}>
                <View style={styles.driverRow}>
                  <DriverAvatar 
                    driverId={driverInfo.id}
                    size={60}
                    style={styles.driverAvatarLarge}
                  />
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverNameLarge}>{driverInfo.name}</Text>
                    <View style={styles.ratingRow}>
                      <MaterialIcons name="star" size={18} color="#FFC107" />
                      <Text style={styles.driverRatingText}>{driverInfo.rating || 4.8}
                      
                      
                      </Text>
                      <Text style={styles.ratingCount}>(127 avaliações)</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
                    <MaterialIcons name="phone" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Informações do Veículo */}
              <View style={styles.vehicleSection}>
                <View style={styles.vehicleHeader}>
                  <MaterialIcons name="directions-car" size={24} color="#4285F4" />
                  <Text style={styles.vehicleSectionTitle}>Veículo</Text>
                </View>
                <View style={styles.vehicleDetails}>
                  <View style={styles.vehicleRow}>
                    <Text style={styles.vehicleLabel}>Modelo:</Text>
                    <Text style={styles.vehicleValue}>
                      {driverInfo.vehicleInfo ? `${driverInfo.vehicleInfo?.make} ${driverInfo.vehicleInfo?.model}` : 'Toyota Corolla'}
                    </Text>
                  </View>
                  <View style={styles.vehicleRow}>
                    <Text style={styles.vehicleLabel}>Placa:</Text>
                    <Text style={styles.vehiclePlate}>
                      {driverInfo.vehicleInfo ? driverInfo.vehicleInfo.plate : 'ABC-1234'}
                    </Text>
                  </View>
                  <View style={styles.vehicleRow}>
                    <Text style={styles.vehicleLabel}>Cor:</Text>
                    <Text style={styles.vehicleValue}>
                      {driverInfo.vehicleInfo ? driverInfo.vehicleInfo.color : 'Branco'}
                    </Text>
                  </View>
                </View>
              </View>

                             {/* Status e Ações */}
               <View style={styles.dropdownFooter}>
                 <View style={styles.statusRow}>
                   <View style={styles.statusDotLarge} />
                   <Text style={styles.statusTextLarge}>
                     {driverArrived ? 'Motorista chegou - Indo ao destino' : 'Motorista a caminho'}
                   </Text>
                 </View>
                <TouchableOpacity style={styles.cancelButton} onPress={handleNewSearch}>
                  <Text style={styles.cancelButtonText}>Cancelar Corrida</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
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
                returnKeyType="search"
                blurOnSubmit={false}
                enablesReturnKeyAutomatically={true}
              />
              {destination?.length > 0 && (
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
                  name: currentLocationName,
                  address: currentLocationName,
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
              <Text style={styles.currentLocationSubtext}>{currentLocationName}</Text>
            </View>
          </TouchableOpacity>

          {/* Rotas de Coletivo Disponíveis */}
          {selectedTaxiType === 'Coletivo' && !destination && (
            <View style={styles.collectiveRoutesSection}>
              <Text style={styles.sectionTitle}>Rotas disponíveis para coletivos</Text>
              <ScrollView
                style={styles.routesList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {getAllCollectiveRoutes().slice(0, 10).map((route, index) => (
                  <TouchableOpacity
                    key={route.id}
                    style={styles.routeItem}
                    onPress={() => {
                      const routeInfo = getCollectiveRouteInfo(route.destination);
                      if (routeInfo && routeInfo.destinationCoords) {
                        const selectedLocation = {
                          name: route.destination,
                          address: route.name,
                          lat: routeInfo.destinationCoords.lat,
                          lng: routeInfo.destinationCoords.lng
                        };
                        
                        console.log('🚌 Rota de coletivo selecionada:', routeInfo);
                        console.log('📍 Chamando handleLocationSelect para processar rota...');
                        
                        // Chamar handleLocationSelect para processar a rota completa
                        handleLocationSelect(selectedLocation);
                      }
                    }}
                  >
                    <View style={styles.routeIcon}>
                      <MaterialIcons name="directions-bus" size={18} color="#4285F4" />
                    </View>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeName}>{route.name}</Text>
                      <Text style={styles.routePrice}>{route.price} AOA</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Search Results */}
          <View style={styles.searchResultsSection}>
            <Text style={styles.sectionTitle}>
              {isSearching ? 'Buscando...' : 
               filteredResults?.length > 0 ? `Resultados da busca (${filteredResults?.length})` : 
               selectedTaxiType === 'Coletivo' ? 'Digite para buscar destinos de coletivo' :
               'Digite para buscar locais'}
            </Text>

            {isSearching && (
              <View style={styles.searchingIndicator}>
                <MaterialIcons name="search" size={20} color="#2563EB" />
                <Text style={styles.searchingText}>Buscando...</Text>
              </View>
            )}

            {filteredResults?.length > 0 ? (
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
            ) : destination?.length > 0 && !isSearching ? (
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
        onRequestClose={handleCancelConfirmation}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            {/* Handle */}
            <View style={styles.handle} />
            
            <View style={styles.confirmationHeader}>
              <View style={styles.headerIconContainer}>
                <MaterialIcons 
                  name="local-taxi" 
                  size={24} 
                  color={COLORS.text.inverse} 
                />
              </View>
              <View style={styles.headerContent}>
                <Text style={styles.confirmationTitle}>Confirmar Corrida</Text>
                <Text style={styles.confirmationSubtitle}>
                  Revise os detalhes antes de confirmar
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancelConfirmation}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            {rideEstimate ? (
              <>
                <ScrollView 
                  style={styles.confirmationBody}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <View style={styles.routePreview}>
                    <View style={styles.routePoint}>
                      <MaterialIcons name="radio-button-checked" size={20} color="#10B981" />
                      <Text style={styles.routePointText}>{currentLocationName}</Text>
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
                </ScrollView>
                
                <View style={styles.confirmationActions}>
                  <TouchableOpacity
                    style={styles.cancelConfirmButton}
                    onPress={handleCancelConfirmation}
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
              </>
            ) : (
              <View style={styles.confirmationBody}>
                <Text style={styles.debugText}>
                  ⚠️ Carregando informações da corrida...
                </Text>
                <Text style={styles.debugSubtext}>
                  {rideEstimate ? 'rideEstimate existe' : 'rideEstimate não existe'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Botões de teste - apenas para desenvolvimento */}
      {__DEV__ && requestStatus === 'accepted' && driverInfo && !driverArrived && (
        <View style={{ position: 'absolute', bottom: 120, right: 20, zIndex: 1000 }}>
          <TouchableOpacity 
            style={{
              backgroundColor: '#FF6B35',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              elevation: 5,
              marginBottom: 8,
            }}
            onPress={testRideStarted}
          >
            <MaterialIcons name="play-arrow" size={20} color="#ffffff" />
            <Text style={{ color: '#ffffff', marginLeft: 4, fontWeight: '600', fontSize: 12 }}>
              Testar Iniciar
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{
              backgroundColor: '#8B5CF6',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              elevation: 5,
            }}
            onPress={() => {
              console.log('🔍 DEBUG Estado completo:', {
                requestStatus,
                driverInfo,
                selectedDestination,
                currentRide,
                driverArrived,
                location: location?.coords,
                webViewRef: !!webViewRef.current,
                apiCallbacks: Array.from(apiService.eventCallbacks?.keys() || []),
                socketConnected: apiService.isConnected,
                socketExists: !!apiService.socket
              });
            }}
          >
            <MaterialIcons name="bug-report" size={20} color="#ffffff" />
            <Text style={{ color: '#ffffff', marginLeft: 4, fontWeight: '600', fontSize: 12 }}>
              Debug
            </Text>
          </TouchableOpacity>
        </View>
      )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  map: {
    flex: 1,
  },
  // Zoom Controls
  zoomControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  zoomButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  
  locationButton: {
    position: 'absolute',
    top: 180,
    right: 20,
    width: 48,
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
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
  
  // Taxi Type Dropdown Styles - Redesenhado
  taxiDropdownContainer: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  taxiDropdownButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  taxiDropdownIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taxiDropdownTextContainer: {
    flex: 1,
  },
  taxiDropdownLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  taxiDropdownButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  taxiDropdownOptions: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  taxiDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  taxiDropdownOptionSelected: {
    backgroundColor: '#EBF4FF',
  },
  taxiDropdownOptionText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  taxiDropdownOptionTextSelected: {
    color: '#4285F4',
    fontWeight: '700',
  },
  taxiOptionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taxiOptionTextContainer: {
    flex: 1,
  },
  taxiOptionDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
  // Nova Interface de Busca de Motoristas - Modernizada e Responsiva
  driverSearchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  driverSearchCard: {
    backgroundColor: COLORS.surface.card,
    borderRadius: 24,
    marginHorizontal: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 10 
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
    alignItems: 'center',
    minHeight: height * 0.4,
    maxWidth: width * 0.9,
    width: '100%',
  },
  searchHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  searchIconContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    transform: [{ scale: 1 }],
  },
  pulseCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    transform: [{ scale: 1 }],
  },
  carIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  carIcon: {
    zIndex: 2,
  },
  carShadow: {
    position: 'absolute',
    bottom: -8,
    width: 60,
    height: 10,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 1,
  },
  searchContent: {
    alignItems: 'center',
    width: '100%',
  },
  searchingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  searchingSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
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
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surface.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary[500],
    borderRadius: 3,
    shadowColor: COLORS.primary[500],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchIndicators: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  indicatorActive: {
    backgroundColor: COLORS.primary[500],
    borderColor: COLORS.primary[500],
    shadowColor: COLORS.primary[500],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  indicatorText: {
    fontSize: 14,
    color: COLORS.text.light,
    fontWeight: '500',
    flex: 1,
  },
  indicatorTextActive: {
    color: COLORS.primary[500],
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 140,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Nova Interface de Motoristas Não Encontrados - Modernizada
  notFoundCard: {
    backgroundColor: COLORS.surface.card,
    borderRadius: 24,
    marginHorizontal: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 10 
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
    alignItems: 'center',
    minHeight: height * 0.35,
    maxWidth: width * 0.9,
    width: '100%',
  },
  notFoundIconContainer: {
    marginBottom: 24,
  },
  notFoundIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  notFoundContent: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  notFoundTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  notFoundSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  suggestionsList: {
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: COLORS.surface.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  notFoundActions: {
    width: '100%',
    alignItems: 'center',
  },
  tryAgainButton: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  tryAgainButtonText: {
    color: COLORS.text.inverse,
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
    color: COLORS.primary[500],
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
  // Estilos para Dropdown de Solicitação Aceita
  driverAcceptedDropdown: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Safe area
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    maxHeight: height * 0.75,
    minHeight: 160, // Altura mínima para sempre permanecer visível
  },
  dropdownHandleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 50, // Garantir área clicavel suficiente
    justifyContent: 'center',
  },
  dropdownHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  dropdownSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  driverSection: {
    marginBottom: 20,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatarLarge: {
    marginRight: 16,
  },
  driverInfo: {
    flex: 1,
  },
  driverNameLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverRatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
    marginRight: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  vehicleSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  vehicleDetails: {
    gap: 8,
  },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  vehicleValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '700',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  driverInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  vehicleText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
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
  statusContainer: {
    marginTop: 8,
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
    color: '#374151',
    fontWeight: '500',
  },
  dropdownFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginRight: 12,
  },
  statusTextLarge: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
  },
  // Estilos para versão minimizada
  minimizedContent: {
    paddingVertical: 12,
    minHeight: 80, // Garantir altura mínima para o conteúdo minimizado
    paddingBottom: 20,
  },
  minimizedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatarSmall: {
    marginRight: 12,
  },
  minimizedInfo: {
    flex: 1,
  },
  minimizedDriverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  minimizedStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  callButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandHint: {
    fontSize: 12,
    color: '#4285F4',
    fontWeight: '600',
    marginLeft: 4,
  },
  expandHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  minimizedActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButtonMinimized: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelButtonTextMinimized: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 4,
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

  callDriverText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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

  // Estilos do Modal de Confirmação - Modernizado e Responsivo
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  confirmationModal: {
    backgroundColor: COLORS.surface.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
    maxHeight: height * 0.8,
    minHeight: height * 0.6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: COLORS.primary[500],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  confirmationSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmationBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 0,
  },
  routePreview: {
    backgroundColor: COLORS.surface.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  routePointText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
    flex: 1,
    fontWeight: '600',
    lineHeight: 22,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    marginLeft: 10,
    marginVertical: 4,
  },
  estimateCard: {
    backgroundColor: COLORS.surface.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: COLORS.surface.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: 'relative',
    bottom: 0,
  },
  cancelConfirmButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  confirmRideButton: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flex: 2,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmRideText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.inverse,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 10,
  },
  debugSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Estilos para seção de rotas de coletivo
  collectiveRoutesSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  routesList: {
    maxHeight: 200,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  routePrice: {
    fontSize: 13,
    color: '#4285F4',
    fontWeight: '500',
  },
});