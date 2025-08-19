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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';
import { checkForExistingData, clearDataByKey, DATA_KEYS } from '../utils/dataCleaner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

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

  // Carregar dados existentes ao montar o componente
  useEffect(() => {
    loadExistingReservas();
    loadUserLocation();
  }, []);

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
  };

  const nextStep = () => {
    if (currentStep === 1 && (!novaReserva.origem || !novaReserva.destino)) {
      Alert.alert('Erro', 'Por favor, preencha origem e destino para continuar');
      return;
    }
    if (currentStep === 2 && (!novaReserva.data || !novaReserva.hora)) {
      Alert.alert('Erro', 'Por favor, preencha data e hora para continuar');
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

  const handleAddReserva = () => {
    if (!novaReserva.origem || !novaReserva.destino || !novaReserva.data || !novaReserva.hora) {
      Alert.alert('Erro', 'Por favor, preencha origem, destino, data e hora');
      return;
    }

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
    saveReservasToStorage(updatedReservas);
    
    // Limpar formulário e fechar modal
    resetForm();
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
              <View style={styles.addressInputContainer}>
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
                    }
                  }}
                >
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              
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
              <View style={styles.addressInputContainer}>
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
                    }
                  }}
                >
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
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
            {/* Data */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Data</Text>
              <TextInput
                style={styles.textInput}
                placeholder="DD/MM/AAAA"
                value={novaReserva.data}
                onChangeText={(text) => setNovaReserva(prev => ({ ...prev, data: text }))}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Hora */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hora</Text>
              <TextInput
                style={styles.textInput}
                placeholder="HH:MM"
                value={novaReserva.hora}
                onChangeText={(text) => setNovaReserva(prev => ({ ...prev, hora: text }))}
                placeholderTextColor="#9ca3af"
              />
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

      case 3:
        return (
          <>
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
            style={styles.nextButton}
            onPress={nextStep}
          >
            <Text style={styles.nextButtonText}>Próximo</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (currentStep === 3) {
      return (
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={prevStep}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleAddReserva}
          >
            <Text style={styles.saveButtonText}>Criar Reserva</Text>
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

      {/* Modal para adicionar reserva */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Reserva</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={resetForm}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Step Indicator */}
            {renderStepIndicator()}

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {renderStepContent()}
            </ScrollView>

            {/* Step Buttons */}
            {renderStepButtons()}
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
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
    borderRadius: 10,
    marginTop: 10,
    maxHeight: 150,
    ...SHADOWS.small,
  },
  searchResultsList: {
    maxHeight: 150,
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
  // Modal footer
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
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
});

export default ReservasScreen;