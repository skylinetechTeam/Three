import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Platform,
  Modal,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS, RESPONSIVE } from '../config/theme';
import { checkForExistingData } from '../utils/dataCleaner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';

const { width, height } = Dimensions.get('window');

// HERE Maps API Configuration
const HERE_API_KEY = 'bMtOJnfPZwG3fyrgS24Jif6dt3MXbOoq6H4X4KqxZKY';

const FavoritosScreen = () => {
  const navigation = useNavigation();
  const [favoritos, setFavoritos] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newFavorito, setNewFavorito] = useState({
    nome: '',
    endereco: '',
    tipo: 'casa',
    frequencia: 'Ocasional',
    latitude: null,
    longitude: null
  });
  const [location, setLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const searchTimeoutRef = useRef(null);
  
  // Novos estados para melhorias do formulário
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const slideAnim = useRef(new Animated.Value(height * 0.85)).current;

  // Carregar dados existentes ao montar o componente
  useEffect(() => {
    loadExistingFavorites();
    loadUserLocation();
    
    // Listeners do teclado
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Animações do bottom sheet
  useEffect(() => {
    if (showAddModal) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height * 0.85,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showAddModal]);

  const loadUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const loadExistingFavorites = async () => {
    try {
      const existingData = await checkForExistingData();
      if (existingData.hasFavorites) {
        setFavoritos(existingData.favoritesData);
        console.log('Favoritos carregados:', existingData.favoritesData);
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  };

  // HERE Places API search function
  const searchPlacesWithHERE = async (query) => {
    if (!query || query.length < 2) return [];
    
    setIsSearching(true);
    
    try {
      const userLat = location?.coords.latitude || -8.8390;
      const userLng = location?.coords.longitude || 13.2894;
      
      // HERE Geocoding and Search API
      const searchUrl = `https://discover.search.hereapi.com/v1/discover?apikey=${HERE_API_KEY}&q=${encodeURIComponent(query)}&at=${userLat},${userLng}&limit=20&lang=pt-PT`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.items) {
        const formattedPlaces = data.items.map((item, index) => ({
          id: `here_${index}`,
          name: item.title,
          address: item.address?.label || item.vicinity || '',
          district: item.address?.district || item.address?.city || 'Luanda',
          type: item.categories?.[0]?.id || 'location',
          lat: item.position?.lat,
          lng: item.position?.lng,
          distance: item.distance,
          isHere: true,
          categories: item.categories,
          contacts: item.contacts
        }));
        
        setSearchResults(formattedPlaces);
      }
    } catch (error) {
      console.error('HERE Places search error:', error);
      Alert.alert('Erro', 'Não foi possível buscar locais. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressSearch = async (text) => {
    setNewFavorito(prev => ({ ...prev, endereco: text }));
    
    // Validar campo em tempo real
    if (text.length >= 5) {
      validateField('endereco', text);
    }
    
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(async () => {
      await searchPlacesWithHERE(text);
    }, 500);
  };

  const handleLocationSelect = (selectedLocation) => {
    setNewFavorito(prev => ({
      ...prev,
      endereco: selectedLocation.address,
      nome: selectedLocation.name,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng
    }));
    setSearchResults([]);
    setShowAddressSearch(false);
    // Limpar erros dos campos quando preenchidos
    setFormErrors(prev => ({
      ...prev,
      endereco: null,
      nome: null
    }));
  };

  // Função de validação de campos
  const validateField = (fieldName, value) => {
    let error = null;
    
    switch (fieldName) {
      case 'nome':
        if (!value || value.trim().length < 2) {
          error = 'Nome deve ter pelo menos 2 caracteres';
        }
        break;
      case 'endereco':
        if (!value || value.trim().length < 5) {
          error = 'Endereço deve ter pelo menos 5 caracteres';
        }
        break;
    }
    
    setFormErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
    
    return error === null;
  };

  // Validar todos os campos do step atual
  const validateCurrentStep = () => {
    let isValid = true;
    
    if (currentStep === 1) {
      isValid = validateField('nome', newFavorito.nome) && isValid;
      isValid = validateField('endereco', newFavorito.endereco) && isValid;
    }
    
    return isValid;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) {
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const resetForm = () => {
    setNewFavorito({
      nome: '',
      endereco: '',
      tipo: 'casa',
      frequencia: 'Ocasional',
      latitude: null,
      longitude: null
    });
    setCurrentStep(1);
    setSearchResults([]);
    setFormErrors({});
    setIsSubmitting(false);
    setIsEditing(false);
    setShowAddModal(false);
  };

  // Função para limpar todos os dados de favoritos
  const clearAllFavorites = async () => {
    Alert.alert(
      "🗑️ Limpar Todos os Favoritos",
      "Tem certeza que deseja remover todos os favoritos? Esta ação não pode ser desfeita.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Limpar Todos", 
          onPress: async () => {
            try {
              console.log('Iniciando limpeza de favoritos...');
              
              // Verificar se existem favoritos antes de limpar
              const existingData = await AsyncStorage.getItem('favorite_destinations');
              if (!existingData) {
                Alert.alert("Aviso", "Não há favoritos para limpar.");
                return;
              }
              
              // Limpar do AsyncStorage
              await AsyncStorage.removeItem('favorite_destinations');
              
              // Atualizar o estado local
              setFavoritos([]);
              
              console.log('Favoritos limpos com sucesso');
              Alert.alert("✅ Sucesso", "Todos os favoritos foram removidos com sucesso!");
              
            } catch (error) {
              console.error('Erro ao limpar favoritos:', error);
              Alert.alert(
                "❌ Erro", 
                "Não foi possível limpar os favoritos. Tente novamente.",
                [{ text: "OK" }]
              );
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleAddFavorito = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      let updatedFavoritos;
      
      if (isEditing && newFavorito.id) {
        // Atualizar favorito existente
        updatedFavoritos = favoritos.map(item =>
          item.id === newFavorito.id ? newFavorito : item
        );
      } else {
        // Adicionar novo favorito
        const novoFavorito = {
          id: Date.now().toString(),
          ...newFavorito,
          createdAt: new Date().toISOString()
        };
        updatedFavoritos = [...favoritos, novoFavorito];
      }

      setFavoritos(updatedFavoritos);
      
      // Salvar no AsyncStorage
      await saveFavoritesToStorage(updatedFavoritos);
      
      // Mostrar feedback de sucesso
      Alert.alert('Sucesso', 
        isEditing ? 'Favorito atualizado com sucesso!' : 'Favorito adicionado com sucesso!', 
        [{ text: 'OK', onPress: resetForm }]
      );
      
    } catch (error) {
      console.error('Erro ao salvar favorito:', error);
      Alert.alert('Erro', 'Não foi possível salvar o favorito. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveFavoritesToStorage = async (favoritosList) => {
    try {
      await AsyncStorage.setItem('favorite_destinations', JSON.stringify(favoritosList));
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
    }
  };

  const handleRemoveFavorito = (id) => {
    Alert.alert(
      "Remover Favorito",
      "Tem certeza que deseja remover este local dos favoritos?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Remover", 
          onPress: async () => {
            const updatedFavoritos = favoritos.filter(item => item.id !== id);
            setFavoritos(updatedFavoritos);
            await saveFavoritesToStorage(updatedFavoritos);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleEditFavorito = (favorito) => {
    setNewFavorito(favorito);
    setCurrentStep(1);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleGoToFavorite = (favorito) => {
    try {
      console.log('🚗 Iniciando solicitação de corrida para favorito:', favorito.nome);
      
      // Navigate to HomeScreen with the favorite location as destination
      // and trigger automatic search flow
      navigation.navigate('Home', {
        selectedDestination: {
          name: favorito.nome,
          address: favorito.endereco,
          lat: favorito.latitude || favorito.lat,
          lng: favorito.longitude || favorito.lng,
          categories: favorito.categories || []
        },
        autoStartFlow: true, // Flag para iniciar automaticamente o fluxo
        fromFavorites: true  // Flag para identificar origem
      });
      
      // Feedback visual opcional (se Toast estiver disponível)
      if (typeof Toast !== 'undefined') {
        Toast.show({
          type: 'info',
          text1: '🚗 Preparando corrida',
          text2: `Destino: ${favorito.nome}`,
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('Erro ao navegar para favorito:', error);
      Alert.alert('Erro', 'Não foi possível iniciar a corrida. Tente novamente.');
    }
  };

  const filteredFavoritos = favoritos.filter(item =>
    item.nome.toLowerCase().includes(searchText.toLowerCase()) ||
    item.endereco.toLowerCase().includes(searchText.toLowerCase())
  );

  const getIconForCategory = (categories) => {
    if (!categories || categories.length === 0) return 'location-on';
    
    const category = categories[0].id;
    if (category.includes('restaurant') || category.includes('food')) return 'restaurant';
    if (category.includes('hotel') || category.includes('accommodation')) return 'hotel';
    if (category.includes('shopping') || category.includes('store')) return 'shopping-cart';
    if (category.includes('hospital') || category.includes('health')) return 'local-hospital';
    if (category.includes('school') || category.includes('education')) return 'school';
    if (category.includes('bank') || category.includes('finance')) return 'account-balance';
    return 'location-on';
  };

  const renderFavoritoItem = ({ item }) => (
    <View style={styles.favoritoCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <MaterialIcons 
              name={getIconForCategory(item.categories)} 
              size={20} 
              color="#ffffff" 
            />
          </View>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.favoritoNome}>{item.nome}</Text>
          <Text style={styles.favoritoEndereco}>{item.endereco}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditFavorito(item)}
          >
            <Ionicons name="pencil" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleRemoveFavorito(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.tagsContainer}>
          <View style={styles.typeTag}>
            <Ionicons name="location-outline" size={12} color={COLORS.primary[500]} />
            <Text style={styles.tagText}>{item.tipo}</Text>
          </View>
          <View style={styles.frequencyTag}>
            <Ionicons name="time-outline" size={12} color="#6B7280" />
            <Text style={styles.tagText}>{item.frequencia}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Button
          variant="primary"
          size="md"
          onPress={() => handleGoToFavorite(item)}
          iconLeft={
            <MaterialIcons name="navigation" size={18} color="#ffffff" />
          }
          accessibilityLabel={`Solicitar corrida para ${item.nome}`}
          accessibilityHint="Toque para iniciar uma corrida para este destino"
          style={styles.requestRideButton}
        >
          Solicitar Corrida
        </Button>
      </View>
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, currentStep >= 1 && styles.stepCircleActive]}>
          <Text style={[styles.stepNumber, currentStep >= 1 && styles.stepNumberActive]}>1</Text>
        </View>
        <Text style={[styles.stepLabel, currentStep >= 1 && styles.stepLabelActive]}>Informações</Text>
      </View>
      
      <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, currentStep >= 2 && styles.stepCircleActive]}>
          <Text style={[styles.stepNumber, currentStep >= 2 && styles.stepNumberActive]}>2</Text>
        </View>
        <Text style={[styles.stepLabel, currentStep >= 2 && styles.stepLabelActive]}>Categorias</Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {/* Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome do Local</Text>
              <View style={[
                styles.inputContainer,
                formErrors.nome && styles.inputError
              ]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Casa, Trabalho, Shopping"
                  value={newFavorito.nome}
                  onChangeText={(text) => {
                    setNewFavorito(prev => ({ ...prev, nome: text }));
                    if (text.length >= 2) {
                      validateField('nome', text);
                    }
                  }}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              {formErrors.nome && (
                <Animated.View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.notification} />
                  <Text style={styles.errorText}>{formErrors.nome}</Text>
                </Animated.View>
              )}
            </View>

            {/* Endereço com autocomplete */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Endereço</Text>
              <View style={[
                styles.addressInputContainer,
                formErrors.endereco && styles.inputError
              ]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Digite o endereço"
                  value={newFavorito.endereco}
                  onChangeText={handleAddressSearch}
                  onFocus={() => setShowAddressSearch(true)}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() => {
                    if (location) {
                      setNewFavorito(prev => ({ 
                        ...prev, 
                        endereco: 'Minha Localização',
                        nome: 'Minha Localização',
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude
                      }));
                      validateField('endereco', 'Minha Localização');
                      validateField('nome', 'Minha Localização');
                    }
                  }}
                >
                  <Ionicons name="location" size={20} color={COLORS.primary[500]} />
                </TouchableOpacity>
              </View>
              {formErrors.endereco && (
                <Animated.View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.notification} />
                  <Text style={styles.errorText}>{formErrors.endereco}</Text>
                </Animated.View>
              )}

              {/* Opção rápida para minha localização */}
              <TouchableOpacity
                style={styles.quickLocationButton}
                onPress={() => {
                  if (location) {
                    setNewFavorito(prev => ({ 
                      ...prev, 
                      endereco: 'Minha Localização',
                      nome: 'Minha Localização',
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude
                    }));
                  }
                }}
              >
                <Ionicons name="navigate" size={16} color={COLORS.primary} />
                <Text style={styles.quickLocationText}>Usar Minha Localização</Text>
              </TouchableOpacity>

              {/* Resultados da busca de endereços */}
              {showAddressSearch && searchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  <ScrollView style={styles.searchResultsList}>
                    {searchResults.map((result, index) => (
                      <TouchableOpacity
                        key={result.id || `result_${index}`}
                        style={styles.searchResultItem}
                        onPress={() => handleLocationSelect(result)}
                      >
                        <View style={styles.searchResultIcon}>
                          <MaterialIcons 
                            name={getIconForCategory(result.categories)} 
                            size={18} 
                            color="#6B7280" 
                          />
                        </View>
                        <View style={styles.searchResultInfo}>
                          <Text style={styles.searchResultName}>{result.name}</Text>
                          <Text style={styles.searchResultAddress}>
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
                </View>
              )}

              {isSearching && (
                <View style={styles.searchingIndicator}>
                  <MaterialIcons name="search" size={20} color={COLORS.primary} />
                  <Text style={styles.searchingText}>Buscando com HERE Maps...</Text>
                </View>
              )}
            </View>
          </>
        );
      
      case 2:
        return (
          <>
            {/* Tipo de local */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo de Local</Text>
              <View style={styles.optionsContainer}>
                {['casa', 'trabalho', 'shopping', 'restaurante', 'outro'].map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.optionButton,
                      newFavorito.tipo === tipo && styles.optionButtonActive
                    ]}
                    onPress={() => setNewFavorito(prev => ({ ...prev, tipo }))}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      newFavorito.tipo === tipo && styles.optionButtonTextActive
                    ]}>
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Frequência de uso */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Frequência de Uso</Text>
              <View style={styles.optionsContainer}>
                {['Diário', 'Semanal', 'Mensal', 'Ocasional'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.optionButton,
                      newFavorito.frequencia === freq && styles.optionButtonActive
                    ]}
                    onPress={() => setNewFavorito(prev => ({ ...prev, frequencia: freq }))}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      newFavorito.frequencia === freq && styles.optionButtonTextActive
                    ]}>
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        );
      
      default:
        return null;
    }
  };

  const renderStepButtons = () => {
    if (currentStep === 1) {
      return (
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={resetForm}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextStep}
          >
            <Text style={styles.nextButtonText}>Próximo</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (currentStep === 2) {
      return (
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={prevStep}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleAddFavorito}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingSpinner} />
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Atualizando...' : 'Adicionando...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Atualizar' : 'Adicionar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favoritos</Text>
        {favoritos.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllFavorites}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={styles.clearButtonText}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar favoritos"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Favoritos List */}
      <View style={styles.content}>
        {filteredFavoritos.length > 0 ? (
          <FlatList
            data={filteredFavoritos}
            renderItem={renderFavoritoItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.favoritosList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>
              {searchText ? "Nenhum favorito encontrado" : "Nenhum favorito ainda"}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchText 
                ? "Tente buscar por outro termo" 
                : "Adicione seus locais favoritos para acesso rápido"}
            </Text>
          </View>
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setShowAddModal(true);
          setCurrentStep(1);
        }}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Bottom Sheet Modal para adicionar/editar favorito */}
      <Modal
        visible={showAddModal}
        animationType="none"
        transparent={true}
        onRequestClose={resetForm}
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.backdrop}
            activeOpacity={1}
            onPress={resetForm}
          />
          
          <Animated.View style={[
            styles.bottomSheet,
            { 
              transform: [{ translateY: slideAnim }],
            }
          ]}>
            {/* Handle */}
            <View style={styles.handle} />
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerIconContainer}>
                <Ionicons 
                  name={isEditing ? "pencil" : "heart"} 
                  size={24} 
                  color="#ffffff" 
                />
              </View>
              <View style={styles.headerContent}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Editar Favorito' : 'Adicionar aos Favoritos'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {currentStep === 1 ? 'Informações básicas' : 'Configurações'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={resetForm}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[
                  styles.progressFill,
                  { width: `${(currentStep / 2) * 100}%` }
                ]} />
              </View>
              <Text style={styles.progressText}>
                Etapa {currentStep} de 2
              </Text>
            </View>

            {/* Content */}
            <View style={styles.modalContent}>
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {renderStepContent()}
              </ScrollView>
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              {renderStepButtons()}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.surface.background,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearButtonText: {
    color: COLORS.notification,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.surface.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  favoritosList: {
    paddingBottom: Platform.OS === 'android' ? 100 : 80, // Margem extra para botões de navegação
  },
  favoritoCard: {
    backgroundColor: COLORS.surface.card,
    borderRadius: 12,
    marginBottom: 12,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
  favoritoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.input.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  favoritoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  favoritoEndereco: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  favoritoFrequencia: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.light,
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 30 : 20, // Margem extra para botões de navegação
    left: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...SHADOWS.medium,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  // Modal styles modernos
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.9,
    minHeight: height * 0.7,
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
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: COLORS.primary,
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
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    backgroundColor: COLORS.input.background,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeButtonSelected: {
    backgroundColor: COLORS.primary[500],
    borderColor: COLORS.primary[500],
  },
  typeButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  typeButtonTextSelected: {
    color: COLORS.text.inverse,
  },
  frequencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  frequencyButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  frequencyButtonSelected: {
    backgroundColor: COLORS.primary[500],
    borderColor: COLORS.primary[500],
  },
  frequencyButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  frequencyButtonTextSelected: {
    color: COLORS.text.inverse,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  cancelButton: {
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
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  // New styles for HERE Maps autocomplete
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input.background,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationButton: {
    padding: 8,
    marginLeft: 10,
  },
  searchResultsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginTop: 10,
    maxHeight: 150, // Limit height for scrollable results
    width: '100%',
    ...SHADOWS.small,
  },
  searchResultsList: {
    //
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  searchResultAddress: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  searchingText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
  hereMapsBadge: {
    backgroundColor: '#4f46e5', // HERE Maps blue
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 10,
  },
  hereMapsBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // New styles for options in modal
  inputGroup: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: COLORS.input.background,
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    margin: 5,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  optionButtonTextActive: {
    color: COLORS.white,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  closeButton: {
    padding: 5,
  },
  favoritoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerInfo: {
    flex: 1,
  },
  favoritoNome: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  favoritoEndereco: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  frequencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  cardFooter: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  requestRideButton: {
    width: '100%',
    minHeight: RESPONSIVE.getDynamicSize({ small: 48, standard: 52, large: 56, tablet: 60 }),
    marginVertical: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.text.light,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 100 : 90, // Higher position to avoid tab bar
    right: 20,
    backgroundColor: COLORS.primary[500],
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 8,
    ...SHADOWS.medium,
  },
  quickLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2F7',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  quickLocationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  stepLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  nextButton: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.inverse,
    textAlign: 'center',
  },
  backButton: {
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
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  cancelButton: {
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
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  // Novos estilos para melhorias
  inputContainer: {
    backgroundColor: COLORS.input.background,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.notification,
    borderWidth: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 5,
  },
  errorText: {
    color: COLORS.notification,
    fontSize: 12,
    marginLeft: 5,
    flex: 1,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderTopColor: 'transparent',
    marginRight: 8,
  },
});

export default FavoritosScreen;