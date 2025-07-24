import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS, COMMON_STYLES } from '../config/theme';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState('');
  const [selectedTaxiType, setSelectedTaxiType] = useState('Coletivo');
  const [mapRef, setMapRef] = useState(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState({
    home: null,
    work: null
  });
  const [filteredResults, setFilteredResults] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      // Focar no mapa quando a localização for obtida
      if (mapRef && location) {
        mapRef.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
        
        // Pré-carregar buscas comuns em segundo plano
        try {
          const { preloadCommonSearches } = require('../services/placesService');
          preloadCommonSearches(location);
        } catch (error) {
          console.log('Erro ao pré-carregar buscas:', error);
          // Não é um erro crítico, então apenas logamos
        }
      }
    })();
  }, [mapRef]);

  // Locais reais e populares de Luanda
  const luandaPlaces = [
    // Shopping Centers
    { id: 1, name: 'Shopping Belas', address: 'Estrada de Catete, Belas', district: 'Belas', type: 'shopping' },
    { id: 2, name: 'Shopping Xyami', address: 'Rua Rainha Ginga', district: 'Maianga', type: 'shopping' },
    { id: 3, name: 'Belas Shopping', address: 'Talatona', district: 'Talatona', type: 'shopping' },
    { id: 4, name: 'Centro Comercial Kero', address: 'Rua Rainha Ginga', district: 'Maianga', type: 'shopping' },

    // Universidades e Escolas
    { id: 5, name: 'Universidade Agostinho Neto', address: 'Avenida Ho Chi Minh', district: 'Maianga', type: 'university' },
    { id: 6, name: 'Universidade Católica de Angola', address: 'Rua Direita da Samba', district: 'Maianga', type: 'university' },
    { id: 7, name: 'UTEL', address: 'Rua Amílcar Cabral', district: 'Ingombota', type: 'school' },
    { id: 8, name: 'Escola Portuguesa de Luanda', address: 'Rua Rei Katyavala', district: 'Ingombota', type: 'school' },
    { id: 9, name: 'Instituto de Telecomunicações', address: 'Rua Ho Chi Minh', district: 'Maianga', type: 'school' },

    // Hospitais e Clínicas
    { id: 10, name: 'Hospital Américo Boavida', address: 'Rua Direita do Cemitério', district: 'Sambizanga', type: 'hospital' },
    { id: 11, name: 'Hospital Josina Machel', address: 'Rua Josina Machel', district: 'Maianga', type: 'hospital' },
    { id: 12, name: 'Clínica Sagrada Esperança', address: 'Rua Amílcar Cabral', district: 'Ingombota', type: 'clinic' },
    { id: 13, name: 'Hospital Militar', address: 'Rua Comandante Che Guevara', district: 'Maianga', type: 'hospital' },

    // Pontos Turísticos
    { id: 14, name: 'Fortaleza de São Miguel', address: 'Rua da Fortaleza, Cidade Alta', district: 'Ingombota', type: 'landmark' },
    { id: 15, name: 'Marginal de Luanda', address: 'Avenida 4 de Fevereiro', district: 'Ingombota', type: 'landmark' },
    { id: 16, name: 'Ilha do Cabo', address: 'Ilha do Cabo', district: 'Ingombota', type: 'beach' },
    { id: 17, name: 'Mussulo', address: 'Ilha do Mussulo', district: 'Luanda', type: 'beach' },

    // Aeroporto e Transporte
    { id: 18, name: 'Aeroporto Internacional 4 de Fevereiro', address: 'Rua do Aeroporto', district: 'Luanda', type: 'airport' },
    { id: 19, name: 'Porto de Luanda', address: 'Avenida 4 de Fevereiro', district: 'Ingombota', type: 'port' },

    // Mercados
    { id: 20, name: 'Mercado do Roque Santeiro', address: 'Estrada de Catete', district: 'Rangel', type: 'market' },
    { id: 21, name: 'Mercado do Kikolo', address: 'Bairro Kikolo', district: 'Sambizanga', type: 'market' },

    // Bancos
    { id: 22, name: 'Banco BAI', address: 'Rua Amílcar Cabral', district: 'Ingombota', type: 'bank' },
    { id: 23, name: 'Banco BIC', address: 'Largo do Kinaxixi', district: 'Ingombota', type: 'bank' },
    { id: 24, name: 'Banco Nacional de Angola', address: 'Avenida 4 de Fevereiro', district: 'Ingombota', type: 'bank' },

    // Hotéis
    { id: 25, name: 'Hotel Presidente', address: 'Largo 17 de Setembro', district: 'Ingombota', type: 'hotel' },
    { id: 26, name: 'Epic Sana Hotel', address: 'Ilha do Cabo', district: 'Ingombota', type: 'hotel' },

    // Distritos Principais
    { id: 27, name: 'Ingombota', address: 'Centro de Luanda', district: 'Ingombota', type: 'district' },
    { id: 28, name: 'Maianga', address: 'Distrito de Maianga', district: 'Maianga', type: 'district' },
    { id: 29, name: 'Rangel', address: 'Distrito do Rangel', district: 'Rangel', type: 'district' },
    { id: 30, name: 'Sambizanga', address: 'Distrito de Sambizanga', district: 'Sambizanga', type: 'district' },

    // Empresas de Telecomunicações
    { id: 31, name: 'Unitel', address: 'Rua Amílcar Cabral', district: 'Ingombota', type: 'company' },
    { id: 32, name: 'Movicel', address: 'Avenida 4 de Fevereiro', district: 'Ingombota', type: 'company' },
    { id: 33, name: 'Angola Telecom', address: 'Largo do Kinaxixi', district: 'Ingombota', type: 'company' }
  ];

  const handleTaxiTypeSelect = (type) => {
    setSelectedTaxiType(type);
    setIsSearchExpanded(true);
    setSearchResults(luandaPlaces);
    setFilteredResults(luandaPlaces);
  };

  const centerOnUserLocation = () => {
    if (location && mapRef) {
      mapRef.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const handleSearchFocus = () => {
    setIsSearchExpanded(true);
    setSearchResults(luandaPlaces);
    setFilteredResults(luandaPlaces);
  };

  const handleLocationSelect = (selectedLocation) => {
    setDestination(selectedLocation.name);
    setIsSearchExpanded(false);
    
    // Atualizar o mapa para mostrar a localização selecionada
    if (mapRef && selectedLocation) {
      // Verificar se temos coordenadas válidas
      const latitude = selectedLocation.lat || 
                      (selectedLocation.geometry && selectedLocation.geometry.location.lat);
      const longitude = selectedLocation.lon || 
                       (selectedLocation.geometry && selectedLocation.geometry.location.lng);
      
      if (latitude && longitude) {
        // Animar o mapa para a localização selecionada
        mapRef.animateToRegion({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
        
        // Adicionar marcador para a localização selecionada
        setSelectedMarker({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          title: selectedLocation.name
        });
        
        console.log('Localização selecionada:', selectedLocation.name, latitude, longitude);
      }
    }
  };

  const [isSearching, setIsSearching] = useState(false);
  const [searchIndicator, setSearchIndicator] = useState('');
  const [searchProgress, setSearchProgress] = useState(0);
  
  const handleSearchChange = async (text) => {
    setDestination(text);

    if (text.length === 0) {
      // Mostrar locais populares quando não há busca
      const popularPlaces = luandaPlaces.slice(0, 20).sort((a, b) => {
        const typeOrder = {
          'shopping': 1, 'landmark': 2, 'university': 3, 'hospital': 4,
          'district': 5, 'neighborhood': 6, 'market': 7, 'hotel': 8
        };
        return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      });
      setFilteredResults(popularPlaces);
      setSearchIndicator('');
      return;
    }

    if (text.length < 2) {
      setFilteredResults([]);
      setSearchIndicator('');
      return;
    }

    const searchTerm = text.toLowerCase().trim();
    
    // Primeiro, mostrar resultados locais imediatamente para feedback rápido
    const filtered = luandaPlaces.filter(place => {
      const name = place.name.toLowerCase();
      const address = place.address.toLowerCase();
      const district = place.district.toLowerCase();
      const type = place.type.toLowerCase();

      // Busca simples e rápida
      return name.includes(searchTerm) ||
             address.includes(searchTerm) ||
             district.includes(searchTerm) ||
             type.includes(searchTerm) ||
             // Categorias específicas
             (searchTerm.includes('hospital') && (type === 'hospital' || type === 'clinic')) ||
             (searchTerm.includes('escola') && (type === 'school' || type === 'university')) ||
             (searchTerm.includes('universidade') && (type === 'university' || type === 'school')) ||
             (searchTerm.includes('shopping') && type === 'shopping') ||
             (searchTerm.includes('banco') && type === 'bank') ||
             (searchTerm.includes('hotel') && type === 'hotel') ||
             (searchTerm.includes('aeroporto') && type === 'airport') ||
             (searchTerm.includes('mercado') && type === 'market');
    });

    // Ordenação simples por relevância
    const sortedResults = filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Nome que começa com o termo de busca tem prioridade
      if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
      if (!aName.startsWith(searchTerm) && bName.startsWith(searchTerm)) return 1;

      return aName.localeCompare(bName);
    });
    
    // Mostrar resultados locais imediatamente
    setFilteredResults(sortedResults);
    
    // Se temos resultados locais suficientes, não precisamos buscar online
    if (sortedResults.length >= 5) {
      setSearchIndicator('Resultados locais');
      return;
    }

    try {
      // Buscar lugares usando o serviço de busca global apenas se o texto for longo o suficiente
      if (text.length >= 3) {
        setIsSearching(true);
        setSearchIndicator('Buscando...');
        setSearchProgress(0);
        
        // Iniciar animação de progresso
        const progressInterval = setInterval(() => {
          setSearchProgress(prev => {
            // Incrementar gradualmente até 90% (reservando 10% para o processamento final)
            const newProgress = prev + (0.1 * (1 - prev/90));
            return Math.min(newProgress, 90);
          });
        }, 100);
        
        // Importar o serviço de busca
        const { searchPlaces } = require('../services/placesService');
        
        // Buscar lugares globalmente
        const onlinePlaces = await searchPlaces(text, location);
        
        // Limpar o intervalo quando a busca terminar
        clearInterval(progressInterval);
        setSearchProgress(100); // Completar o progresso
        
        if (onlinePlaces && onlinePlaces.length > 0) {
          // Converter resultados online para o formato esperado
          const formattedOnlinePlaces = onlinePlaces.map((place, index) => ({
            id: `online_${index}`,
            name: place.structured_formatting.main_text.split(',')[0],
            address: place.structured_formatting.main_text,
            district: place.structured_formatting.secondary_text,
            type: 'location',
            lat: place.lat,
            lon: place.lon,
            country: place.country,
            region: place.region,
            isOnline: true
          }));
          
          // Pequeno atraso para mostrar o progresso completo antes de atualizar os resultados
          setTimeout(() => {
            setFilteredResults(formattedOnlinePlaces);
            setSearchIndicator('');
            setIsSearching(false);
            setSearchProgress(0);
          }, 300);
          return;
        }
      }
      
      // Se chegamos aqui, não encontramos resultados online ou não fizemos a busca
      setSearchProgress(0);
      setSearchIndicator(sortedResults.length > 0 ? 'Resultados locais' : '');
      setIsSearching(false);
    } catch (error) {
      console.error('Erro na busca:', error);
      // Já mostramos os resultados locais, então apenas atualizamos o indicador
      setSearchProgress(0);
      setSearchIndicator('Resultados locais');
      setIsSearching(false);
      
      // Mostrar um feedback visual do erro por um breve momento
      Alert.alert(
        "Erro na busca",
        "Não foi possível completar a busca online. Mostrando resultados locais.",
        [{ text: "OK" }],
        { cancelable: true }
      );
    }
  };

  const handleSaveAddress = (type) => {
    // Simular salvamento de endereço
    const newAddress = {
      name: type === 'home' ? 'Casa' : 'Trabalho',
      address: 'Toque para adicionar endereço',
      isNew: true
    };

    setSavedAddresses(prev => ({
      ...prev,
      [type]: newAddress
    }));
  };

  const getIconForType = (type) => {
    const icons = {
      district: 'location-city',
      neighborhood: 'home',
      residential: 'apartment',
      shopping: 'shopping-cart',
      store: 'store',
      airport: 'flight',
      landmark: 'place',
      university: 'school',
      school: 'school',
      historic: 'account-balance',
      hospital: 'local-hospital',
      clinic: 'medical-services',
      market: 'store',
      beach: 'beach-access',
      port: 'directions-boat',
      stadium: 'sports-soccer',
      hotel: 'hotel',
      restaurant: 'restaurant',
      government: 'account-balance',
      bank: 'account-balance',
      church: 'church',
      gas_station: 'local-gas-station',
      company: 'business',
      city: 'location-city'
    };
    return icons[type] || 'place';
  };



  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Map */}
      <MapView
        ref={setMapRef}
        style={styles.map}
        initialRegion={{
          latitude: location ? location.coords.latitude : -8.8390,
          longitude: location ? location.coords.longitude : 13.2894,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={true}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Sua localização"
            pinColor="blue"
          />
        )}
        
        {selectedMarker && (
          <Marker
            coordinate={{
              latitude: selectedMarker.latitude,
              longitude: selectedMarker.longitude,
            }}
            title={selectedMarker.title}
            pinColor="red"
          />
        )}
      </MapView>

      {/* Menu Button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsDrawerOpen(true)}
      >
        <MaterialIcons name="menu" size={24} color="#000" />
      </TouchableOpacity>

      {/* My Location Button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={centerOnUserLocation}
      >
        <MaterialIcons name="my-location" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Search and Taxi Controls */}
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
            editable={!isSearchExpanded}
          />
        </TouchableOpacity>



        {/* Taxi Type Buttons */}
        <View style={styles.taxiButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.taxiButton,
              selectedTaxiType === 'Coletivo' && styles.taxiButtonSelected
            ]}
            onPress={() => handleTaxiTypeSelect('Coletivo')}
          >
            <Text style={[
              styles.taxiButtonText,
              selectedTaxiType === 'Coletivo' && styles.taxiButtonTextSelected
            ]}>
              Coletivo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.taxiButton,
              selectedTaxiType === 'Privado' && styles.taxiButtonSelected
            ]}
            onPress={() => handleTaxiTypeSelect('Privado')}
          >
            <Text style={[
              styles.taxiButtonText,
              selectedTaxiType === 'Privado' && styles.taxiButtonTextSelected
            ]}>
              Privado
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
              />
              {destination.length > 0 && (
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
                  name: "Localização atual",
                  address: "Minha localização",
                  lat: location.coords.latitude,
                  lon: location.coords.longitude
                });
              }
            }}
          >
            <View style={styles.currentLocationIcon}>
              <MaterialIcons name="my-location" size={20} color="#2563EB" />
            </View>
            <View style={styles.currentLocationInfo}>
              <Text style={styles.currentLocationText}>Usar localização atual</Text>
              <Text style={styles.currentLocationSubtext}>Sua posição no mapa</Text>
            </View>
          </TouchableOpacity>

          {/* Saved Places */}
          {(savedAddresses.home || savedAddresses.work) && (
            <View style={styles.savedPlacesSection}>
              <Text style={styles.sectionTitle}>Locais salvos</Text>
              {savedAddresses.home && (
                <TouchableOpacity
                  style={styles.savedPlaceItem}
                  onPress={() => handleLocationSelect(savedAddresses.home)}
                >
                  <View style={styles.savedPlaceIcon}>
                    <MaterialIcons name="home" size={20} color="#10B981" />
                  </View>
                  <View style={styles.savedPlaceInfo}>
                    <Text style={styles.savedPlaceName}>Casa</Text>
                    <Text style={styles.savedPlaceAddress}>{savedAddresses.home.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
              {savedAddresses.work && (
                <TouchableOpacity
                  style={styles.savedPlaceItem}
                  onPress={() => handleLocationSelect(savedAddresses.work)}
                >
                  <View style={styles.savedPlaceIcon}>
                    <MaterialIcons name="work" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.savedPlaceInfo}>
                    <Text style={styles.savedPlaceName}>Trabalho</Text>
                    <Text style={styles.savedPlaceAddress}>{savedAddresses.work.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Search Results */}
          <View style={styles.searchResultsSection}>
            {destination.length > 0 ? (
              <View style={styles.searchResultsHeader}>
                <Text style={styles.sectionTitle}>
                  {filteredResults.length > 0 && filteredResults[0].isOnline 
                    ? `Resultados globais (${filteredResults.length})` 
                    : `Resultados da busca (${filteredResults.length})`}
                </Text>
                {isSearching ? (
                  <View style={styles.searchingContainer}>
                    <View style={styles.searchingBadge}>
                      <Text style={styles.searchingText}>Buscando...</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[styles.progressBar, {width: `${searchProgress}%`}]} 
                      />
                    </View>
                  </View>
                ) : filteredResults.length > 0 && (
                  <View style={[styles.globalSearchBadge, 
                    {backgroundColor: filteredResults[0].isOnline ? '#EFF6FF' : '#F0FDF4'}]}>
                    <MaterialIcons 
                      name={filteredResults[0].isOnline ? "public" : "place"} 
                      size={16} 
                      color={filteredResults[0].isOnline ? "#2563EB" : "#10B981"} 
                    />
                    <Text 
                      style={[styles.globalSearchText, 
                        {color: filteredResults[0].isOnline ? "#2563EB" : "#10B981"}]}
                    >
                      {filteredResults[0].isOnline ? "Busca global" : "Resultados locais"}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.sectionTitle}>Locais populares</Text>
            )}

            {filteredResults.length > 0 ? (
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
                      <MaterialIcons name={getIconForType(result.type)} size={18} color="#6B7280" />
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{result.name}</Text>
                      <Text style={styles.resultAddress}>
                        {result.isOnline 
                          ? `${result.address}${result.region ? `, ${result.region}` : ''}${result.country ? `, ${result.country}` : ''}` 
                          : `${result.address}, ${result.district}`
                        }
                      </Text>
                    </View>
                    <MaterialIcons name="arrow-forward-ios" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : destination.length > 0 ? (
              <View style={styles.noResultsContainer}>
                <MaterialIcons name="search-off" size={32} color="#D1D5DB" />
                <Text style={styles.noResultsText}>Nenhum resultado encontrado</Text>
                <Text style={styles.noResultsSubtext}>Tente buscar por outro local</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* Side Drawer Menu */}
      {isDrawerOpen && (
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setIsDrawerOpen(false)}
        >
          <TouchableOpacity
            style={styles.drawerContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                <View style={styles.profileImage}>
                  <MaterialIcons name="person" size={40} color="#2563EB" />
                </View>
              </View>
              <Text style={styles.profileName}>Avelino Carilo</Text>
              <Text style={styles.profileEmail}>avelinocarilo@gmail.com</Text>

              <TouchableOpacity style={styles.editProfileButton}>
                <MaterialIcons name="edit" size={16} color="#6B7280" />
                <Text style={styles.editProfileText}>Editar perfil</Text>
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="payment" size={20} color="#6B7280" />
                <Text style={styles.menuItemText}>Pagamento</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="history" size={20} color="#6B7280" />
                <Text style={styles.menuItemText}>Histórico</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="location-on" size={20} color="#6B7280" />
                <Text style={styles.menuItemText}>Definições</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="help" size={20} color="#6B7280" />
                <Text style={styles.menuItemText}>Ajuda</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="logout" size={20} color="#6B7280" />
                <Text style={styles.menuItemText}>Encerrar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  map: {
    flex: 1,
  },
  menuButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 70, // Space for tab bar (70px height)
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Mais opaco
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2563EB', // Borda azul
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
    borderColor: '#2563EB', // Borda azul
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
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
  taxiButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  taxiButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563EB', // Borda azul para todos os botões
  },
  taxiButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  taxiButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  taxiButtonTextSelected: {
    color: '#ffffff',
  },
  // Full Screen Search Overlay
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
    fontWeight: '400',
  },
  currentLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#EBF4FF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  savedPlacesSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  savedPlaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  savedPlaceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  savedPlaceInfo: {
    flex: 1,
  },
  savedPlaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  savedPlaceAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchResultsSection: {
    flex: 1,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  globalSearchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  searchingContainer: {
    alignItems: 'center',
  },
  searchingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  searchingText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  progressBarContainer: {
    width: 100,
    height: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#D97706',
    borderRadius: 2,
  },
  globalSearchText: {
    fontSize: 12,
    color: '#2563EB',
    marginLeft: 4,
    fontWeight: '500',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
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
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Side Drawer Styles
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  drawerContent: {
    width: '75%',
    backgroundColor: '#ffffff',
    height: '100%',
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editProfileText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
    fontWeight: '400',
  },
});