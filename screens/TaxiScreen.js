import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  Animated, 
  ActivityIndicator, 
  Image, 
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps'; // Change back to react-native-maps
import { MaterialIcons, FontAwesome5, Ionicons, AntDesign, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Update CAR_CATEGORIES with more realistic options
const CAR_CATEGORIES = {
  MOTO: {
    id: 'moto',
    name: 'Moto',
    basePrice: 500,
    pricePerKm: 80,
    icon: 'motorcycle',
    eta: '5-10 min',
    description: 'Rápido e econômico'
  },
  STANDARD: {
    id: 'standard',
    name: 'Standard',
    basePrice: 1000,
    pricePerKm: 120,
    icon: 'directions-car',
    eta: '3-8 min',
    description: 'Carros confortáveis para o dia a dia'
  },
  COMFORT: {
    id: 'comfort',
    name: 'Comfort+',
    basePrice: 1500,
    pricePerKm: 150,
    icon: 'directions-car',
    eta: '5-10 min',
    description: 'Carros espaçosos e confortáveis'
  }
};

// Métodos de pagamento disponíveis
const PAYMENT_METHODS = [
  {
    id: 'cash',
    name: 'Dinheiro',
    icon: 'cash',
    iconFamily: 'MaterialCommunityIcons'
  },
  {
    id: 'card',
    name: 'Cartão',
    icon: 'credit-card',
    iconFamily: 'AntDesign'
  },
  {
    id: 'pix',
    name: 'Transferência',
    icon: 'bank-transfer',
    iconFamily: 'MaterialCommunityIcons'
  },
  {
    id: 'wallet',
    name: 'Carteira',
    icon: 'wallet',
    iconFamily: 'AntDesign'
  }
];

// Add these helper functions before the TaxiScreen component
const calculateRouteDistance = (route) => {
  let distance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const lat1 = route[i].latitude;
    const lon1 = route[i].longitude;
    const lat2 = route[i + 1].latitude;
    const lon2 = route[i + 1].longitude;
    
    // Haversine formula
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    distance += R * c;
  }
  return distance;
};

// Modify the generateSimulatedRoute function
const generateSimulatedRoute = (origin, destination) => {
  const points = [];
  const numPoints = 50;
  
  // Criar pontos de controle para simular curvas de estrada
  const controlPoints = [
    origin,
    {
      latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.25 + (Math.random() * 0.002 - 0.001),
      longitude: origin.longitude + (destination.longitude - origin.longitude) * 0.25 + (Math.random() * 0.002 - 0.001)
    },
    {
      latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.5 + (Math.random() * 0.002 - 0.001),
      longitude: origin.longitude + (destination.longitude - origin.longitude) * 0.5 + (Math.random() * 0.002 - 0.001)
    },
    {
      latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.75 + (Math.random() * 0.002 - 0.001),
      longitude: origin.longitude + (destination.longitude - origin.longitude) * 0.75 + (Math.random() * 0.002 - 0.001)
    },
    destination
  ];

  // Função para calcular ponto na curva de Bezier
  const bezierPoint = (t, p0, p1, p2, p3) => {
    const cx = 3 * (p1 - p0);
    const bx = 3 * (p2 - p1) - cx;
    const ax = p3 - p0 - cx - bx;
    
    const cy = 3 * (p1 - p0);
    const by = 3 * (p2 - p1) - cy;
    const ay = p3 - p0 - cy - by;
    
    const tSquared = t * t;
    const tCubed = tSquared * t;
    
    const x = (ax * tCubed) + (bx * tSquared) + (cx * t) + p0;
    const y = (ay * tCubed) + (by * tSquared) + (cy * t) + p0;
    
    return { x, y };
  };

  // Gerar pontos suaves usando curvas de Bezier entre os pontos de controle
  for (let i = 0; i < controlPoints.length - 1; i++) {
    const start = controlPoints[i];
    const end = controlPoints[i + 1];
    const segments = numPoints / (controlPoints.length - 1);
    
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const point = bezierPoint(
        t,
        start.latitude,
        start.latitude + (Math.random() * 0.0001),
        end.latitude - (Math.random() * 0.0001),
        end.latitude
      );
      
      const pointLong = bezierPoint(
        t,
        start.longitude,
        start.longitude + (Math.random() * 0.0001),
        end.longitude - (Math.random() * 0.0001),
        end.longitude
      );

      points.push({
        latitude: point.x,
        longitude: pointLong.x
      });
    }
  }

  const distance = calculateRouteDistance(points);
  
  return {
    points,
    distance,
    duration: Math.round(distance / 400),
    trafficDuration: Math.round(distance / 300),
    congestionLevel: 1 + (Math.random() > 0.7 ? 0.5 : 0)
  };
};

