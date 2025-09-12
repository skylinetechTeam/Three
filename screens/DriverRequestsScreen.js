import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import LocalDatabase from '../services/localDatabase';
import apiService from '../services/apiService';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

export default function DriverRequestsScreen({ navigation }) {
  const [rideRequests, setRideRequests] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState(false);
  const [driverProfile, setDriverProfile] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    initializeDriver();
    loadRideRequests();
    checkOnlineStatus();
    getCurrentLocation();
    
    return () => {
      // Cleanup socket connection if needed
      if (driverProfile?.apiDriverId) {
        apiService.disconnectSocket();
      }
    };
  }, []);

  useEffect(() => {
    // Setup socket listeners when driver profile is loaded
    if (driverProfile?.apiDriverId) {
      const socket = apiService.connectSocket('driver', driverProfile.apiDriverId);
      
      if (socket) {
        socket.on('new_ride_request', (data) => {
          console.log('Nova solicitação recebida:', data);
          setRideRequests(prev => [data.ride, ...prev]);
          
          Toast.show({
            type: "info",
            text1: "Nova solicitação!",
            text2: `Corrida para ${data.ride.destination.address}`,
          });
        });
        
        socket.on('ride_unavailable', (data) => {
          console.log('Corrida não disponível:', data);
          setRideRequests(prev => prev.filter(req => req.id !== data.rideId));
        });
      }
      
      // Load ride requests when we have both driver profile and location
      if (location) {
        loadRideRequests();
      }
    }
  }, [driverProfile, location]);

  const initializeDriver = async () => {
    try {
      const profile = await LocalDatabase.getDriverProfile();
      if (profile) {
        setDriverProfile(profile);
        
        // Clear any existing fake requests from local storage
        await clearFakeRequests();
      }
    } catch (error) {
      console.error('Error initializing driver:', error);
    }
  };

  const clearFakeRequests = async () => {
    try {
      // Clear only local ride requests since we're only using API now
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.removeItem('ride_requests');
      console.log('Cleared fake requests from local storage');
    } catch (error) {
      console.error('Error clearing fake requests:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadRideRequests = async () => {
    try {
      // Only load from API if driver is registered
      if (driverProfile?.apiDriverId && location) {
        try {
          const apiResponse = await apiService.getPendingRides(location.coords, 10);
          setRideRequests(apiResponse.data || []);
          return;
        } catch (apiError) {
          console.error('Failed to load from API:', apiError);
          setRideRequests([]);
          return;
        }
      }
      
      // If no API driver ID or location, show empty state
      setRideRequests([]);
    } catch (error) {
      console.error('Error loading ride requests:', error);
      setRideRequests([]);
    }
  };

  const checkOnlineStatus = async () => {
    try {
      const status = await LocalDatabase.getDriverOnlineStatus();
      setIsOnline(status);
    } catch (error) {
      console.error('Error checking online status:', error);
    }
  };



  const acceptRideRequest = async (requestId) => {
    try {
      setAcceptingRequest(true);
      
      // Accept ride via API - only works if driver is registered
      if (driverProfile?.apiDriverId) {
        const driverData = {
          driverId: driverProfile.apiDriverId,
          driverName: driverProfile.nome || 'Motorista',
          driverPhone: driverProfile.telefone || driverProfile.phone,
          vehicleInfo: {
            make: driverProfile.veiculo?.marca || 'Toyota',
            model: driverProfile.veiculo?.modelo || 'Corolla',
            year: driverProfile.veiculo?.ano || 2020,
            color: driverProfile.veiculo?.cor || 'Branco',
            plate: driverProfile.veiculo?.placa || 'LD-12-34-AB'
          }
        };
        
        await apiService.acceptRide(requestId, driverData);
        
        // Remove from local list since it's accepted
        setRideRequests(prev => prev.filter(req => req.id !== requestId));
      } else {
        throw new Error('Driver not registered with API');
      }

      Toast.show({
        type: "success",
        text1: "Corrida aceita!",
        text2: "Navegue até o passageiro",
      });

      setShowRequestModal(false);
      
      // Navigate to map with route
      navigation.navigate('DriverMap', { 
        activeRide: selectedRequest,
        navigateTo: 'pickup'
      });

    } catch (error) {
      console.error('Error accepting ride request:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível aceitar a corrida",
      });
    } finally {
      setAcceptingRequest(false);
    }
  };

  const rejectRideRequest = async (requestId) => {
    try {
      // Reject ride via API - only works if driver is registered
      if (driverProfile?.apiDriverId) {
        await apiService.rejectRide(requestId, driverProfile.apiDriverId, 'Driver declined');
        
        setRideRequests(prev => 
          prev.filter(request => request.id !== requestId)
        );

        Toast.show({
          type: "info",
          text1: "Corrida recusada",
          text2: "A solicitação foi removida",
        });

        setShowRequestModal(false);
      } else {
        throw new Error('Driver not registered with API');
      }
    } catch (error) {
      console.error('Error rejecting ride request:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível recusar a corrida",
      });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateTimeAgo = (timestamp) => {
    const now = new Date();
    const requestTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - requestTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes === 1) return '1 minuto atrás';
    if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hora atrás';
    return `${diffInHours} horas atrás`;
  };

  const renderRideRequest = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.requestCard,
        item.status === 'accepted' && styles.acceptedCard
      ]}
      onPress={() => {
        setSelectedRequest(item);
        setShowRequestModal(true);
      }}
    >
      <View style={styles.requestHeader}>
        <View style={styles.passengerInfo}>
          <Text style={styles.passengerName}>{item.passengerName}</Text>
          <Text style={styles.requestTime}>{calculateTimeAgo(item.requestTime)}</Text>
        </View>
        <View style={styles.fareContainer}>
          <Text style={styles.fareAmount}>{item.fare} AOA</Text>
          <Text style={styles.paymentMethod}>{item.paymentMethod}</Text>
        </View>
      </View>

      <View style={styles.routeInfo}>
        <View style={styles.locationRow}>
          <MaterialIcons name="radio-button-checked" size={16} color="#10B981" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.pickup.address}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.locationRow}>
          <MaterialIcons name="place" size={16} color="#EF4444" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.destination.address}
          </Text>
        </View>
      </View>

      <View style={styles.requestFooter}>
        <View style={styles.tripDetails}>
          <Text style={styles.tripDetail}>
            <MaterialIcons name="straighten" size={14} color="#6B7280" />
            {' '}{(item.distance / 1000).toFixed(1)} km
          </Text>
          <Text style={styles.tripDetail}>
            <MaterialIcons name="access-time" size={14} color="#6B7280" />
            {' '}{Math.round(item.estimatedTime / 60)} min
          </Text>
        </View>
        
        {item.status === 'accepted' && (
          <View style={styles.acceptedBadge}>
            <Text style={styles.acceptedText}>ACEITA</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="assignment" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>
        {isOnline ? 'Aguardando solicitações' : 'Você está offline'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isOnline 
          ? 'Novas corridas aparecerão aqui quando disponíveis'
          : 'Fique online para receber solicitações de corrida'
        }
      </Text>
      
      {!isOnline && (
        <TouchableOpacity 
          style={styles.goOnlineButton}
          onPress={() => navigation.navigate('DriverMap')}
        >
          <Text style={styles.goOnlineText}>Ficar Online</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Solicitações</Text>
          <Text style={styles.headerSubtitle}>
            Status: <Text style={isOnline ? styles.onlineText : styles.offlineText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadRideRequests}
        >
          <MaterialIcons name="refresh" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Requests List */}
      <FlatList
        data={rideRequests}
        renderItem={renderRideRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshing={false}
        onRefresh={loadRideRequests}
      />

      {/* Request Detail Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRequest && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detalhes da Corrida</Text>
                  <TouchableOpacity
                    onPress={() => setShowRequestModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.passengerSection}>
                    <MaterialIcons name="person" size={24} color="#2563EB" />
                    <View style={styles.passengerDetails}>
                      <Text style={styles.modalPassengerName}>
                        {selectedRequest.passengerName}
                      </Text>
                      <Text style={styles.modalRequestTime}>
                        Solicitado {calculateTimeAgo(selectedRequest.requestTime)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.routeSection}>
                    <View style={styles.modalLocationRow}>
                      <MaterialIcons name="radio-button-checked" size={20} color="#10B981" />
                      <View style={styles.modalLocationDetails}>
                        <Text style={styles.modalLocationLabel}>Origem</Text>
                        <Text style={styles.modalLocationAddress}>
                          {selectedRequest.pickup.address}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalRouteLine} />

                    <View style={styles.modalLocationRow}>
                      <MaterialIcons name="place" size={20} color="#EF4444" />
                      <View style={styles.modalLocationDetails}>
                        <Text style={styles.modalLocationLabel}>Destino</Text>
                        <Text style={styles.modalLocationAddress}>
                          {selectedRequest.destination.address}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.tripInfoSection}>
                    <View style={styles.tripInfoRow}>
                      <View style={styles.tripInfoItem}>
                        <MaterialIcons name="straighten" size={20} color="#6B7280" />
                        <Text style={styles.tripInfoLabel}>Distância</Text>
                        <Text style={styles.tripInfoValue}>{(selectedRequest.distance / 1000).toFixed(1)} km</Text>
                      </View>
                      <View style={styles.tripInfoItem}>
                        <MaterialIcons name="access-time" size={20} color="#6B7280" />
                        <Text style={styles.tripInfoLabel}>Tempo</Text>
                        <Text style={styles.tripInfoValue}>{Math.round(selectedRequest.estimatedTime / 60)} min</Text>
                      </View>
                    </View>
                    
                    <View style={styles.tripInfoRow}>
                      <View style={styles.tripInfoItem}>
                        <MaterialIcons name="payment" size={20} color="#6B7280" />
                        <Text style={styles.tripInfoLabel}>Pagamento</Text>
                        <Text style={styles.tripInfoValue}>{selectedRequest.paymentMethod}</Text>
                      </View>
                      <View style={styles.tripInfoItem}>
                        <MaterialIcons name="attach-money" size={20} color="#6B7280" />
                        <Text style={styles.tripInfoLabel}>Valor</Text>
                        <Text style={styles.tripInfoValue}>{selectedRequest.fare} AOA</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {selectedRequest.status === 'pending' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => rejectRideRequest(selectedRequest.id)}
                    >
                      <Text style={styles.rejectButtonText}>Recusar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.acceptButton, acceptingRequest && styles.acceptButtonDisabled]}
                      onPress={() => acceptRideRequest(selectedRequest.id)}
                      disabled={acceptingRequest}
                    >
                      <Text style={styles.acceptButtonText}>
                        {acceptingRequest ? 'Aceitando...' : 'Aceitar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedRequest.status === 'accepted' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.navigateButton}
                      onPress={() => {
                        setShowRequestModal(false);
                        navigation.navigate('DriverMap', { 
                          activeRide: selectedRequest,
                          navigateTo: 'pickup'
                        });
                      }}
                    >
                      <MaterialIcons name="navigation" size={20} color="#ffffff" />
                      <Text style={styles.navigateButtonText}>Navegar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.xl,
    paddingVertical: SIZES.padding.large,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radius.full,
    backgroundColor: COLORS.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h5,
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    ...FONTS.body2,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.xs,
  },
  onlineText: {
    color: COLORS.online,
    fontWeight: '600',
  },
  offlineText: {
    color: COLORS.offline,
    fontWeight: '600',
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radius.full,
    backgroundColor: COLORS.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  listContainer: {
    padding: SIZES.padding.xl,
    flexGrow: 1,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.medium,
    padding: SIZES.padding.large,
    marginBottom: SIZES.padding.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  acceptedCard: {
    borderColor: COLORS.success,
    borderWidth: 2,
    ...SHADOWS.success,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.padding.medium,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    ...FONTS.body1,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  requestTime: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.xs,
  },
  fareContainer: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    ...FONTS.h5,
    color: COLORS.success,
  },
  paymentMethod: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.xs,
  },
  routeInfo: {
    marginBottom: SIZES.padding.medium,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.xs,
  },
  locationText: {
    ...FONTS.body2,
    color: COLORS.text.primary,
    marginLeft: SIZES.padding.small,
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.divider,
    marginLeft: 9,
    marginVertical: SIZES.padding.xs,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripDetails: {
    flexDirection: 'row',
    gap: SIZES.spacing.large,
  },
  tripDetail: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    alignItems: 'center',
  },
  acceptedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SIZES.padding.small,
    paddingVertical: SIZES.padding.xs,
    borderRadius: SIZES.radius.medium,
  },
  acceptedText: {
    ...FONTS.status,
    color: COLORS.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.xxxl,
  },
  emptyTitle: {
    ...FONTS.h5,
    color: COLORS.text.primary,
    marginTop: SIZES.padding.large,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...FONTS.body2,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.small,
    textAlign: 'center',
    lineHeight: SIZES.lineHeight.medium,
  },
  goOnlineButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding.xxl,
    paddingVertical: SIZES.padding.medium,
    borderRadius: SIZES.radius.medium,
    marginTop: SIZES.padding.xxl,
    ...SHADOWS.primary,
  },
  goOnlineText: {
    ...FONTS.button,
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.xl,
    paddingVertical: SIZES.padding.xxxl,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.xl,
    width: '100%',
    maxHeight: height * 0.85,
    ...SHADOWS.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.xl,
    paddingVertical: SIZES.padding.large,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    ...FONTS.h5,
    color: COLORS.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.full,
    backgroundColor: COLORS.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  modalBody: {
    padding: SIZES.padding.xl,
  },
  passengerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.xxl,
    paddingBottom: SIZES.padding.large,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  passengerDetails: {
    marginLeft: SIZES.padding.medium,
    flex: 1,
  },
  modalPassengerName: {
    ...FONTS.h5,
    color: COLORS.text.primary,
  },
  modalRequestTime: {
    ...FONTS.body2,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.xs,
  },
  routeSection: {
    marginBottom: SIZES.padding.xxl,
  },
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.padding.small,
  },
  modalLocationDetails: {
    marginLeft: SIZES.padding.medium,
    flex: 1,
  },
  modalLocationLabel: {
    ...FONTS.overline,
    color: COLORS.text.secondary,
  },
  modalLocationAddress: {
    ...FONTS.body1,
    color: COLORS.text.primary,
    marginTop: SIZES.padding.xs,
  },
  modalRouteLine: {
    width: 2,
    height: 28,
    backgroundColor: COLORS.divider,
    marginLeft: 11,
    marginVertical: SIZES.padding.xs,
  },
  tripInfoSection: {
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radius.medium,
    padding: SIZES.padding.large,
  },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding.large,
  },
  tripInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  tripInfoLabel: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.xs,
    textAlign: 'center',
  },
  tripInfoValue: {
    ...FONTS.body1,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: SIZES.padding.xs,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding.xl,
    paddingVertical: SIZES.padding.large,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: SIZES.spacing.medium,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundTertiary,
    paddingVertical: SIZES.padding.large,
    borderRadius: SIZES.radius.medium,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  rejectButtonText: {
    ...FONTS.button,
    color: COLORS.text.secondary,
  },
  acceptButton: {
    flex: 2,
    backgroundColor: COLORS.success,
    paddingVertical: SIZES.padding.large,
    borderRadius: SIZES.radius.medium,
    alignItems: 'center',
    ...SHADOWS.success,
  },
  acceptButtonDisabled: {
    backgroundColor: COLORS.text.light,
    ...SHADOWS.small,
  },
  acceptButtonText: {
    ...FONTS.button,
    color: COLORS.white,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding.large,
    borderRadius: SIZES.radius.medium,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.primary,
  },
  navigateButtonText: {
    ...FONTS.button,
    color: COLORS.white,
    marginLeft: SIZES.padding.small,
  },
});