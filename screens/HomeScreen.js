import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Modal, Animated, ActivityIndicator, Image, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  // Estados de localização
  const [location, setLocation] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Estados para busca e destino
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);

  // Estado para rota e detalhes da viagem
  const [routePath, setRoutePath] = useState([]);
  const [rideDetails, setRideDetails] = useState({
    time: null,
    price: null,
    paymentMethod: null,
  });
  const [tripStatus, setTripStatus] = useState('idle'); // idle, searching, driverFound, inProgress, completed
  const [eta, setEta] = useState(null);

  // Para simular movimentação do motorista
  const [driverPosition, setDriverPosition] = useState(null);
  const driverIntervalRef = useRef(null);

  const locationSubscription = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Add new states
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const searchingAnimation = useRef(new Animated.Value(0)).current;

  // Add driver state
  const [driverInfo, setDriverInfo] = useState({
    name: "João Silva",
    rating: 4.8,
    car: "Honda Civic",
    plate: "ABC-1234",
    photo: "https://randomuser.me/api/portraits/men/1.jpg"
  });

  // Add cancel trip state
  const [tripStarted, setTripStarted] = useState(false);

  // Add state for moving cars
  const [cars, setCars] = useState([]);
  const carsIntervalRef = useRef(null);

  // Add new states for driver arrival and journey start
  const [driverArrived, setDriverArrived] = useState(false);
  const [journeyStarted, setJourneyStarted] = useState(false);

  // Add ref for MapView
  const mapRef = useRef(null);

  // Requisita e monitora a localização do usuário
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão de localização negada");
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      const userRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setLocation(loc);
      setUserMarker(userRegion);
      setInitialRegion(userRegion);
    })();
  }, []);

  // Atualiza localização com watchPositionAsync
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          const newMarker = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setLocation(newLocation);
          setUserMarker(newMarker);
        }
      );
    })();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Initialize moving cars
  useEffect(() => {
    if (userMarker) {
      const initialCars = [
        { id: 1, coordinate: {...userMarker, latitude: userMarker.latitude + 0.002, longitude: userMarker.longitude - 0.001} },
        { id: 2, coordinate: {...userMarker, latitude: userMarker.latitude - 0.001, longitude: userMarker.longitude + 0.002} },
        { id: 3, coordinate: {...userMarker, latitude: userMarker.latitude + 0.001, longitude: userMarker.longitude + 0.001} }
      ];
      setCars(initialCars);
  
      // Animate cars randomly
      carsIntervalRef.current = setInterval(() => {
        setCars(prev => prev.map(car => ({
          ...car,
          coordinate: {
            latitude: car.coordinate.latitude + (Math.random() - 0.5) * 0.0005,
            longitude: car.coordinate.longitude + (Math.random() - 0.5) * 0.0005
          }
        })));
      }, 1000);
  
      return () => {
        if (carsIntervalRef.current) clearInterval(carsIntervalRef.current);
      };
    }
  }, [userMarker]);

  // Modifique a função handleSearchPlaces para usar a Google Places API
  const handleSearchPlaces = (text) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      
    searchTimeoutRef.current = setTimeout(async () => {
      if (text.length > 2 && userMarker) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` + 
            new URLSearchParams({
              q: text,
              format: 'json',
              limit: 5,
              viewbox: `${userMarker.longitude-1},${userMarker.latitude-1},${userMarker.longitude+1},${userMarker.latitude+1}`,
              'accept-language': 'pt-BR'
            }),
            {
              headers: {
                'User-Agent': 'TravelApp/1.0', // Required by Nominatim
                'Accept': 'application/json'
              }
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
          }

          const data = await response.json();
          const formattedResults = data.map(item => ({
            name: item.display_name,
            placeId: item.place_id,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon)
          }));
          setSearchResults(formattedResults);
        } catch (error) {
          console.error('Erro na busca:', error);
          setSearchResults([]); // Clear results on error
        }
      }
    }, 1000); // Increased timeout to 1 second for rate limiting
  };

  // Simplifica a função getPlaceDetails pois Nominatim já fornece coordenadas
  const getRouteCoordinates = async (start, end) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        return data.routes[0].geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0]
        }));
      }
      return null;
    } catch (error) {
      console.error('Error fetching route:', error);
      return null;
    }
  };

  // Update handleSelectDestination
  const handleSelectDestination = async (destination) => {
    setSelectedDestination(destination);
    setSearchResults([]);
    setSearchQuery('');

    if (userMarker) {
      // Get route coordinates
      const routeCoordinates = await getRouteCoordinates(userMarker, destination);
      if (routeCoordinates) {
        setRoutePath(routeCoordinates);
        simulateDriverRoute(routeCoordinates);
      } else {
        // Fallback to straight line if route fetch fails
        setRoutePath([
          { latitude: userMarker.latitude, longitude: userMarker.longitude },
          { latitude: destination.latitude, longitude: destination.longitude }
        ]);
      }
    }

    // Start searching animation
    setIsSearchingDriver(true);
    startSearchingAnimation();

    // Simulate driver search with timeout
    setTimeout(() => {
      setIsSearchingDriver(false);
      setModalVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
      // ...existing modal code
    }, 3000); // 3 seconds delay

    // Define detalhes simulados da viagem
    setRideDetails({
      time: '15 min',
      price: 'R$ 20,00',
      paymentMethod: 'Cartão de Crédito',
    });

    setTripStatus('driverEnRoute');
    setEta(15);

    // Inicia simulação de movimentação do motorista
    setDriverPosition({ ...userMarker }); // inicia na posição do usuário
    driverIntervalRef.current = setInterval(() => {
      setDriverPosition((prev) => {
        if (prev) {
          // Movimenta o motorista em direção ao destino
          const diffLat = destination.latitude - prev.latitude;
          const diffLong = destination.longitude - prev.longitude;
          return {
            latitude: prev.latitude + diffLat * 0.1,
            longitude: prev.longitude + diffLong * 0.1,
          };
        }
        return prev;
      });
      setEta((prevEta) => (prevEta && prevEta > 0 ? prevEta - 1 : 0));
    }, 5000);
  };

  // Limpa a simulação quando o componente é desmontado ou status é alterado
  useEffect(() => {
    return () => {
      if (driverIntervalRef.current) clearInterval(driverIntervalRef.current);
    };
  }, []);

  // Add skeleton animation
  const startSearchingAnimation = () => {
    Animated.sequence([
      Animated.timing(searchingAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }),
      Animated.timing(searchingAnimation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true
      })
    ]).start((finished) => {
      if (finished) {
        startSearchingAnimation();
      }
    });
  };

  // Add dummy drivers array
  const dummyDrivers = [
    {
      id: 1,
      coordinate: {
        latitude: userMarker ? userMarker.latitude + 0.002 : -23.5505,
        longitude: userMarker ? userMarker.longitude - 0.001 : -46.6333,
      }
    },
    {
      id: 2,
      coordinate: {
        latitude: userMarker ? userMarker.latitude - 0.001 : -23.5505,
        longitude: userMarker ? userMarker.longitude + 0.002 : -46.6333,
      }
    },
    {
      id: 3,
      coordinate: {
        latitude: userMarker ? userMarker.latitude + 0.001 : -23.5505,
        longitude: userMarker ? userMarker.longitude + 0.001 : -46.6333,
      }
    }
  ];

  // Update driver movement along route
  const simulateDriverRoute = (routeCoords) => {
    let currentIndex = 0;
    
    if (driverIntervalRef.current) clearInterval(driverIntervalRef.current);
    
    driverIntervalRef.current = setInterval(() => {
      if (currentIndex < routeCoords.length) {
        setDriverPosition(routeCoords[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(driverIntervalRef.current);
        // Simulate arrival
        setTripStatus('arrived');
        setTimeout(() => {
          // Start journey simulation
          setTripStatus('inProgress');
          simulateJourney(routeCoords.reverse());
        }, 2000);
      }
    }, 1000);
  };

  // Simulate actual journey
  const simulateJourney = (routeCoords) => {
    let journeyIndex = 0;
    
    driverIntervalRef.current = setInterval(() => {
      if (journeyIndex < routeCoords.length) {
        setDriverPosition(routeCoords[journeyIndex]);
        journeyIndex++;
      } else {
        clearInterval(driverIntervalRef.current);
        // Trip completed
        setTripStatus('completed');
        handleTripComplete();
      }
    }, 1000);
  };

  // Update handleConfirmTrip
  const handleConfirmTrip = async () => {
    setModalVisible(false);
    setTripStarted(true);
    setTripStatus('inProgress');
    
    if (routePath.length > 0) {
      simulateDriverRoute(routePath);
    }
  };

  // Add floating info component
  const TripInfo = () => (
    <View style={{
      position: 'absolute',
      top: 50,
      left: 20,
      right: 20,
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 5
    }}>
      <Image 
        source={{uri: driverInfo.photo}}
        style={{width: 40, height: 40, borderRadius: 20}}
      />
      <View style={{marginLeft: 10, flex: 1}}>
        <Text style={{fontWeight: 'bold'}}>{driverInfo.name}</Text>
        <Text>{driverInfo.car} • {driverInfo.plate}</Text>
      </View>
      <MaterialIcons name="star" size={16} color="#FFD700" />
      <Text style={{marginLeft: 4}}>{driverInfo.rating}</Text>
    </View>
  );

  // Add cancel button
  const CancelButton = () => (
    <TouchableOpacity
      style={{
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 30,
        elevation: 5
      }}
      onPress={() => {
        setTripStarted(false);
        setTripStatus('idle');
        setSelectedDestination(null);
        setRoutePath([]);
        if (driverIntervalRef.current) {
          clearInterval(driverIntervalRef.current);
        }
      }}
    >
      <MaterialIcons name="close" size={30} color="red" />
    </TouchableOpacity>
  );

  // Simulate driver to pickup
  const simulateDriverToPickup = async (driverStartPosition, userPosition) => {
    const pickupRoute = await getRouteCoordinates(driverStartPosition, userPosition);
    if (!pickupRoute) return;
  
    let index = 0;
    driverIntervalRef.current = setInterval(() => {
      if (index < pickupRoute.length) {
        setDriverPosition(pickupRoute[index]);
        index++;
      } else {
        clearInterval(driverIntervalRef.current);
        setDriverArrived(true);
        Alert.alert("Motorista chegou!", "Seu motorista está aguardando");
      }
    }, 1000);
  };
  
  // Start journey
  const startJourney = async () => {
    setDriverArrived(false);
    setJourneyStarted(true);
    if (driverIntervalRef.current) clearInterval(driverIntervalRef.current);
  
    const journeyRoute = await getRouteCoordinates(userMarker, selectedDestination);
    if (!journeyRoute) return;
  
    let index = 0;
    driverIntervalRef.current = setInterval(() => {
      if (index < journeyRoute.length) {
        setDriverPosition(journeyRoute[index]);
        index++;
      } else {
        clearInterval(driverIntervalRef.current);
        setTripStatus('completed');
        Alert.alert("Viagem finalizada!", "Você chegou ao destino");
      }
    }, 1000);
  };
  
  // Change destination
  const changeDestination = async (newDestination) => {
    if (!driverPosition) return;
    
    setSelectedDestination(newDestination);
    const newRoute = await getRouteCoordinates(driverPosition, newDestination);
    if (newRoute) {
      setRoutePath(newRoute);
      if (driverIntervalRef.current) clearInterval(driverIntervalRef.current);
      let index = 0;
      driverIntervalRef.current = setInterval(() => {
        if (index < newRoute.length) {
          setDriverPosition(newRoute[index]);
          index++;
        } else {
          clearInterval(driverIntervalRef.current);
          setTripStatus('completed');
        }
      }, 1000);
    }
  };

  // Add function to center map on user location
  const centerOnUser = () => {
    if (mapRef.current && userMarker) {
      mapRef.current.animateToRegion({
        latitude: userMarker.latitude,
        longitude: userMarker.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      }, 1000);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {cars.map(car => (
          <Marker
            key={car.id}
            coordinate={car.coordinate}
          >
            <MaterialIcons name="directions-car" size={24} color="black" />
          </Marker>
        ))}
        {driverPosition && tripStatus !== 'completed' && (
          <Marker coordinate={driverPosition}>
            <MaterialIcons 
              name="directions-car" 
              size={24} 
              color={tripStatus === 'inProgress' ? 'blue' : 'green'} 
            />
          </Marker>
        )}
        {routePath.length > 0 && (
          <Polyline coordinates={routePath} strokeColor="#FF0000" strokeWidth={3} />
        )}
      </MapView>

      {/* Exibe a localização atual do usuário */}
      {userMarker && (
        <View
          style={{
            position: 'absolute',
            top: 120,
            left: 20,
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: 10,
            borderRadius: 10,
            elevation: 3,
          }}
        >
         
        </View>
      )}

      {/* Campo de pesquisa de destino */}
      <View
        style={{
          position: 'absolute',
          top: 50,
          left: 20,
          right: 20,
          backgroundColor: 'white',
          borderRadius: 8,
          padding: 10,
          elevation: 3,
        }}
      >
        <TextInput
          placeholder="Digite seu destino"
          value={searchQuery}
          onChangeText={handleSearchPlaces}
          style={{ height: 40 }}
        />
        {searchResults.length > 0 && (
          <View style={{ marginTop: 5 }}>
            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSelectDestination(result)}
                style={{
                  padding: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#ccc',
                }}
              >
                <Text>{result.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Detalhes da viagem */}
      {selectedDestination && (
        <View
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: 'white',
            padding: 15,
            borderRadius: 10,
            elevation: 3,
          }}
        >
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Detalhes da Viagem</Text>
          <Text>Tempo estimado: {rideDetails.time}</Text>
          <Text>Preço: {rideDetails.price}</Text>
          <Text>Forma de pagamento: {rideDetails.paymentMethod}</Text>
          <Text>Status: {tripStatus}</Text>
          {eta !== null && <Text>ETA: {eta} min</Text>}
        </View>
      )}

      {/* Searching Driver Skeleton */}
      {isSearchingDriver && (
        <View 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            padding: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            elevation: 5
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#000" />
            <Animated.View
              style={{
                marginLeft: 15,
                opacity: searchingAnimation
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                Procurando motoristas próximos...
              </Text>
              <Text style={{ color: '#666' }}>
                Aguarde enquanto encontramos o melhor motorista
              </Text>
            </Animated.View>
          </View>
        </View>
      )}

      {/* Trip info and cancel button when trip is active */}
      {tripStarted && (
        <>
          <TripInfo />
          <CancelButton />
        </>
      )}

      {/* Start journey button */}
      {driverArrived && !journeyStarted && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 100,
            left: 20,
            right: 20,
            backgroundColor: '#2196F3',
            padding: 15,
            borderRadius: 10,
            alignItems: 'center'
          }}
          onPress={startJourney}
        >
          <Text style={{color: 'white', fontSize: 16}}>Iniciar Viagem</Text>
        </TouchableOpacity>
      )}

      {/* Add center button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 20,
          bottom: 100,
          backgroundColor: 'white',
          padding: 10,
          borderRadius: 30,
          elevation: 5
        }}
        onPress={centerOnUser}
      >
        <MaterialIcons name="my-location" size={30} color="#2196F3" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: fadeAnim
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              elevation: 5
            }}
          >
            {!tripStarted ? (
              <>
                <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 15}}>
                  Detalhes da Viagem
                </Text>
                <View style={{flexDirection: 'row', marginBottom: 20}}>
                  <Image 
                    source={{uri: driverInfo.photo}}
                    style={{width: 60, height: 60, borderRadius: 30}}
                  />
                  <View style={{marginLeft: 15}}>
                    <Text style={{fontSize: 16, fontWeight: 'bold'}}>{driverInfo.name}</Text>
                    <Text>{driverInfo.rating} ★</Text>
                    <Text>{driverInfo.car} • {driverInfo.plate}</Text>
                  </View>
                </View>
                <Text>Tempo estimado: {rideDetails.time}</Text>
                <Text>Preço: {rideDetails.price}</Text>
                <Text>Forma de pagamento: {rideDetails.paymentMethod}</Text>
                
                <TouchableOpacity
                  style={{
                    backgroundColor: '#000',
                    padding: 15,
                    borderRadius: 10,
                    alignItems: 'center',
                    marginTop: 20
                  }}
                  onPress={handleConfirmTrip}
                >
                  <Text style={{color: 'white'}}>Confirmar Viagem</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 15}}>
                  Viagem em Andamento
                </Text>
                <View style={{flexDirection: 'row', marginBottom: 20}}>
                  <Image 
                    source={{uri: driverInfo.photo}}
                    style={{width: 60, height: 60, borderRadius: 30}}
                  />
                  <View style={{marginLeft: 15}}>
                    <Text style={{fontSize: 16, fontWeight: 'bold'}}>{driverInfo.name}</Text>
                    <Text>{driverInfo.car} • {driverInfo.plate}</Text>
                    <Text>Chegada em: {eta} min</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={{
                    backgroundColor: '#ff0000',
                    padding: 15,
                    borderRadius: 10,
                    alignItems: 'center',
                    marginTop: 20
                  }}
                  onPress={() => {
                    setTripStarted(false);
                    setModalVisible(false);
                    setSelectedDestination(null);
                    setRoutePath([]);
                    // Reset other relevant states
                  }}
                >
                  <Text style={{color: 'white'}}>Cancelar Viagem</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}