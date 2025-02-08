// Travel/screens/HomeScreen.js

import React, { useState, useEffect } from 'react';
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
import { searchPlaces, getPlaceDetails } from '../services/placesService';

// Array de fallback para resultados locais
const locations = [
  { id: "1", name: "Kilamba", country: "Angola" },
  { id: "2", name: "Zango III", country: "Angola" },
  { id: "3", name: "Talatona", country: "Rua Luther Roscova, Luanda" },
  { id: "4", name: "Benfica", country: "Pôr-do-sol, Luanda" },
  { id: "5", name: "Cacuaco", country: "Rua da volvo, Luanda" },
  { id: "6", name: "Viana", country: "Regedoria, Luanda" },
];

export default function HomeScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialRegion, setInitialRegion] = useState({
    latitude: -8.8389,
    longitude: 13.2894,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      Alert.alert(
        "Permissão Necessária",
        "Precisamos da sua permissão para mostrar sua localização no mapa"
      );
      return;
    }

    try {
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setInitialRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      Alert.alert("Erro", "Não foi possível obter sua localização");
    }
  };

  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleSearchPlaces = async (text) => {
    setSearchQuery(text);
    console.log('Texto de busca:', text);

    // Limpa o timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    setSearchTimeout(
      setTimeout(async () => {
        if (text.length > 2 && location) {
          setIsLoading(true);
          try {
            console.log('Iniciando busca com location:', {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            
            const results = await searchPlaces(text, {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            
            console.log('Resultados obtidos:', results);
            
            if (Array.isArray(results) && results.length > 0) {
              setSearchResults(results);
            } else {
              // Se não houver resultados, mostrar resultados locais
              const filteredLocations = locations.filter(
                loc => 
                  loc.name.toLowerCase().includes(text.toLowerCase()) ||
                  loc.country.toLowerCase().includes(text.toLowerCase())
              );
              setSearchResults(filteredLocations.map(loc => ({
                place_id: loc.id,
                structured_formatting: {
                  main_text: loc.name,
                  secondary_text: loc.country
                }
              })));
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
      }, 500)
    );
  };

  const handleLocationSelect = (prediction) => {
    // Usa as coordenadas que já foram retornadas pela pesquisa
    const selectedPlace = {
      name: prediction.structured_formatting.main_text,
      address: prediction.structured_formatting.secondary_text,
      latitude: prediction.lat,
      longitude: prediction.lon,
    };
  
    setSelectedLocation(selectedPlace);
    
    // Atualiza a região do mapa para centralizar no local selecionado
    setInitialRegion({
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
      latitudeDelta: 0.0122,
      longitudeDelta: 0.0121,
    });
  };


  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <TouchableOpacity style={styles.menuIconContainer}>
          <Ionicons name="menu" size={24} color="blue" />
        </TouchableOpacity>
        
        <MapView
          style={styles.map}
          region={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title={selectedLocation.name}
              description={selectedLocation.address}
            />
          )}
        </MapView>
      </View>

      {/* Seção de busca e sugestões */}
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
              onPress={() => handleLocationSelect(item)}
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

      {/* Seção de navegação inferior (comentada; pode ser ativada quando necessário) */}
      {/*
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="black" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="grid-outline" size={24} color="gray" />
          <Text style={styles.navText}>Serviços</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="list-outline" size={24} color="gray" />
          <Text style={styles.navText}>Atividades</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="gray" />
          <Text style={styles.navText}>Conta</Text>
        </TouchableOpacity>
      </View>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  mapContainer: {
    flex: 1.5,
    position: 'relative',
  },
  menuIconContainer: {
    position: 'absolute',
    top: 70,
    left: 40,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
  },
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationIconContainer: {
    backgroundColor: "#e9e9e9",
    padding: 8,
    borderRadius: 5,
    marginRight: 8,
  },
  locationTextContainer: {
    marginLeft: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  locationCountry: {
    fontSize: 14,
    color: "gray",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 100,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9e9e9",
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    color: "#333",
  },
  loader: {
    marginLeft: 10,
  },
});
