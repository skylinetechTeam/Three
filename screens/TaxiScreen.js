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
  Dimensions 
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps'; // Change back to react-native-maps
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
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
    setNotification({
      show: true,
      message: 'Você chegou ao seu destino!',
      type: 'success'
    });
    setTimeout(() => {
      setRideInProgress(false);
      setTripStatus('idle');
      setSelectedDestination(null);
      setRoutePath([]);
      setDriverPosition(null);
      setRideProgress(0);
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
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
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Escolha seu carro</Text>
          {Object.entries(CAR_CATEGORIES).map(([key, category]) => (
            <TouchableOpacity
              key={key}
              style={styles.categoryCard}
              onPress={() => handleSelectCar(key)}
            >
              <MaterialIcons name={category.icon} size={24} color={COLORS.primary} />
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
                <Text style={styles.categoryEta}>{category.eta}</Text>
              </View>
              <Text style={styles.categoryPrice}>
                {`${Math.round(category.basePrice + (category.pricePerKm * (estimatedTime || 0)))} Kz`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ) : null
  );

  // Add chat modal component
  const ChatModal = () => (
    showChat ? (
      <View style={styles.modalContainer}>
        <View style={styles.chatModalContent}>
          <View style={styles.chatHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowChat(false)}
            >
              <MaterialIcons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.chatTitle}>Chat com motorista</Text>
          </View>
          <View style={styles.messagesContainer}>
            {messages.map((msg) => (
              <View 
                key={msg.id} 
                style={[
                  styles.messageBox,
                  msg.sender === 'driver' ? styles.driverMessage : styles.userMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.sender === 'user' && { color: COLORS.white }
                ]}>
                  {msg.text}
                </Text>
                <Text style={[
                  styles.messageTime,
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
      <View style={styles.compactModalContainer}>
        <View style={styles.compactModalContent}>
          {driverInfo && (
            <>
              <View style={styles.driverHeaderInfo}>
                <Image source={{ uri: driverInfo.photo }} style={styles.compactDriverPhoto} />
                <View style={styles.compactDriverDetails}>
                  <Text style={styles.compactDriverName}>{driverInfo.name}</Text>
                  <Text style={styles.compactCarInfo}>{driverInfo.car}</Text>
                  <Text style={styles.compactPlate}>{driverInfo.plate}</Text>
                  <View style={styles.directionContainer}>
                    <MaterialIcons 
                      name="navigation" 
                      size={16} 
                      color={COLORS.primary}
                      style={[
                        styles.directionIndicator,
                        { transform: [{ rotate: `${driverBearing}deg` }] }
                      ]}
                    />
                    <Text style={styles.estimatedInfo}>
                      {distanceToDriver}km • {estimatedArrival} min
                    </Text>
                  </View>
                </View>
                <View style={styles.ratingContainer}>
                  <Text style={styles.compactRating}>★ {driverInfo.rating}</Text>
                </View>
              </View>
              
              <View style={styles.compactActionButtons}>
                <TouchableOpacity 
                  style={styles.compactActionButton}
                  onPress={() => setShowChat(true)}
                >
                  <MaterialIcons name="chat" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.compactActionButton, styles.cancelButton]}
                  onPress={handleCancelRide}
                >
                  <MaterialIcons name="close" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    ) : null
  );

  // Add start ride modal component
  const StartRideModal = () => (
    showStartRideModal ? (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Motorista chegou!</Text>
          <Text style={styles.modalSubtitle}>Pronto para iniciar a viagem?</Text>
          <TouchableOpacity 
            style={styles.startRideButton}
            onPress={handleStartRide}
          >
            <Text style={styles.startRideButtonText}>Iniciar Viagem</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : null
  );

  // Add Notification component
  const Notification = () => (
    notification.show && (
      <Animated.View style={[
        styles.notification,
        { backgroundColor: notification.type === 'success' ? COLORS.primary : '#ff4444' }
      ]}>
        <Text style={styles.notificationText}>{notification.message}</Text>
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
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <View>
            <Text style={styles.progressTitle}>A caminho do destino</Text>
            <Text style={styles.progressAddress} numberOfLines={1}>
              {selectedDestination?.name}
            </Text>
            {routeData?.congestionLevel > 1.3 && (
              <Text style={styles.trafficWarning}>
                <MaterialIcons name="traffic" size={16} color="#FF6B6B" />
                {' Trânsito intenso'}
              </Text>
            )}
          </View>
          <Text style={styles.progressPercentage}>{Math.round(rideProgress)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${rideProgress}%` }]} />
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

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
        onRegionChangeComplete={setInitialRegion}
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
            <MaterialIcons name="location-on" size={40} color={COLORS.primary} />
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
        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="my-location" size={24} color={COLORS.primary} />
            <TextInput
              style={styles.input}
              placeholder="Minha localização"
              editable={false}
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="search" size={24} color={COLORS.primary} />
            <TextInput
              style={styles.input}
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
        <View style={styles.resultsContainer}>
          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={styles.resultItem}
              onPress={() => handleSelectDestination(result)}
            >
              <MaterialIcons name="location-on" size={24} color={COLORS.text.secondary} />
              <Text style={styles.resultText}>{result.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Searching Driver Animation */}
      {isSearchingDriver && (
        <Animated.View style={[styles.searchingContainer, {
          opacity: searchingAnimation
        }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.searchingText}>Procurando motoristas próximos...</Text>
        </Animated.View>
      )}

      {/* Driver Found Card */}
      {tripStatus === 'found' && driverInfo && !showDriverOnWayModal && !showStartRideModal && (
        <View style={styles.driverCard}>
          <Image source={{ uri: driverInfo.photo }} style={styles.driverPhoto} />
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driverInfo.name}</Text>
            <Text style={styles.driverRating}>★ {driverInfo.rating}</Text>
            <Text style={styles.carInfo}>{driverInfo.car} • {driverInfo.plate}</Text>
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.estimatedPrice}>AKZ {estimatedPrice}</Text>
            <Text style={styles.estimatedTime}>{estimatedTime} min</Text>
          </View>
        </View>
      )}

      {/* Car Categories Modal */}
      <DriverOnWayModal />
      <StartRideModal />
      <ChatModal />
      <CarCategoriesModal />
      <Notification />
      <RideProgressBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  resultsContainer: {
    position: 'absolute',
    top: 150,
    left: 20,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 10,
    maxHeight: height * 0.4,
    ...SHADOWS.medium,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultText: {
    marginLeft: 10,
    fontSize: 16,
  },
  searchingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    flexDirection: 'row',
    ...SHADOWS.medium,
  },
  searchingText: {
    marginLeft: 15,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  driverCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 24,
  },
  driverPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  driverInfo: {
    flex: 1,
    marginLeft: 15,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverRating: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  carInfo: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  tripInfo: {
    alignItems: 'flex-end',
  },
  estimatedPrice: {
    fontSize: 18,
    fontWeight: 'bold',     
    color: COLORS.primary,
  },
  estimatedTime: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  centerButton: {
    position: 'absolute',
    right: 15,
    bottom: 100,
    zIndex: 1,
  },
  centerButtonInner: {
    backgroundColor: COLORS.white,
    borderRadius: 50,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    transform: [{ scale: 1 }],
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingTop: 20,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 15,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryDescription: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  categoryEta: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  categoryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  chatModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    height: height * 0.6,
    elevation: 24,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  messagesContainer: {
    flex: 1,
  },
  messageBox: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    maxWidth: '80%',
    elevation: 1,
  },
  driverMessage: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  userMessage: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.text.secondary,
    alignSelf: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderRadius: 20,
  },
  startRideButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  startRideButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 10,
  },
  notification: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
  },
  notificationText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  destinationIndicator: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 10,
  },
  arrowContainer: {
    alignItems: 'center',
    height: 100,
  },
  arrowLine: {
    height: 60,
    width: 2,
    marginVertical: 5,
    overflow: 'hidden',
  },
  gradientLine: {
    flex: 1,
    width: '100%',
  },
  bounceArrow: {
    marginTop: -5,
  },
  destinationAddress: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 10,
  },
  destinationSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  driverInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    ...SHADOWS.medium,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  progressAddress: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  compactModalContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'transparent',
  },
  compactModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  driverHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactDriverPhoto: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  compactDriverDetails: {
    flex: 1,
  },
  compactDriverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  compactCarInfo: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  compactPlate: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  ratingContainer: {
    backgroundColor: COLORS.primary + '15',
    padding: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  compactRating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  compactActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  estimatedInfo: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  directionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  directionIndicator: {
    marginRight: 8,
  },
  trafficWarning: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
});