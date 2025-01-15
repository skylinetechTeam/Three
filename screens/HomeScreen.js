import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Para ícones
import MapView from "react-native-maps";

const locations = [
  { id: "1", name: "Kilamba", country: "Angola" },
  { id: "2", name: "Zango III", country: "Angola" },
  { id: "3", name: "Talatona", country: "Rua Luther Roscova, Luanda" },
  { id: "4", name: "Benfica", country: "Pôr-do-sol, Luanda" },
  { id: "5", name: "Cacuaco", country: "Rua da volvo, Luanda" },
  { id: "6", name: "Viana", country: "Regedoria, Luanda" },
];

export default function HomeScreen() {
  // Initial region for Angola (Luanda)
  const initialRegion = {
    latitude: -8.8389,
    longitude: 13.2894,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };
  
  return (
    <View style={styles.container}>
      {/* Mapa com menu suspenso */}
      <View style={styles.mapContainer}>
        <TouchableOpacity style={styles.menuIconContainer}>
          <Ionicons name="menu" size={24} color="blue" />
        </TouchableOpacity>
        
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        />
      </View>

      {/* Input de busca e opções */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Para onde?"
            placeholderTextColor="#888"
          />
        </View>

        {/* Opções de viagem */}
        <TouchableOpacity style={styles.travelOption}>
          <Ionicons name="car" size={24} color="black" />
          <View style={styles.travelTextContainer}>
            <Text style={styles.travelTitle}>Viagens</Text>
            <Text style={styles.travelSubtitle}>Pedir viagem</Text>
          </View>
        </TouchableOpacity>

        {/* Lista de locais */}
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.locationItem}>
              <View style={styles.locationIconContainer}>
                <Ionicons name="location-outline" size={24} color="black" />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationName}>{item.name}</Text>
                <Text style={styles.locationCountry}>{item.country}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Navegação inferior */}
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
  mapImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
  travelOption: {
    backgroundColor: "#e9e9e9",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  travelTextContainer: {
    marginLeft: 8,
  },
  travelTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  travelSubtitle: {
    fontSize: 14,
    color: "#888",
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
});
