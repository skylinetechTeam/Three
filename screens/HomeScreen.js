import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { searchPlaces } from '../services/placesService';

// Motoristas fixos para simulação (os offsets serão aplicados à localização real do usuário)
const fakeDrivers = [
  { id: 'driver1', name: 'Carlos', offsetLat: 0.005, offsetLon: -0.005 },
  { id: 'driver2', name: 'Mariana', offsetLat: -0.004, offsetLon: 0.004 },
  { id: 'driver3', name: 'João', offsetLat: 0.003, offsetLon: -0.003 },
];

export default function HomeScreen() {
  // Estados de localização
  const [location, setLocation] = useState(null); // localização real obtida do dispositivo
  const [backupLocation, setBackupLocation] = useState(null); // para restauração
  const [userMarker, setUserMarker] = useState(null); // marcador que representa a posição do usuário no mapa

  // Estados para busca e destino
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialRegion, setInitialRegion] = useState({
    latitude: -8.8389,
    longitude: 13.2894,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Estados para fluxo do motorista
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverPosition, setDriverPosition] = useState(null); // posição simulada do motorista
  const [tripStatus, setTripStatus] = useState('idle'); // 'idle' | 'driverEnRoute' | 'toDestination' | 'arrived'
  const [eta, setEta] = useState(null); // tempo estimado (minutos)

  const intervalRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Obter a localização real do usuário e armazenar backup
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão Necessária", "Precisamos da sua permissão para mostrar sua localização no mapa");
        return;
      }
      try {
        let loc = await Location.getCurrentPositionAsync({});
        const userRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setLocation(loc);
        setBackupLocation(userRegion);
        setUserMarker(userRegion);
        setInitialRegion(userRegion);
      } catch (error) {
        console.error("Erro ao obter localização:", error);
        Alert.alert("Erro", "Não foi possível obter sua localização");
      }
    })();
  }, []);

  // Lógica de pesquisa de destino
  const handleSearchPlaces = async (text) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      if (text.length > 2 && location) {
        setIsLoading(true);
        try {
          const results = await searchPlaces(text, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (Array.isArray(results) && results.length > 0) {
            setSearchResults(results);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error('Erro na busca:', error);
          Alert.alert("Erro", "Não foi possível realizar a busca");
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
  };

  // Ao selecionar um destino, salva-o e gera os motoristas disponíveis
  const handleDestinationSelect = (prediction) => {
    const destination = {
      name: prediction.structured_formatting.main_text,
      address: prediction.structured_formatting.secondary_text,
      latitude: prediction.lat,
      longitude: prediction.lon,
    };
  
    const distPickupToDest = calculateDistance(
      backupLocation.latitude,
      backupLocation.longitude,
      destination.latitude,
      destination.longitude
    );
  
    let simulatedDestination = { ...destination };
  
    if (distPickupToDest < 100) { // Aumentamos a distância mínima para 100 metros
      // Adiciona 0.02 graus (aproximadamente 2.2 km) na latitude e longitude
      simulatedDestination.latitude = backupLocation.latitude + 0.02;
      simulatedDestination.longitude = backupLocation.longitude + 0.02;
      Alert.alert(
        "Destino simulado",
        `Destino ajustado para ${simulatedDestination.latitude.toFixed(4)}, ${simulatedDestination.longitude.toFixed(4)}`
      );
    }
  
    setSelectedDestination(simulatedDestination);
    setSearchResults([]);
    setSearchQuery(simulatedDestination.name);
  
    if (backupLocation) {
      const drivers = fakeDrivers.map(driver => ({
        ...driver,
        latitude: backupLocation.latitude + driver.offsetLat,
        longitude: backupLocation.longitude + driver.offsetLon,
      }));
      setAvailableDrivers(drivers);
    }
  };


  // Ao selecionar um motorista, inicia a simulação de pickup (fase "driverEnRoute")
  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
    setDriverPosition({ latitude: driver.latitude, longitude: driver.longitude });
    setTripStatus('driverEnRoute');
  };

  // Função para calcular distância (em metros) entre duas coordenadas
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000; // raio da Terra em metros
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Função para mover uma posição em direção a um target com um passo fixo (em metros)
  const moveTowards = (current, target, stepMeters) => {
    const distance = calculateDistance(current.latitude, current.longitude, target.latitude, target.longitude);
    if (distance < stepMeters) return target;
    const ratio = stepMeters / distance;
    const newLat = current.latitude + (target.latitude - current.latitude) * ratio;
    const newLon = current.longitude + (target.longitude - current.longitude) * ratio;
    return { latitude: newLat, longitude: newLon };
  };

  // Fase "driverEnRoute": o motorista se desloca até o pickup (localização real)
  useEffect(() => {
    if (selectedDriver && tripStatus === 'driverEnRoute' && backupLocation) {
        const pickupPoint = { 
          latitude: backupLocation.latitude, 
          longitude: backupLocation.longitude 
        };
        
        // Verifica se o destino é válido
        if (!selectedDestination || calculateDistance(
          pickupPoint.latitude,
          pickupPoint.longitude,
          selectedDestination.latitude,
          selectedDestination.longitude
        ) < 50) {
          Alert.alert("Erro", "Destino inválido ou muito próximo.");
          handleCancel();
          return;
        }
      intervalRef.current = setInterval(() => {
        setDriverPosition(prevPos => {
          if (!prevPos) return null;
          const newPos = moveTowards(prevPos, pickupPoint, 20); // passo de 20 metros para pickup
          const dist = calculateDistance(newPos.latitude, newPos.longitude, pickupPoint.latitude, pickupPoint.longitude);
          const estimatedTimeSec = dist / 11.1;
          setEta((estimatedTimeSec / 60).toFixed(1));
          // Atualiza a região mantendo os deltas
          setInitialRegion(prev => ({
            ...prev,
            latitude: newPos.latitude,
            longitude: newPos.longitude,
          }));
          if (dist < 20) {
            clearInterval(intervalRef.current);
            // Atualiza o marcador do usuário para a posição de pickup
            setUserMarker(newPos);
            // Passa para a fase "toDestination"
            setTripStatus('toDestination');
            startTripToDestination(newPos);
          }
          return newPos;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [selectedDriver, tripStatus, backupLocation]);

  const startTripToDestination = (pickupPos) => {
    if (!selectedDestination) return;
    const stepMeters = 30; // Aumentamos o passo para 30 metros por segundo (108 km/h)
    
    intervalRef.current = setInterval(() => {
      setDriverPosition(prevPos => {
        if (!prevPos) return null;
        const newPos = moveTowards(prevPos, {
          latitude: selectedDestination.latitude,
          longitude: selectedDestination.longitude,
        }, stepMeters);
        
        const dist = calculateDistance(newPos.latitude, newPos.longitude, 
          selectedDestination.latitude, selectedDestination.longitude);
        
        const estimatedTimeSec = dist / (stepMeters); // Tempo baseado no passo
        setEta(Math.max((estimatedTimeSec / 60).toFixed(1), 0.1)); // Define ETA mínimo como 0.1 min
  
        setInitialRegion(prev => ({
          ...prev,
          latitude: newPos.latitude,
          longitude: newPos.longitude,
        }));
        setUserMarker(newPos);
  
        if (dist < stepMeters) {
          clearInterval(intervalRef.current);
          setTripStatus('arrived');
          Alert.alert("Viagem Concluída", "Você chegou ao destino com sucesso!");
          // Reseta os estados após a chegada
          setInitialRegion(backupLocation);
          setUserMarker(backupLocation);
          setSelectedDriver(null);
          setDriverPosition(null);
          setEta(null);
          setSelectedDestination(null);
          setAvailableDrivers([]);
        }
        return newPos;
      });
    }, 1000);
  };


  // Função de cancelamento: disponível apenas na fase "driverEnRoute"
  const handleCancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Reinicia todos os estados da simulação, obrigando o usuário a selecionar um destino novamente
    setTripStatus('idle');
    setSelectedDriver(null);
    setDriverPosition(null);
    setEta(null);
    setSelectedDestination(null);
    setAvailableDrivers([]);
    // Restaura a região e o marcador para a localização real
    setInitialRegion(backupLocation);
    setUserMarker(backupLocation);
    Alert.alert("Operação Cancelada", "A viagem foi cancelada. Selecione um destino novamente.");
  };

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={initialRegion}
          showsUserLocation={false}  // usamos nosso marcador customizado
          showsMyLocationButton={true}
        >
          {/* Marcador do usuário */}
          {userMarker && (
            <Marker
              coordinate={userMarker}
              title="Você"
              pinColor="blue"
            />
          )}
          {/* Marcador para o destino */}
          {selectedDestination && (
            <Marker
              coordinate={{
                latitude: selectedDestination.latitude,
                longitude: selectedDestination.longitude,
              }}
              title={selectedDestination.name}
              description={selectedDestination.address}
            />
          )}
          {/* Marcador para o motorista */}
          {driverPosition && (
            <Marker
              coordinate={driverPosition}
              title={selectedDriver ? selectedDriver.name : "Motorista"}
              pinColor="red"
            />
          )}
        </MapView>
      </View>

      {/* Botão de cancelar disponível somente na fase "driverEnRoute" */}
      {tripStatus === 'driverEnRoute' && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancelar Viagem</Text>
        </TouchableOpacity>
      )}

      {/* Área de busca/destino (enquanto nenhum destino foi selecionado) */}
      {!selectedDestination && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Para onde?"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={handleSearchPlaces}
            />
            {isLoading && (
              <ActivityIndicator size="small" color="#0000ff" style={styles.loader} />
            )}
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.locationItem}
                onPress={() => handleDestinationSelect(item)}
              >
                <View style={styles.locationIconContainer}>
                  <Ionicons name="location-outline" size={24} color="black" />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationName}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.locationCountry}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Após selecionar o destino, exibe os motoristas disponíveis (se nenhum motorista foi selecionado) */}
      {selectedDestination && !selectedDriver && (
        <View style={styles.driversContainer}>
          <Text style={styles.driversTitle}>Motoristas Disponíveis</Text>
          <FlatList
            data={availableDrivers}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.driverCard}
                onPress={() => handleDriverSelect(item)}
              >
                <Text style={styles.driverName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Exibe o ETA enquanto o motorista está a caminho (ou durante a viagem) */}
      {(tripStatus === 'driverEnRoute' || tripStatus === 'toDestination') && (
        <View style={styles.etaContainer}>
          <Text style={styles.etaText}>
            {tripStatus === 'driverEnRoute'
              ? `Motorista a caminho: ${eta} min`
              : `Viajando para o destino: ${eta} min`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  map: { width: Dimensions.get('window').width, height: '100%' },
  mapContainer: { flex: 1.5, position: 'relative' },
  searchContainer: {
    flex: 2,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e9e9e9",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: "#333", fontWeight: "bold" },
  locationItem: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  locationIconContainer: { backgroundColor: "#e9e9e9", padding: 8, borderRadius: 5, marginRight: 8 },
  locationTextContainer: { marginLeft: 8 },
  locationName: { fontSize: 16, fontWeight: "bold" },
  locationCountry: { fontSize: 14, color: "gray" },
  loader: { marginLeft: 10 },
  driversContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  driversTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  driverCard: {
    backgroundColor: "#e9e9e9",
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
  },
  driverName: { fontSize: 14, fontWeight: 'bold' },
  etaContainer: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 8,
  },
  etaText: { fontSize: 14, fontWeight: 'bold' },
  cancelButton: {
    position: 'absolute',
    top: 130,
    right: 20,
    backgroundColor: '#ff4d4d',
    padding: 10,
    borderRadius: 8,
  },
  cancelButtonText: { color: '#fff', fontWeight: 'bold' },
});
