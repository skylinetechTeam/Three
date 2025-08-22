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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import LocalDatabase from '../services/localDatabase';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

export default function DriverRequestsScreen({ navigation }) {
  const [rideRequests, setRideRequests] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadRideRequests();
    checkOnlineStatus();
    
    // Simulate receiving new ride requests when online
    const interval = setInterval(() => {
      if (isOnline) {
        simulateNewRequest();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline]);

  const loadRideRequests = async () => {
    try {
      const requests = await LocalDatabase.getRideRequests();
      // Filter requests for this driver (pending status)
      const driverRequests = requests.filter(request => 
        request.status === 'pending' || request.status === 'accepted'
      );
      setRideRequests(driverRequests);
    } catch (error) {
      console.error('Error loading ride requests:', error);
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

  const simulateNewRequest = async () => {
    try {
      // Simulate a new ride request
      const mockRequest = {
        passengerName: `Passageiro ${Math.floor(Math.random() * 100)}`,
        pickup: {
          address: 'Rua da Liberdade, 123',
          lat: -8.8390 + (Math.random() - 0.5) * 0.01,
          lng: 13.2894 + (Math.random() - 0.5) * 0.01,
        },
        destination: {
          address: 'Avenida Principal, 456',
          lat: -8.8390 + (Math.random() - 0.5) * 0.02,
          lng: 13.2894 + (Math.random() - 0.5) * 0.02,
        },
        fare: (Math.random() * 500 + 200).toFixed(0), // 200-700 AOA
        distance: (Math.random() * 10 + 2).toFixed(1), // 2-12 km
        estimatedTime: Math.floor(Math.random() * 30 + 10), // 10-40 min
        paymentMethod: Math.random() > 0.5 ? 'Dinheiro' : 'Cartão',
        requestTime: new Date().toISOString(),
      };

      const requestId = await LocalDatabase.saveRideRequest(mockRequest);
      if (requestId) {
        loadRideRequests();
        
        // Show notification sound or vibration would go here
        Toast.show({
          type: "info",
          text1: "Nova solicitação!",
          text2: `Corrida para ${mockRequest.destination.address}`,
        });
      }
    } catch (error) {
      console.error('Error simulating new request:', error);
    }
  };

  const acceptRideRequest = async (requestId) => {
    try {
      setAcceptingRequest(true);
      
      // Update request status to accepted
      await LocalDatabase.updateRideRequestStatus(requestId, 'accepted');
      
      // Update local state
      setRideRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status: 'accepted' }
            : request
        )
      );

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
      await LocalDatabase.updateRideRequestStatus(requestId, 'rejected');
      
      setRideRequests(prev => 
        prev.filter(request => request.id !== requestId)
      );

      Toast.show({
        type: "info",
        text1: "Corrida recusada",
        text2: "A solicitação foi removida",
      });

      setShowRequestModal(false);
    } catch (error) {
      console.error('Error rejecting ride request:', error);
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
            {' '}{item.distance} km
          </Text>
          <Text style={styles.tripDetail}>
            <MaterialIcons name="access-time" size={14} color="#6B7280" />
            {' '}{item.estimatedTime} min
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
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
          <MaterialIcons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Requests List */}
      <FlatList
        data={rideRequests}
        renderItem={renderRideRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
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
                        <Text style={styles.tripInfoValue}>{selectedRequest.distance} km</Text>
                      </View>
                      <View style={styles.tripInfoItem}>
                        <MaterialIcons name="access-time" size={20} color="#6B7280" />
                        <Text style={styles.tripInfoLabel}>Tempo</Text>
                        <Text style={styles.tripInfoValue}>{selectedRequest.estimatedTime} min</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  onlineText: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  offlineText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  acceptedCard: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  requestTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  fareContainer: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  routeInfo: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#D1D5DB',
    marginLeft: 7,
    marginVertical: 2,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  tripDetail: {
    fontSize: 12,
    color: '#6B7280',
    alignItems: 'center',
  },
  acceptedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acceptedText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  goOnlineButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  goOnlineText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  passengerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  passengerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  modalPassengerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalRequestTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  routeSection: {
    marginBottom: 24,
  },
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalLocationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  modalLocationLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  modalLocationAddress: {
    fontSize: 16,
    color: '#1F2937',
    marginTop: 2,
  },
  modalRouteLine: {
    width: 2,
    height: 24,
    backgroundColor: '#D1D5DB',
    marginLeft: 9,
    marginVertical: 4,
  },
  tripInfoSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tripInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  tripInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  tripInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  navigateButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  navigateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
});