export default function TaxiScreen() {
  const [location, setLocation] = useState(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: -8.8383333,
    longitude: 13.2344444,
    latitudeDelta: 0.01, // Reduced from 0.0922 for closer zoom
    longitudeDelta: 0.01, // Reduced from 0.0421 for closer zoom
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [tripStatus, setTripStatus] = useState('idle'); // idle, searching, found, inProgress, completed
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [driverPosition, setDriverPosition] = useState(null);
  const driverIntervalRef = useRef(null);

  const mapRef = useRef(null);
  const searchingAnimation = useRef(new Animated.Value(0)).current;

  // Add new states after existing ones
  const [showDriverOnWayModal, setShowDriverOnWayModal] = useState(false);
  const [showStartRideModal, setShowStartRideModal] = useState(false);
  const [rideInProgress, setRideInProgress] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Add simulated messages
  const simulatedMessages = [
    { id: 1, text: "Olá, estou a caminho!", sender: 'driver', time: '14:30' },
    { id: 2, text: "Ok, estou aguardando", sender: 'user', time: '14:31' },
    { id: 3, text: "Chego em 2 minutos", sender: 'driver', time: '14:32' }
  ];

  // Add new state for moving cars with animation
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const driversIntervalRef = useRef(null);
  const driverAnimations = useRef({}).current;

  // Add new state for ride progress
  const [rideProgress, setRideProgress] = useState(0);
  const destinationIntervalRef = useRef(null);

  // Adicione esses estados no início do componente TaxiScreen
  const [driverRoute, setDriverRoute] = useState([]);
  const [estimatedArrival, setEstimatedArrival] = useState(null);
  const [activeRoute, setActiveRoute] = useState([]); // rota atual sendo mostrada
  const [distanceToDriver, setDistanceToDriver] = useState(null);

  // Adicionar novo estado para controlar a direção do motorista
  const [driverBearing, setDriverBearing] = useState(0);
  const [routeData, setRouteData] = useState(null);
  
  // Novos estados para melhorias
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRideCompleteModal, setShowRideCompleteModal] = useState(false);
  const [driverRating, setDriverRating] = useState(0);
  const [isSharingTrip, setIsSharingTrip] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [holdStartTime, setHoldStartTime] = useState(null);
  const [showEmergencyOptions, setShowEmergencyOptions] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      const userRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01, // Closer zoom level
        longitudeDelta: 0.01,
      };
      
      setLocation(location.coords);
      setInitialRegion(userRegion);

      // Animate to user location when found
      mapRef.current?.animateToRegion(userRegion, 1000);
    })();
  }, []);

  // Add this after your first useEffect
  useEffect(() => {
    if (location) {
      // Initialize nearby drivers with better distribution
      const initialDrivers = Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45) % 360; // Distribute drivers in a circle
        const radius = 0.005 + (Math.random() * 0.005); // Random distance between 500m-1km
        const lat = location.latitude + (radius * Math.cos(angle * Math.PI / 180));
        const lng = location.longitude + (radius * Math.sin(angle * Math.PI / 180));
        
        return {
          id: i,
          coordinate: {
            latitude: lat,
            longitude: lng,
          },
          rotation: angle,
          type: i < 3 ? 'moto' : 'car' // Mix of motos and cars
        };
      });
      setNearbyDrivers(initialDrivers);

      // Animate drivers with smoother movement
      driversIntervalRef.current = setInterval(() => {
        setNearbyDrivers(prev => prev.map(driver => {
          // Create a more natural movement pattern
          const moveRadius = 0.0003; // About 30 meters
          const moveAngle = (driver.rotation + (Math.random() * 30 - 15)) % 360; // Slight direction change
          
          const newLat = driver.coordinate.latitude + (moveRadius * Math.cos(moveAngle * Math.PI / 180));
          const newLng = driver.coordinate.longitude + (moveRadius * Math.sin(moveAngle * Math.PI / 180));
          
          // Keep drivers within reasonable range of user
          const distanceToUser = Math.sqrt(
            Math.pow(newLat - location.latitude, 2) + 
            Math.pow(newLng - location.longitude, 2)
          );
          
          if (distanceToUser > 0.01) { // If too far (about 1km)
            // Move back towards user
            const angleToUser = Math.atan2(
              location.longitude - driver.coordinate.longitude,
              location.latitude - driver.coordinate.latitude
            ) * (180 / Math.PI);
            
            return {
              ...driver,
              rotation: angleToUser,
              coordinate: {
                latitude: driver.coordinate.latitude + (0.0005 * Math.cos(angleToUser * Math.PI / 180)),
                longitude: driver.coordinate.longitude + (0.0005 * Math.sin(angleToUser * Math.PI / 180))
              }
            };
          }
          
          return {
            ...driver,
            coordinate: { latitude: newLat, longitude: newLng },
            rotation: moveAngle
          };
        }));
      }, 1500); // Slightly faster updates for smoother animation

      return () => {
        if (driversIntervalRef.current) {
          clearInterval(driversIntervalRef.current);
        }
      };
    }
  }, [location]);

  // Modificar a função que gera motoristas próximos
  useEffect(() => {
    if (location) {
      // Distribuir motoristas em uma área maior
      const initialDrivers = Array.from({ length: 8 }, (_, i) => {
        // Aumentar o raio de distribuição (1-3km)
        const radius = 0.01 + (Math.random() * 0.02);
        // Distribuir em ângulos aleatórios
        const angle = Math.random() * 360;
        const lat = location.latitude + (radius * Math.cos(angle * Math.PI / 180));
        const lng = location.longitude + (radius * Math.sin(angle * Math.PI / 180));
        
        return {
          id: i,
          coordinate: {
            latitude: lat,
            longitude: lng,
          },
          rotation: angle,
          type: i < 3 ? 'moto' : 'car'
        };
      });
      setNearbyDrivers(initialDrivers);
  
      // Movimento mais natural e espalhado
      driversIntervalRef.current = setInterval(() => {
        setNearbyDrivers(prev => prev.map(driver => {
          // Movimento mais independente para cada motorista
          const moveRadius = 0.0005 + (Math.random() * 0.0005); // 50-100m por movimento
          const moveAngle = Math.random() * 360; // Direção aleatória
          
          const newLat = driver.coordinate.latitude + (moveRadius * Math.cos(moveAngle * Math.PI / 180));
          const newLng = driver.coordinate.longitude + (moveRadius * Math.sin(moveAngle * Math.PI / 180));
          
          // Manter dentro de uma área maior (4km do centro)
          const distanceToCenter = Math.sqrt(
            Math.pow(newLat - location.latitude, 2) + 
            Math.pow(newLng - location.longitude, 2)
          );
          
          if (distanceToCenter > 0.04) { // Se mais de 4km do centro
            // Gerar nova posição aleatória mais próxima
            const returnRadius = 0.01 + (Math.random() * 0.02);
            const returnAngle = Math.random() * 360;
            return {
              ...driver,
              rotation: returnAngle,
              coordinate: {
                latitude: location.latitude + (returnRadius * Math.cos(returnAngle * Math.PI / 180)),
                longitude: location.longitude + (returnRadius * Math.sin(returnAngle * Math.PI / 180))
              }
            };
          }
          
          return {
            ...driver,
            coordinate: { latitude: newLat, longitude: newLng },
            rotation: moveAngle
          };
        }));
      }, 3000); // Movimento mais lento
  
      return () => {
        if (driversIntervalRef.current) {
          clearInterval(driversIntervalRef.current);
        }
      };
    }
  }, [location]);

  // Add cleanup in useEffect
  useEffect(() => {
    return () => {
      if (destinationIntervalRef.current) {
        clearInterval(destinationIntervalRef.current);
      }
    };
  }, []);

  const startSearchingAnimation = () => {
    searchingAnimation.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(searchingAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(searchingAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    ).start();
  };

  const handleSearch = async (text) => {
    setSearchQuery(text);
    setSearchResults([]);
    if (text.length > 2 && location) {
      setNotification({ show: true, message: 'Buscando...', type: 'info' });
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${text}&countrycodes=ao&limit=5`,
          {
            headers: {
              'User-Agent': 'YangoClone/1.0'
            }
          }
        );
        const data = await response.json();
        setSearchResults(data.map(item => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        })));
      } catch (error) {
        console.error('Error searching:', error);
        setNotification({
          show: true,
          message: 'Erro na busca. Tente novamente.',
          type: 'error'
        });
      }
    }
  };

  // Modify the handleSelectDestination function
  const handleSelectDestination = async (destination) => {
    try {
      setSelectedDestination(destination);
      setSearchResults([]);
      setSearchQuery('');

      if (location && destination) {
        setIsSearchingDriver(true);
        
        const newRouteData = generateSimulatedRoute(
          location,
          { latitude: destination.lat, longitude: destination.lon }
        );

        setRouteData(newRouteData);
        setRoutePath(newRouteData.points);
        setEstimatedTime(Math.round(newRouteData.trafficDuration / 60));
        
        if (newRouteData.congestionLevel > 1.3) {
          setNotification({
            show: true,
            message: 'Trânsito intenso na rota. Tempo de viagem pode ser maior.',
            type: 'warning'
          });
        }

        if (mapRef.current) {
          const padding = { top: 100, right: 50, bottom: 100, left: 50 };
          mapRef.current.fitToCoordinates(newRouteData.points, { padding, animated: true });
        }
        
        setShowCategories(true);
      }
    } catch (error) {
      console.error('Error selecting destination:', error);
      Alert.alert('Erro', 'Não foi possível processar o destino. Tente novamente.');
    } finally {
      setIsSearchingDriver(false);
    }
  };

// Add this function to calculate realistic prices
const calculatePrice = (distance, category) => {
  const cat = CAR_CATEGORIES[category];
  const basePrice = cat.basePrice;
  const pricePerKm = cat.pricePerKm;
  const distanceInKm = distance / 1000; // Convert to km
  
  return Math.round(basePrice + (pricePerKm * distanceInKm));
};

// Modificar handleSelectCar para usar apenas um motorista
const handleSelectCar = async (category) => {
  setSelectedCategory(category);
  setShowCategories(false);
  setTripStatus('searching');
  setIsSearchingDriver(true);
  startSearchingAnimation();

  // Gerar posição inicial do motorista a 2km de distância
  const startAngle = Math.random() * 360;
  const startRadius = 0.02; // ~2km
  const driverStartPosition = {
    latitude: location.latitude + (startRadius * Math.cos(startAngle * Math.PI / 180)),
    longitude: location.longitude + (startRadius * Math.sin(startAngle * Math.PI / 180))
  };

  // Primeiro gerar e mostrar a rota do motorista até o usuário
  const pickupRoute = generateSimulatedRoute(
    driverStartPosition,
    { latitude: location.latitude, longitude: location.longitude }
  );

  // Limpar qualquer rota anterior e mostrar apenas a rota até o usuário
  setActiveRoute(pickupRoute.points);
  setDriverRoute(pickupRoute.points);
  setRoutePath([]); // Limpar rota até o destino por enquanto

  // Configurar motorista
  setNearbyDrivers([{
    id: 1,
    coordinate: driverStartPosition,
    rotation: startAngle,
    type: category === 'MOTO' ? 'moto' : 'car'
  }]);

  setDriverInfo({
    id: `D${Math.random().toString(36).substr(2, 9)}`,
    name: 'João Silva',
    rating: (4 + Math.random()).toFixed(1),
    photo: 'https://i.pravatar.cc/150',
    car: category === 'MOTO' ? 'Honda CG 160' : 'Toyota Corolla',
    plate: `LD-${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 90 + 10)}-AC`
  });

  // Ajustar mapa para mostrar toda a rota do motorista
  if (mapRef.current) {
    const padding = { top: 50, right: 50, bottom: 50, left: 50 };
    mapRef.current.fitToCoordinates(pickupRoute.points, { padding, animated: true });
  }

  // Animar motorista seguindo a rota até o usuário
  let index = 0;
  driverIntervalRef.current = setInterval(() => {
    if (index < pickupRoute.points.length) {
      const currentPoint = pickupRoute.points[index];
      const nextPoint = pickupRoute.points[Math.min(index + 1, pickupRoute.points.length - 1)];
      
      // Calcular ângulo entre pontos para rotação do motorista
      const bearing = calculateBearing(
        currentPoint.latitude,
        currentPoint.longitude,
        nextPoint.latitude,
        nextPoint.longitude
      );
      
      setDriverPosition(currentPoint);
      setDriverBearing(bearing);

      // Atualizar distância restante
      const remainingPoints = pickupRoute.points.slice(index);
      const remainingDistance = calculateRouteDistance(remainingPoints);
      setDistanceToDriver(Math.round(remainingDistance / 1000));
      setEstimatedArrival(Math.round(remainingDistance / 400));
      
      index++;
    } else {
      clearInterval(driverIntervalRef.current);
      setShowDriverOnWayModal(false);
      setShowStartRideModal(true);
    }
  }, 1000);

  setShowDriverOnWayModal(true);
  setIsSearchingDriver(false);
};

const handleStartRide = () => {
  setShowStartRideModal(false);
  setRideInProgress(true);
  setTripStatus('inProgress');
  
  // Agora sim, gerar e mostrar a rota até o destino final
  const destinationRoute = generateSimulatedRoute(
    { latitude: location.latitude, longitude: location.longitude },
    { latitude: selectedDestination.lat, longitude: selectedDestination.lon }
  );

  // Atualizar para mostrar nova rota
  setActiveRoute(destinationRoute.points);
  setRoutePath(destinationRoute.points);

  // Ajustar mapa para mostrar nova rota
  if (mapRef.current) {
    const padding = { top: 50, right: 50, bottom: 50, left: 50 };
    mapRef.current.fitToCoordinates(destinationRoute.points, { padding, animated: true });
  }
  
  let progressIndex = 0;
  destinationIntervalRef.current = setInterval(() => {
    if (progressIndex < destinationRoute.points.length) {
      const currentPoint = destinationRoute.points[progressIndex];
      const nextPoint = destinationRoute.points[Math.min(progressIndex + 1, destinationRoute.points.length - 1)];
      
      const bearing = calculateBearing(
        currentPoint.latitude,
        currentPoint.longitude,
        nextPoint.latitude,
        nextPoint.longitude
      );
      
      setDriverPosition(currentPoint);
      setDriverBearing(bearing);
      setRideProgress((progressIndex / destinationRoute.points.length) * 100);
      
      progressIndex++;
    } else {
      clearInterval(destinationIntervalRef.current);
      handleRideComplete();
    }
  }, 1000);
};

  // Add handleRideComplete function
  const handleRideComplete = () => {
    setRideInProgress(false);
    setShowRideCompleteModal(true);
  };

  // Add function to handle ride cancellation
  const handleCancelRide = () => {
    if (driverIntervalRef.current) {
      clearInterval(driverIntervalRef.current);
    }
    if (destinationIntervalRef.current) {
      clearInterval(destinationIntervalRef.current);
    }
    setTripStatus('idle');
    setIsSearchingDriver(false);
    setShowDriverOnWayModal(false);
    setDriverPosition(null);
    setSelectedDestination(null);
    setRoutePath([]);
    setRideInProgress(false);
    setNotification({ 
      show: true, 
      message: 'Viagem cancelada', 
      type: 'error' 
    });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Add function to recenter map on user
  const centerOnUser = () => {
    if (location && mapRef.current) {
      try {
        mapRef.current.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      } catch (error) {
        console.error('Error centering map:', error);
        setNotification({
          show: true,
          message: 'Erro ao centralizar mapa',
          type: 'error'
        });
      }
    } else {
      setNotification({
        show: true,
        message: 'Localização não disponível',
        type: 'warning'
      });
    }
  };

  // Add CarCategoriesModal as inner component
  const CarCategoriesModal = () => (
    showCategories ? (
      <View style={styles.yyabgoCategoriesModal}>
        <View style={styles.yyabgoModalHeader}>
          <Text style={styles.yyabgoModalTitle}>Escolha seu carro</Text>
        </View>
        <ScrollView style={styles.yyabgoCategoriesScroll}>
          {Object.entries(CAR_CATEGORIES).map(([key, category]) => (
            <TouchableOpacity
              key={key}
              style={styles.yyabgoCategoryCard}
              onPress={() => handleSelectCar(key)}
            >
              <View style={styles.yyabgoCategoryIcon}>
                <MaterialIcons name={category.icon} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.yyabgoCategoryInfo}>
                <Text style={styles.yyabgoCategoryName}>{category.name}</Text>
                <Text style={styles.yyabgoCategoryDescription}>{category.description}</Text>
                <Text style={styles.yyabgoCategoryEta}>{category.eta}</Text>
              </View>
              <Text style={styles.yyabgoCategoryPrice}>
                {`${Math.round(category.basePrice + (category.pricePerKm * (estimatedTime || 0)))} Kz`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    ) : null
  );

  // Add chat modal component
  const ChatModal = () => (
    showChat ? (
      <View style={styles.modalContainer}>
        <View style={styles.yyabgoChatModal}>
          <View style={styles.yyabgoChatHeader}>
            <TouchableOpacity 
              style={styles.yyabgoCloseButton}
              onPress={() => setShowChat(false)}
            >
              <MaterialIcons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.yyabgoChatTitle}>Chat com o motorista</Text>
          </View>
          <View style={styles.yyabgoMessagesContainer}>
            {messages.map((msg) => (
              <View 
                key={msg.id} 
                style={[
                  styles.yyabgoMessageBox,
                  msg.sender === 'driver' ? styles.yyabgoDriverMessage : styles.yyabgoUserMessage
                ]}
              >
                <Text style={[
                  styles.yyabgoMessageText,
                  msg.sender === 'user' && { color: 'white' }
                ]}>
                  {msg.text}
                </Text>
                <Text style={[
                  styles.yyabgoMessageTime,
                  msg.sender === 'user' && { color: 'rgba(255,255,255,0.7)' }
                ]}>
                  {msg.time}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    ) : null
  );

  // Modificar o componente DriverOnWayModal para incluir o indicador de direção
  const DriverOnWayModal = () => (
    showDriverOnWayModal ? (
      <View style={styles.yyabgoDriverOnWayCard}>
        {driverInfo && (
          <>
            <View style={styles.yyabgoDriverHeader}>
              <Image source={{ uri: driverInfo.photo }} style={styles.yyabgoDriverPhoto} />
              <View style={styles.yyabgoDriverDetails}>
                <Text style={styles.yyabgoDriverName}>{driverInfo.name}</Text>
                <Text style={styles.yyabgoCarInfo}>{driverInfo.car}</Text>
                <Text style={styles.yyabgoPlate}>{driverInfo.plate}</Text>
              </View>
              <View style={styles.yyabgoRatingContainer}>
                <Ionicons name="star" size={16} color="#FFBF00" />
                <Text style={styles.yyabgoRating}>{driverInfo.rating}</Text>
              </View>
            </View>
            
            {distanceToDriver !== null && estimatedArrival !== null && (
              <View style={styles.yyabgoDirectionContainer}>
                <View style={styles.yyabgoDirectionIndicator}>
                  <MaterialIcons name="directions-car" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.yyabgoEstimatedInfo}>
                  Motorista a {distanceToDriver} km • Chegada em aproximadamente {estimatedArrival} min
                </Text>
              </View>
            )}
            
            <View style={styles.extraButtonsContainer}>
              <TouchableOpacity 
                style={styles.paymentButton} 
                onPress={() => setShowPaymentModal(true)}
              >
                <View style={styles.paymentButtonContent}>
                  {selectedPaymentMethod === 'cash' ? (
                    <MaterialCommunityIcons name="cash" size={20} color={COLORS.primary} />
                  ) : selectedPaymentMethod === 'card' ? (
                    <AntDesign name="credit-card" size={20} color={COLORS.primary} />
                  ) : selectedPaymentMethod === 'pix' ? (
                    <MaterialCommunityIcons name="bank-transfer" size={20} color={COLORS.primary} />
                  ) : (
                    <AntDesign name="wallet" size={20} color={COLORS.primary} />
                  )}
                  <Text style={styles.paymentButtonText}>
                    {PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod)?.name}
                  </Text>
                  <Entypo name="chevron-small-right" size={20} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.securityButton} 
                onPress={shareTrip}
              >
                <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
                <Text style={styles.securityButtonText}>Compartilhar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.emergencyButton}
                onPressIn={handleEmergencyButtonHoldStart}
                onPressOut={handleEmergencyButtonHoldEnd}
              >
                <Ionicons name="warning-outline" size={20} color="#FF3B30" />
                <Text style={styles.emergencyButtonText}>Emergência</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.yyabgoActionButtons}>
              <TouchableOpacity 
                style={styles.yyabgoActionButton}
                onPress={() => setShowChat(true)}
              >
                <MaterialIcons name="chat" size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.yyabgoActionButton, styles.yyabgoCancelButton]}
                onPress={handleCancelRide}
              >
                <MaterialIcons name="close" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    ) : null
  );

  // Add start ride modal component
  const StartRideModal = () => (
    showStartRideModal ? (
      <View style={styles.modalContainer}>
        <View style={styles.yyabgoStartRideModal}>
          <Text style={styles.yyabgoModalTitle}>Motorista chegou!</Text>
          <Text style={styles.yyabgoModalSubtitle}>Pronto para iniciar a viagem?</Text>
          <TouchableOpacity 
            style={styles.yyabgoStartRideButton}
            onPress={handleStartRide}
          >
            <Text style={styles.yyabgoStartRideButtonText}>Iniciar Viagem</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : null
  );

  // Add Notification component
  const Notification = () => (
    notification.show && (
      <Animated.View style={[
        styles.yyabgoNotification,
        { backgroundColor: notification.type === 'success' ? COLORS.primary : '#ff4444' }
      ]}>
        <Text style={styles.yyabgoNotificationText}>{notification.message}</Text>
      </Animated.View>
    )
  );

  // Add CarMarker component inside TaxiScreen
  const CarMarker = ({ coordinate, rotation, category = 'car' }) => (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      flat={true}
    >
      <Animated.View style={[
        { 
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: category === 'moto' ? COLORS.primary : 'white',
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          borderWidth: 2,
          borderColor: COLORS.primary,
          transform: [{ rotate: `${rotation}deg` }]
        }
      ]}>
        <MaterialIcons 
          name={category === 'moto' ? 'motorcycle' : 'directions-car'} 
          size={24} 
          color={category === 'moto' ? 'white' : COLORS.primary}
          style={{ transform: [{ rotate: '270deg' }] }}
        />
      </Animated.View>
    </Marker>
  );

  // Add progress indicator component
  const RideProgressBar = () => (
    rideInProgress && (
      <View style={styles.yyabgoProgressContainer}>
        <View style={styles.yyabgoProgressInfo}>
          <View style={styles.yyabgoDestinationInfo}>
            <Text style={styles.yyabgoProgressTitle}>A caminho do destino</Text>
            <Text style={styles.yyabgoProgressAddress} numberOfLines={1}>
              {selectedDestination?.name}
            </Text>
            {routeData?.congestionLevel > 1.3 && (
              <View style={styles.yyabgoTrafficContainer}>
                <MaterialIcons name="traffic" size={16} color="#FF6B6B" />
                <Text style={styles.yyabgoTrafficWarning}>
                  Trânsito intenso
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.yyabgoProgressPercentage}>{Math.round(rideProgress)}%</Text>
        </View>
        <View style={styles.yyabgoProgressBarContainer}>
          <View style={[styles.yyabgoProgressBar, { width: `${rideProgress}%` }]} />
        </View>
      </View>
    )
  );

  // Add new component inside TaxiScreen

  // Adicionar função para calcular o ângulo entre dois pontos
  const calculateBearing = (startLat, startLng, destLat, destLng) => {
    startLat = startLat * Math.PI / 180;
    startLng = startLng * Math.PI / 180;
    destLat = destLat * Math.PI / 180;
    destLng = destLng * Math.PI / 180;
  
    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) -
              Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    const bearing = Math.atan2(y, x);
    return ((bearing * 180 / Math.PI) + 360) % 360;
  };

  // Modificar o intervalo do motorista para atualizar o bearing
  useEffect(() => {
    if (driverPosition && location) {
      const bearing = calculateBearing(
        location.latitude,
        location.longitude,
        driverPosition.latitude,
        driverPosition.longitude
      );
      setDriverBearing(bearing);
    }
  }, [driverPosition, location]);

  // Modificar o useEffect dos motoristas próximos
  useEffect(() => {
    if (location && !selectedDestination) {
      // Só mostrar motoristas iniciais se não houver destino selecionado
      const initialDrivers = Array.from({ length: 8 }, (_, i) => {
        const angle = Math.random() * 360;
        const radius = 0.01 + (Math.random() * 0.02);
        const lat = location.latitude + (radius * Math.cos(angle * Math.PI / 180));
        const lng = location.longitude + (radius * Math.sin(angle * Math.PI / 180));
        
        return {
          id: i,
          coordinate: {
            latitude: lat,
            longitude: lng,
          },
          rotation: angle,
          type: i < 3 ? 'moto' : 'car'
        };
      });
      setNearbyDrivers(initialDrivers);
    }
  }, [location, selectedDestination]);

  // Add notification animation function
  useEffect(() => {
    if (notification.show) {
      // Create notification animation
      const notificationAnimation = new Animated.Value(0);
      
      // Fade in
      Animated.timing(notificationAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
      
      // Set timeout to automatically hide notification
      const timer = setTimeout(() => {
        // Fade out
        Animated.timing(notificationAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start(() => {
          setNotification(prev => ({ ...prev, show: false }));
        });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification.show, notification.message]);

  const handleSelectPaymentMethod = (methodId) => {
    setSelectedPaymentMethod(methodId);
    setShowPaymentModal(false);
    setNotification({
      show: true,
      message: `Método de pagamento alterado para ${PAYMENT_METHODS.find(m => m.id === methodId).name}`,
      type: 'success'
    });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 2000);
  };

  const shareTrip = () => {
    setIsSharingTrip(true);
    setNotification({
      show: true,
      message: 'Detalhes da viagem compartilhados',
      type: 'success'
    });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 2000);
  };

  const activateEmergency = () => {
    setShowEmergencyOptions(true);
  };

  const handleEmergencyAction = (action) => {
    setEmergencyMode(true);
    setShowEmergencyOptions(false);
    
    if (action === 'police') {
      setNotification({
        show: true,
        message: 'Chamando a polícia para sua localização...',
        type: 'error'
      });
    } else if (action === 'share') {
      setNotification({
        show: true,
        message: 'Compartilhando localização com contatos de emergência...',
        type: 'error'
      });
    } else {
      setNotification({
        show: true,
        message: 'Modo de emergência ativado',
        type: 'error'
      });
    }
    
    setTimeout(() => {
      setEmergencyMode(false);
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  };

  const handleEmergencyButtonHoldStart = () => {
    setHoldStartTime(Date.now());
  };

  const handleEmergencyButtonHoldEnd = () => {
    if (holdStartTime && (Date.now() - holdStartTime > 3000)) {
      activateEmergency();
    }
    setHoldStartTime(null);
  };

  const handleRateDriver = (rating) => {
    setDriverRating(rating);
    
    setTimeout(() => {
      setShowRideCompleteModal(false);
      setDriverRating(0);
      setTripStatus('idle');
      setSelectedDestination(null);
      setRoutePath([]);
      setDriverPosition(null);
      setRideProgress(0);
    }, 1000);
  };

  // Add new component for payment method selection
  const PaymentMethodModal = () => (
    showPaymentModal && (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Método de Pagamento</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <AntDesign name="close" size={24} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodItem,
                  selectedPaymentMethod === method.id && styles.selectedPaymentMethod
                ]}
                onPress={() => handleSelectPaymentMethod(method.id)}
              >
                {method.iconFamily === 'MaterialCommunityIcons' ? (
                  <MaterialCommunityIcons name={method.icon} size={24} color={selectedPaymentMethod === method.id ? COLORS.white : COLORS.primary} />
                ) : method.iconFamily === 'AntDesign' ? (
                  <AntDesign name={method.icon} size={24} color={selectedPaymentMethod === method.id ? COLORS.white : COLORS.primary} />
                ) : (
                  <Ionicons name={method.icon} size={24} color={selectedPaymentMethod === method.id ? COLORS.white : COLORS.primary} />
                )}
                <Text style={[
                  styles.paymentMethodText,
                  selectedPaymentMethod === method.id && styles.selectedPaymentMethodText
                ]}>
                  {method.name}
                </Text>
                {selectedPaymentMethod === method.id && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.white} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    )
  );

  // Add component for ride complete and rating
  const RideCompleteModal = () => (
    showRideCompleteModal && (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.rideCompleteHeader}>
            <Text style={styles.rideCompleteTitle}>Viagem concluída</Text>
            <Text style={styles.rideCompleteSubtitle}>Como foi sua experiência?</Text>
          </View>
          
          <View style={styles.driverRatingContainer}>
            <Image source={{ uri: driverInfo?.photo }} style={styles.ratingDriverPhoto} />
            <Text style={styles.ratingDriverName}>{driverInfo?.name}</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => handleRateDriver(star)}
                >
                  <Ionicons 
                    name={driverRating >= star ? "star" : "star-outline"}
                    size={36} 
                    color={driverRating >= star ? "#FFD700" : "#CCCCCC"} 
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            {driverRating > 0 && (
              <Text style={styles.thankYouText}>Obrigado pela sua avaliação!</Text>
            )}
          </View>
        </View>
      </View>
    )
  );

  // Add component for emergency options
  const EmergencyOptionsModal = () => (
    showEmergencyOptions && (
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, styles.emergencyModal]}>
          <Text style={styles.emergencyTitle}>Opções de Emergência</Text>
          
          <TouchableOpacity 
            style={styles.emergencyOption} 
            onPress={() => handleEmergencyAction('police')}
          >
            <MaterialIcons name="local-police" size={24} color="#FFFFFF" />
            <Text style={styles.emergencyText}>Chamar Polícia</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.emergencyOption} 
            onPress={() => handleEmergencyAction('share')}
          >
            <Ionicons name="share-social" size={24} color="#FFFFFF" />
            <Text style={styles.emergencyText}>Compartilhar Localização</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.emergencyCancel} 
            onPress={() => setShowEmergencyOptions(false)}
          >
            <Text style={styles.emergencyCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
        onRegionChangeComplete={setInitialRegion}
        mapPadding={{ top: 0, right: 0, bottom: 60, left: 0 }}
      >
        {/* Map markers and routes */}
        {!rideInProgress && !showCategories && nearbyDrivers.map(driver => (
          <Marker
            key={driver.id}
            coordinate={driver.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            <CarMarker
              rotation={driver.rotation}
              category={driver.type}
            />
          </Marker>
        ))}

        {selectedDestination && (
          <Marker
            coordinate={{
              latitude: selectedDestination.lat,
              longitude: selectedDestination.lon
            }}
          >
            <View style={styles.destinationMarker}>
              <MaterialIcons name="location-on" size={40} color={COLORS.primary} />
            </View>
          </Marker>
        )}

        {activeRoute.length > 0 && (
          <Polyline
            coordinates={activeRoute}
            strokeColor={COLORS.primary}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}

        {driverPosition && (
          <Marker
            coordinate={driverPosition}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            <CarMarker
              rotation={driverBearing}
              category={selectedCategory === 'MOTO' ? 'moto' : 'car'}
            />
          </Marker>
        )}
      </MapView>

      {/* Add recenter button */}
      <TouchableOpacity 
        style={styles.centerButton}
        onPress={centerOnUser}
      >
        <MaterialIcons name="my-location" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Search Container */}
      {!rideInProgress && (
        <View style={styles.searchContainerYYabgo}>
          <View style={styles.inputIconContainer}>
            <MaterialIcons name="my-location" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.inputContainerYYabgo}>
            <TextInput
              style={styles.inputYYabgo}
              placeholder="Minha localização"
              editable={false}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.inputIconContainer}>
            <MaterialIcons name="search" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.inputContainerYYabgo}>
            <TextInput
              style={styles.inputYYabgo}
              placeholder="Para onde?"
              value={searchQuery}
              onChangeText={handleSearch}
              editable={!rideInProgress}
            />
          </View>
        </View>
      )}

      {/* Search Results */}
      {!rideInProgress && searchResults.length > 0 && (
        <View style={styles.resultsContainerYYabgo}>
          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={styles.resultItemYYabgo}
              onPress={() => handleSelectDestination(result)}
            >
              <View style={styles.resultIconContainer}>
                <MaterialIcons name="location-on" size={24} color={COLORS.text.secondary} />
              </View>
              <Text style={styles.resultTextYYabgo}>{result.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Searching Driver Animation */}
      {isSearchingDriver && (
        <View style={styles.searchingContainerYYabgo}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.searchingTextYYabgo}>Procurando motoristas próximos...</Text>
        </View>
      )}

      {/* Driver Found Card */}
      {tripStatus === 'found' && driverInfo && !showDriverOnWayModal && !showStartRideModal && (
        <View style={styles.driverCardYYabgo}>
          <Image source={{ uri: driverInfo.photo }} style={styles.driverPhotoYYabgo} />
          <View style={styles.driverInfoYYabgo}>
            <Text style={styles.driverNameYYabgo}>{driverInfo.name}</Text>
            <Text style={styles.driverRatingYYabgo}>★ {driverInfo.rating}</Text>
            <Text style={styles.carInfoYYabgo}>{driverInfo.car} • {driverInfo.plate}</Text>
          </View>
          <View style={styles.tripInfoYYabgo}>
            <Text style={styles.estimatedPriceYYabgo}>AKZ {estimatedPrice}</Text>
            <Text style={styles.estimatedTimeYYabgo}>{estimatedTime} min</Text>
          </View>
        </View>
      )}

      {/* Car Categories Modal */}
      <DriverOnWayModal />
      <StartRideModal />
      <ChatModal />
      <CarCategoriesModal />
      <PaymentMethodModal />
      <RideCompleteModal />
      <EmergencyOptionsModal />
      <Notification />
      <RideProgressBar />
      
      {/* Emergency Quick Access Button */}
      {(showDriverOnWayModal || rideInProgress) && (
        <TouchableOpacity 
          style={[
            styles.sosButton,
            emergencyMode && styles.sosButtonActive
          ]}
          onPress={activateEmergency}
        >
          <Text style={styles.sosButtonText}>SOS</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainerYYabgo: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  inputIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainerYYabgo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  inputYYabgo: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 40,
    marginRight: 8,
  },
  resultsContainerYYabgo: {
    position: 'absolute',
    top: 144,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: 280,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  resultItemYYabgo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  resultIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTextYYabgo: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  centerButton: {
    position: 'absolute',
    right: 16,
    bottom: 150,
    zIndex: 999,
  },
  centerButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchingContainerYYabgo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  searchingTextYYabgo: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  driverCardYYabgo: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  driverPhotoYYabgo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  driverInfoYYabgo: {
    flex: 1,
  },
  driverNameYYabgo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainerYYabgo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  driverRatingYYabgo: {
    fontSize: 14,
    color: '#555',
    marginLeft: 4,
  },
  carInfoYYabgo: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  tripInfoYYabgo: {
    alignItems: 'flex-end',
  },
  estimatedPriceYYabgo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  estimatedTimeYYabgo: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  yyabgoCategoriesModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  yyabgoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yyabgoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  yyabgoCategoriesScroll: {
    maxHeight: 300,
  },
  yyabgoCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  yyabgoCategoryIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  yyabgoCategoryInfo: {
    flex: 1,
  },
  yyabgoCategoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  yyabgoCategoryDescription: {
    fontSize: 14,
    color: '#777',
  },
  yyabgoCategoryEta: {
    fontSize: 14,
    color: '#777',
  },
  yyabgoCategoryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  yyabgoChatModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  yyabgoChatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yyabgoCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yyabgoChatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  yyabgoMessagesContainer: {
    maxHeight: 300,
  },
  yyabgoMessageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  yyabgoDriverMessage: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 8,
  },
  yyabgoUserMessage: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 8,
  },
  yyabgoMessageText: {
    fontSize: 14,
    color: '#333',
  },
  yyabgoMessageTime: {
    fontSize: 12,
    color: '#777',
  },
  yyabgoDriverOnWayCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  yyabgoDriverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  yyabgoDriverPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  yyabgoDriverDetails: {
    flex: 1,
  },
  yyabgoDriverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  yyabgoCarInfo: {
    fontSize: 14,
    color: '#777',
  },
  yyabgoPlate: {
    fontSize: 14,
    color: '#777',
  },
  yyabgoDirectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  yyabgoDirectionIndicator: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  yyabgoEstimatedInfo: {
    fontSize: 14,
    color: '#777',
  },
  yyabgoRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  yyabgoRating: {
    fontSize: 14,
    color: '#FFBF00',
  },
  yyabgoActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  yyabgoActionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yyabgoCancelButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    padding: 8,
  },
  yyabgoStartRideModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  yyabgoModalSubtitle: {
    fontSize: 14,
    color: '#777',
  },
  yyabgoStartRideButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  yyabgoStartRideButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  yyabgoNotification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yyabgoNotificationText: {
    fontSize: 14,
    color: 'white',
  },
  yyabgoProgressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  yyabgoProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yyabgoDestinationInfo: {
    flex: 1,
  },
  yyabgoProgressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  yyabgoProgressAddress: {
    fontSize: 14,
    color: '#777',
  },
  yyabgoTrafficContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  yyabgoTrafficWarning: {
    fontSize: 14,
    color: '#FF6B6B',
    marginLeft: 4,
  },
  yyabgoProgressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  yyabgoProgressBarContainer: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f0f0f0',
  },
  yyabgoProgressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  modalContainer: {
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
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
  },
  selectedPaymentMethod: {
    backgroundColor: COLORS.primary,
  },
  paymentMethodText: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  selectedPaymentMethodText: {
    color: COLORS.white,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  rideCompleteHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rideCompleteTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 5,
  },
  rideCompleteSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  driverRatingContainer: {
    alignItems: 'center',
  },
  ratingDriverPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  ratingDriverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  thankYouText: {
    fontSize: 16,
    color: COLORS.primary,
    marginTop: 15,
  },
  emergencyModal: {
    backgroundColor: '#FF3B30',
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  emergencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
  },
  emergencyCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  emergencyCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  extraButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  paymentButton: {
    flex: 1.5,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    marginRight: 5,
  },
  paymentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentButtonText: {
    flex: 1,
    color: COLORS.text.primary,
    marginLeft: 5,
  },
  securityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
  },
  securityButtonText: {
    color: COLORS.text.primary,
    marginLeft: 5,
    fontSize: 12,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    marginLeft: 5,
  },
  emergencyButtonText: {
    color: '#FF3B30',
    marginLeft: 5,
    fontSize: 12,
  },
  sosButton: {
    position: 'absolute',
    top: 80,
    right: 15,
    backgroundColor: '#FF3B30',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sosButtonActive: {
    backgroundColor: '#8B0000',
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});