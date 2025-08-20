import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';
import { checkForExistingData, clearDataByKey, DATA_KEYS } from '../utils/dataCleaner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

// HERE Maps API Configuration
const HERE_API_KEY = 'bMtOJnfPZwG3fyrgS24Jif6dt3MXbOoq6H4X4KqxZKY';

const ReservasScreen = () => {
  const [reservas, setReservas] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [novaReserva, setNovaReserva] = useState({
    origem: '',
    destino: '',
    data: '',
    hora: '',
    tipoTaxi: 'Coletivo',
    observacoes: ''
  });
  const [location, setLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [searchField, setSearchField] = useState(''); // 'origem' ou 'destino'
  const searchTimeoutRef = useRef(null);
  
  // Novos estados para melhorias do formulário
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const slideAnim = useRef(new Animated.Value(height * 0.85)).current;

  // Carregar dados existentes ao montar o componente
  useEffect(() => {
    loadExistingReservas();
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

  const loadExistingReservas = async () => {
    try {
      const existingData = await checkForExistingData();
      if (existingData.hasReservas) {
        setReservas(existingData.reservasData);
        console.log('Reservas carregadas:', existingData.reservasData);
      }
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
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

  const handleAddressSearch = async (text, field) => {
    setNovaReserva(prev => ({ ...prev, [field]: text }));
    setSearchField(field);
    
    // Validar campo em tempo real
    if (text.length >= 3) {
      validateField(field, text);
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
    setNovaReserva(prev => ({
      ...prev,
      [searchField]: selectedLocation.address
    }));
    setSearchResults([]);
    setShowAddressSearch(false);
    // Limpar erro do campo quando preenchido
    if (formErrors[searchField]) {
      setFormErrors(prev => ({
        ...prev,
        [searchField]: null
      }));
    }
  };

  // Função de validação de campos
  const validateField = (fieldName, value) => {
    let error = null;
    
    switch (fieldName) {
      case 'origem':
      case 'destino':
        if (!value || value.trim().length < 3) {
          error = 'Deve ter pelo menos 3 caracteres';
        }
        break;
      case 'data':
        if (!value) {
          error = 'Data é obrigatória';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate < today) {
            error = 'Data não pode ser no passado';
          }
        }
        break;
      case 'hora':
        if (!value) {
          error = 'Hora é obrigatória';
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
      isValid = validateField('origem', novaReserva.origem) && isValid;
      isValid = validateField('destino', novaReserva.destino) && isValid;
    } else if (currentStep === 2) {
      isValid = validateField('data', novaReserva.data) && isValid;
      isValid = validateField('hora', novaReserva.hora) && isValid;
    }
    
    return isValid;
  };

  // Manipular mudança de data
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toLocaleDateString('pt-BR');
      setNovaReserva(prev => ({ ...prev, data: formattedDate }));
      validateField('data', formattedDate);
    }
  };

  // Manipular mudança de hora
  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setSelectedTime(selectedTime);
      const formattedTime = selectedTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setNovaReserva(prev => ({ ...prev, hora: formattedTime }));
      validateField('hora', formattedTime);
    }
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
    setNovaReserva({
      origem: '',
      destino: '',
      data: '',
      hora: '',
      tipoTaxi: 'Coletivo',
      observacoes: ''
    });
    setCurrentStep(1);
    setSearchResults([]);
    setFormErrors({});
    setIsSubmitting(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowAddModal(false);
  };

  // Função para limpar todos os dados de reservas
  const clearAllReservas = async () => {
    Alert.alert(
      "Limpar Todas as Reservas",
      "Tem certeza que deseja remover todas as reservas? Esta ação não pode ser desfeita.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Limpar Todas", 
          onPress: async () => {
            try {
              const success = await clearDataByKey(DATA_KEYS.RESERVAS);
              if (success) {
                setReservas([]);
                Alert.alert("Sucesso", "Todas as reservas foram removidas!");
              } else {
                Alert.alert("Erro", "Não foi possível limpar as reservas.");
              }
            } catch (error) {
              Alert.alert("Erro", "Não foi possível limpar as reservas.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleAddReserva = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const novaReservaCompleta = {
        id: Date.now().toString(),
        ...novaReserva,
        status: 'Pendente',
        createdAt: new Date().toISOString(),
        preco: novaReserva.tipoTaxi === 'Coletivo' ? 500 : 800
      };

      const updatedReservas = [...reservas, novaReservaCompleta];
      setReservas(updatedReservas);
      
      // Salvar no AsyncStorage
      await saveReservasToStorage(updatedReservas);
      
      // Mostrar feedback de sucesso
      Alert.alert('Sucesso', 'Reserva criada com sucesso!', [
        { text: 'OK', onPress: resetForm }
      ]);
      
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      Alert.alert('Erro', 'Não foi possível criar a reserva. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveReservasToStorage = async (reservasList) => {
    try {
      await AsyncStorage.setItem('ride_requests', JSON.stringify(reservasList));
    } catch (error) {
      console.error('Erro ao salvar reservas:', error);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    const updatedReservas = reservas.map(reserva =>
      reserva.id === id ? { ...reserva, status: newStatus } : reserva
    );
    setReservas(updatedReservas);
    saveReservasToStorage(updatedReservas);
  };

  const handleCancelReserva = (id) => {
    const updatedReservas = reservas.map(reserva =>
      reserva.id === id ? { ...reserva, status: 'Cancelada' } : reserva
    );
    setReservas(updatedReservas);
    saveReservasToStorage(updatedReservas);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendente': return '#f59e0b';
      case 'Confirmada': return '#10b981';
      case 'Cancelada': return '#ef4444';
      case 'Concluída': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pendente': return 'time-outline';
      case 'Confirmada': return 'checkmark-circle-outline';
      case 'Cancelada': return 'close-circle-outline';
      case 'Concluída': return 'checkmark-done-outline';
      default: return 'help-outline';
    }
  };

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

  const renderReservaItem = ({ item }) => (
    <View style={styles.reservaItem}>
      <View style={styles.reservaHeader}>
        <View style={styles.reservaStatus}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={20} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.reservaStatusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
        <Text style={styles.reservaPreco}>{item.preco} Kz</Text>
      </View>

      <View style={styles.reservaRoute}>
        <View style={styles.routePoint}>
          <View style={styles.routeIcon}>
            <Ionicons name="location" size={16} color="#ef4444" />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Origem</Text>
            <Text style={styles.routeAddress}>{item.origem}</Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.routePoint}>
          <View style={styles.routeIcon}>
            <Ionicons name="location" size={16} color="#10b981" />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Destino</Text>
            <Text style={styles.routeAddress}>{item.destino}</Text>
          </View>
        </View>
      </View>

      <View style={styles.reservaDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.data}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.hora}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="car-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.tipoTaxi}</Text>
        </View>
      </View>

      {item.observacoes && (
        <View style={styles.reservaObservacoes}>
          <Text style={styles.observacoesText}>{item.observacoes}</Text>
        </View>
      )}

      <View style={styles.reservaActions}>
        {item.status === 'Pendente' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleStatusChange(item.id, 'Confirmada')}
            >
              <Ionicons name="checkmark" size={16} color="#ffffff" />
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelReserva(item.id)}
            >
              <Ionicons name="close" size={16} color="#ffffff" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, currentStep >= 1 && styles.stepCircleActive]}>
          <Text style={[styles.stepNumber, currentStep >= 1 && styles.stepNumberActive]}>1</Text>
        </View>
        <Text style={[styles.stepLabel, currentStep >= 1 && styles.stepLabelActive]}>Rota</Text>
      </View>
      
      <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, currentStep >= 2 && styles.stepCircleActive]}>
          <Text style={[styles.stepNumber, currentStep >= 2 && styles.stepNumberActive]}>2</Text>
        </View>
        <Text style={[styles.stepLabel, currentStep >= 2 && styles.stepLabelActive]}>Detalhes</Text>
      </View>

      <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, currentStep >= 3 && styles.stepCircleActive]}>
          <Text style={[styles.stepNumber, currentStep >= 3 && styles.stepNumberActive]}>3</Text>
        </View>
        <Text style={[styles.stepLabel, currentStep >= 3 && styles.stepLabelActive]}>Finalizar</Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {/* Origem com autocomplete */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Origem</Text>
              <View style={[
                styles.addressInputContainer,
                formErrors.origem && styles.inputError
              ]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Digite o endereço de origem"
                  value={novaReserva.origem}
                  onChangeText={(text) => handleAddressSearch(text, 'origem')}
                  onFocus={() => {
                    setShowAddressSearch(true);
                    setSearchField('origem');
                  }}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() => {
                    if (location) {
                      setNovaReserva(prev => ({ 
                        ...prev, 
                        origem: 'Minha Localização'
                      }));
                      validateField('origem', 'Minha Localização');
                    }
                  }}
                >
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {formErrors.origem && (
                <Animated.View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.notification} />
                  <Text style={styles.errorText}>{formErrors.origem}</Text>
                </Animated.View>
              )}
              
              {/* Opção rápida para minha localização */}
              <TouchableOpacity
                style={styles.quickLocationButton}
                onPress={() => {
                  if (location) {
                    setNovaReserva(prev => ({ 
                      ...prev, 
                      origem: 'Minha Localização'
                    }));
                  }
                }}
              >
                <Ionicons name="navigate" size={16} color={COLORS.primary} />
                <Text style={styles.quickLocationText}>Usar Minha Localização</Text>
              </TouchableOpacity>
            </View>

            {/* Destino com autocomplete */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Destino</Text>
              <View style={[
                styles.addressInputContainer,
                formErrors.destino && styles.inputError
              ]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Digite o endereço de destino"
                  value={novaReserva.destino}
                  onChangeText={(text) => handleAddressSearch(text, 'destino')}
                  onFocus={() => {
                    setShowAddressSearch(true);
                    setSearchField('destino');
                  }}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() => {
                    if (location) {
                      setNovaReserva(prev => ({ 
                        ...prev, 
                        destino: 'Minha Localização'
                      }));
                      validateField('destino', 'Minha Localização');
                    }
                  }}
                >
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {formErrors.destino && (
                <Animated.View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.notification} />
                  <Text style={styles.errorText}>{formErrors.destino}</Text>
                </Animated.View>
              )}
            </View>

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
          </>
        );
      
      case 2:
        return (
          <>
            {/* Header do Step */}
            <View style={styles.stepHeader}>
              <Ionicons name="flag" size={32} color={COLORS.primary} />
              <Text style={styles.stepTitle}>Destino</Text>
              <Text style={styles.stepDescription}>Para onde você quer ir?</Text>
            </View>

            {/* Destino com autocomplete */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Endereço de Destino</Text>
              <View style={[
                styles.addressInputContainer,
                formErrors.destino && styles.inputError
              ]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Digite o endereço de destino"
                  value={novaReserva.destino}
                  onChangeText={(text) => handleAddressSearch(text, 'destino')}
                  onFocus={() => {
                    setShowAddressSearch(true);
                    setSearchField('destino');
                  }}
                  placeholderTextColor="#9ca3af"
                  autoFocus={true}
                />
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() => {
                    if (location) {
                      setNovaReserva(prev => ({ 
                        ...prev, 
                        destino: 'Minha Localização'
                      }));
                      validateField('destino', 'Minha Localização');
                    }
                  }}
                >
                  <Ionicons name="navigate" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {formErrors.destino && (
                <Animated.View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.notification} />
                  <Text style={styles.errorText}>{formErrors.destino}</Text>
                </Animated.View>
              )}
            </View>

            {/* Resultados da busca de endereços */}
            {showAddressSearch && searchResults.length > 0 && (
              <View style={styles.searchResultsContainer}>
                <Text style={styles.searchResultsTitle}>Sugestões</Text>
                <ScrollView style={styles.searchResultsList} nestedScrollEnabled={true}>
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={result.id || `result_${index}`}
                      style={styles.searchResultItem}
                      onPress={() => handleLocationSelect(result)}
                    >
                      <View style={styles.searchResultIcon}>
                        <MaterialIcons 
                          name={getIconForCategory(result.categories)} 
                          size={20} 
                          color={COLORS.primary} 
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
                <Text style={styles.searchingText}>Buscando locais...</Text>
              </View>
            )}
          </>
        );

      case 3:
        return (
          <>
            {/* Header do Step */}
            <View style={styles.stepHeader}>
              <Ionicons name="calendar" size={32} color={COLORS.primary} />
              <Text style={styles.stepTitle}>Data e Hora</Text>
              <Text style={styles.stepDescription}>Quando você precisa da viagem?</Text>
            </View>

            {/* Data */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Data</Text>
              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  formErrors.data && styles.inputError
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                <Text style={[
                  styles.dateTimeText,
                  !novaReserva.data && styles.placeholderText
                ]}>
                  {novaReserva.data || 'Selecione a data'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9ca3af" />
              </TouchableOpacity>
              {formErrors.data && (
                <Animated.View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.notification} />
                  <Text style={styles.errorText}>{formErrors.data}</Text>
                </Animated.View>
              )}
            </View>

            {/* Hora */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hora</Text>
              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  formErrors.hora && styles.inputError
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                <Text style={[
                  styles.dateTimeText,
                  !novaReserva.hora && styles.placeholderText
                ]}>
                  {novaReserva.hora || 'Selecione a hora'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9ca3af" />
              </TouchableOpacity>
              {formErrors.hora && (
                <Animated.View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.notification} />
                  <Text style={styles.errorText}>{formErrors.hora}</Text>
                </Animated.View>
              )}
            </View>

            {/* Tipo de táxi */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo de Táxi</Text>
              <View style={styles.optionsContainer}>
                {['Coletivo', 'Privado'].map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.optionButton,
                      novaReserva.tipoTaxi === tipo && styles.optionButtonActive
                    ]}
                    onPress={() => setNovaReserva(prev => ({ ...prev, tipoTaxi: tipo }))}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      novaReserva.tipoTaxi === tipo && styles.optionButtonTextActive
                    ]}>
                      {tipo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        );

      case 4:
        return (
          <>
            {/* Header do Step */}
            <View style={styles.stepHeader}>
              <Ionicons name="checkmark-circle" size={32} color={COLORS.primary} />
              <Text style={styles.stepTitle}>Finalizar</Text>
              <Text style={styles.stepDescription}>Revise os detalhes da sua reserva</Text>
            </View>

            {/* Observações */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Observações (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Adicione observações especiais..."
                value={novaReserva.observacoes}
                onChangeText={(text) => setNovaReserva(prev => ({ ...prev, observacoes: text }))}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Resumo da reserva */}
            <View style={styles.resumoContainer}>
              <Text style={styles.resumoTitle}>Resumo da Reserva</Text>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoLabel}>Origem:</Text>
                <Text style={styles.resumoValue}>{novaReserva.origem}</Text>
              </View>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoLabel}>Destino:</Text>
                <Text style={styles.resumoValue}>{novaReserva.destino}</Text>
              </View>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoLabel}>Data:</Text>
                <Text style={styles.resumoValue}>{novaReserva.data}</Text>
              </View>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoLabel}>Hora:</Text>
                <Text style={styles.resumoValue}>{novaReserva.hora}</Text>
              </View>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoLabel}>Tipo:</Text>
                <Text style={styles.resumoValue}>{novaReserva.tipoTaxi}</Text>
              </View>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoLabel}>Preço:</Text>
                <Text style={styles.resumoValue}>{novaReserva.tipoTaxi === 'Coletivo' ? '500' : '800'} Kz</Text>
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
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={resetForm}
          >
            <Text style={styles.buttonSecondaryText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={nextStep}
          >
            <Text style={styles.buttonPrimaryText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (currentStep === 2) {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={prevStep}
          >
            <Text style={styles.buttonSecondaryText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={nextStep}
          >
            <Text style={styles.buttonPrimaryText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (currentStep === 3) {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={prevStep}
          >
            <Text style={styles.buttonSecondaryText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.buttonPrimary,
              isSubmitting && styles.buttonPrimaryDisabled
            ]}
            onPress={handleAddReserva}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingSpinner} />
                <Text style={styles.buttonPrimaryText}>Criando...</Text>
              </View>
            ) : (
              <Text style={styles.buttonPrimaryText}>Criar Reserva</Text>
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
        <Text style={styles.headerTitle}>Reservas</Text>
        {reservas.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllReservas}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={styles.clearButtonText}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {reservas.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Minhas Reservas</Text>
            <FlatList
              data={reservas}
              renderItem={renderReservaItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.reservasList}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>Nenhuma reserva ainda</Text>
            <Text style={styles.emptyStateSubtitle}>
              Você ainda não tem reservas. Crie uma nova reserva para começar.
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

      {/* Bottom Sheet Modal para adicionar reserva */}
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
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Nova Reserva</Text>
                <Text style={styles.subtitle}>Passo {currentStep} de 4</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={resetForm}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
              {[1, 2, 3, 4].map((step) => (
                <View key={step} style={styles.progressStep}>
                  <View style={[
                    styles.progressDot,
                    currentStep >= step && styles.progressDotActive
                  ]}>
                    {currentStep > step ? (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    ) : (
                      <Text style={[
                        styles.progressNumber,
                        currentStep >= step && styles.progressNumberActive
                      ]}>
                        {step}
                      </Text>
                    )}
                  </View>
                  {step < 4 && (
                    <View style={[
                      styles.progressLine,
                      currentStep > step && styles.progressLineActive
                    ]} />
                  )}
                </View>
              ))}
            </View>

            {/* Content */}
            <View style={styles.content}>
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
            <View style={styles.footer}>
              {renderStepButtons()}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
          locale="pt-BR"
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          locale="pt-BR"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  clearButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  reservasList: {
    paddingBottom: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    minHeight: height * 0.7,
    ...SHADOWS.large,
    paddingTop: 12,
  },
  handle: {
    width: 32,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  progressNumberActive: {
    color: '#ffffff',
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Step Header Styles
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  // Address input with autocomplete
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationButton: {
    padding: 8,
    marginLeft: 10,
  },
  // Search results styles
  searchResultsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.medium,
    maxHeight: 300,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchResultsList: {
    maxHeight: 250,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  searchResultIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchResultAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  hereMapsBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  hereMapsBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
  },
  searchingText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  // Options container
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 5,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonPrimaryDisabled: {
    backgroundColor: '#9CA3AF',
    ...SHADOWS.small,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 50,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
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
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  // Reserva item styles
  reservaItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reservaStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  reservaStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  reservaPreco: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  reservaRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  routeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInfo: {
    marginLeft: 10,
  },
  routeLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  routeAddress: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  routeLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  reservaDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 5,
  },
  reservaObservacoes: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  observacoesText: {
    fontSize: 14,
    color: '#1F2937',
  },
  reservaActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    flex: 1,
    marginRight: 10,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  cancelButton: {
    backgroundColor: COLORS.notification,
    flex: 1,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  // Floating action button
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 30 : 20,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  // New styles for quick location button
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
  // Quick Location Card
  quickLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickLocationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickLocationInfo: {
    flex: 1,
  },
  quickLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  quickLocationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Step indicator styles
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  // New styles for step buttons
  nextButton: {
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
  nextButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
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
  // New styles for resumo container
  resumoContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
  },
  resumoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  resumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resumoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  resumoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  // Novos estilos para melhorias
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
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'space-between',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
    marginLeft: 10,
  },
  placeholderText: {
    color: '#9ca3af',
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
    borderColor: '#ffffff',
    borderTopColor: 'transparent',
    marginRight: 8,
  },
});

export default ReservasScreen;