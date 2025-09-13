import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal, OverlayModal } from '../BaseModal/ModalVariants';
import { ResponsiveButton, ResponsiveCard } from '../ResponsiveUI';
import { useResponsive, useNotification } from '../../contexts/UIContext';
import { COLORS, SIZES, FONTS, RESPONSIVE } from '../../config/theme';

/**
 * DriverRequestModal - Enhanced ride request modal for drivers
 */
export const DriverRequestModal = ({
  visible,
  onClose,
  onAccept,
  onDecline,
  request,
  autoDeclineTime = 30,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(autoDeclineTime);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showNotification } = useNotification();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Auto-decline timer
  useEffect(() => {
    if (!visible) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        // Update progress animation
        Animated.timing(progressAnim, {
          toValue: newTime / autoDeclineTime,
          duration: 500,
          useNativeDriver: false,
        }).start();

        if (newTime <= 0) {
          clearInterval(timer);
          handleAutoDecline();
        }
        
        return newTime;
      });
    }, 1000);

    // Pulse animation for urgency
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseAnimation.start();

    return () => {
      clearInterval(timer);
      pulseAnimation.stop();
    };
  }, [visible]);

  const handleAutoDecline = () => {
    showNotification({
      type: 'warning',
      title: 'Solicitação expirou',
      message: 'A solicitação foi automaticamente recusada',
    });
    onDecline?.();
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept?.(request);
      showNotification({
        type: 'success',
        title: 'Corrida aceita',
        message: 'Navegue até o passageiro',
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível aceitar a corrida',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    onDecline?.(request);
    showNotification({
      type: 'info',
      title: 'Corrida recusada',
      message: 'Procurando próximas oportunidades',
    });
  };

  const calculateDistance = () => {
    // Mock distance calculation
    return (Math.random() * 5 + 0.5).toFixed(1);
  };

  const calculateEstimatedEarnings = () => {
    // Mock earnings calculation based on distance and fare
    const baseEarning = 600;
    const distanceEarning = parseFloat(calculateDistance()) * 100;
    return Math.round(baseEarning + distanceEarning);
  };

  const formatTime = (seconds) => {
    return `${seconds}s`;
  };

  if (!request) return null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={null} // Prevent manual close
      title="Nova solicitação de corrida"
      enableGestures={false}
      enableBackdropDismiss={false}
      initialSnapPoint={0.75}
      snapPoints={[0.75]}
    >
      {/* Timer Header */}
      <View style={styles.timerHeader}>
        <View style={styles.timerContainer}>
          <Animated.View style={[
            styles.timerCircle,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <Text style={[FONTS.styles.h2, styles.timerText]}>
              {formatTime(timeRemaining)}
            </Text>
          </Animated.View>
          
          <Animated.View style={[
            styles.progressRing,
            {
              transform: [{
                rotate: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }
          ]} />
        </View>
        
        <Text style={[FONTS.styles.body2, styles.timerLabel]}>
          Tempo para responder
        </Text>
      </View>

      {/* Passenger Information */}
      <ResponsiveCard style={styles.passengerCard} variant="elevated">
        <View style={styles.passengerHeader}>
          <View style={styles.passengerAvatar}>
            <Ionicons 
              name="person" 
              size={RESPONSIVE.getIconSize('large')} 
              color={COLORS.text.light} 
            />
          </View>
          
          <View style={styles.passengerInfo}>
            <Text style={[FONTS.styles.h3, styles.passengerName]}>
              {request.passengerName || 'Passageiro'}
            </Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={14}
                  color={star <= (request.passengerRating || 4.5) ? COLORS.semantic.warning : COLORS.border}
                />
              ))}
              <Text style={[FONTS.styles.caption, styles.ratingText]}>
                {request.passengerRating || '4.5'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => {
              // Handle call passenger
              showNotification({
                type: 'info',
                title: 'Ligando',
                message: 'Conectando com o passageiro...',
              });
            }}
          >
            <Ionicons name="call" size={20} color={COLORS.semantic.success} />
          </TouchableOpacity>
        </View>
      </ResponsiveCard>

      {/* Trip Details */}
      <ResponsiveCard style={styles.tripCard} variant="flat">
        <Text style={[FONTS.styles.h3, styles.sectionTitle]}>
          Detalhes da corrida
        </Text>
        
        <View style={styles.routeInfo}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, styles.originDot]} />
            <View style={styles.routeDetails}>
              <Text style={[FONTS.styles.caption, styles.pointLabel]}>
                ORIGEM
              </Text>
              <Text style={[FONTS.styles.body1, styles.pointText]}>
                {request.origin?.address || 'Local de origem'}
              </Text>
            </View>
            <Text style={[FONTS.styles.caption, styles.distanceText]}>
              {calculateDistance()}km
            </Text>
          </View>
          
          <View style={styles.routeLine} />
          
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, styles.destinationDot]} />
            <View style={styles.routeDetails}>
              <Text style={[FONTS.styles.caption, styles.pointLabel]}>
                DESTINO
              </Text>
              <Text style={[FONTS.styles.body1, styles.pointText]}>
                {request.destination?.address || 'Local de destino'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tripStats}>
          <View style={styles.statItem}>
            <Ionicons name="car" size={16} color={COLORS.text.light} />
            <Text style={[FONTS.styles.caption, styles.statText]}>
              {request.vehicleType || 'Taxi Normal'}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="cash" size={16} color={COLORS.text.light} />
            <Text style={[FONTS.styles.caption, styles.statText]}>
              Dinheiro
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color={COLORS.text.light} />
            <Text style={[FONTS.styles.caption, styles.statText]}>
              {request.estimatedTime || '15'} min
            </Text>
          </View>
        </View>
      </ResponsiveCard>

      {/* Earnings Information */}
      <ResponsiveCard style={styles.earningsCard} variant="elevated">
        <View style={styles.earningsHeader}>
          <Text style={[FONTS.styles.h3, styles.earningsTitle]}>
            Ganho estimado
          </Text>
          <Text style={[FONTS.styles.h2, styles.earningsAmount]}>
            {calculateEstimatedEarnings().toLocaleString()} Kz
          </Text>
        </View>
        
        <View style={styles.earningsBreakdown}>
          <View style={styles.earningsRow}>
            <Text style={[FONTS.styles.body2, styles.earningsLabel]}>
              Taxa base
            </Text>
            <Text style={[FONTS.styles.body2, styles.earningsValue]}>
              600 Kz
            </Text>
          </View>
          
          <View style={styles.earningsRow}>
            <Text style={[FONTS.styles.body2, styles.earningsLabel]}>
              Distância ({calculateDistance()}km)
            </Text>
            <Text style={[FONTS.styles.body2, styles.earningsValue]}>
              {Math.round(parseFloat(calculateDistance()) * 100)} Kz
            </Text>
          </View>
        </View>
      </ResponsiveCard>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <ResponsiveButton
          title="Recusar"
          variant="secondary"
          size="large"
          onPress={handleDecline}
          disabled={isProcessing}
          style={styles.declineButton}
        />
        
        <ResponsiveButton
          title={isProcessing ? "Aceitando..." : "Aceitar"}
          variant="primary"
          size="large"
          onPress={handleAccept}
          loading={isProcessing}
          disabled={isProcessing}
          style={styles.acceptButton}
        />
      </View>
    </BottomSheetModal>
  );
};

/**
 * DriverStatusModal - Driver availability and preferences modal
 */
export const DriverStatusModal = ({
  visible,
  onClose,
  currentStatus,
  onStatusChange,
  preferences,
  onPreferencesChange,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || 'offline');
  const [tempPreferences, setTempPreferences] = useState(preferences || {
    vehicleTypes: ['Taxi Normal'],
    maxDistance: 10,
    autoAccept: false,
  });

  const statusOptions = [
    {
      id: 'online',
      name: 'Online',
      description: 'Recebendo solicitações',
      icon: 'checkmark-circle',
      color: COLORS.semantic.success,
    },
    {
      id: 'busy',
      name: 'Ocupado',
      description: 'Em corrida',
      icon: 'car',
      color: COLORS.semantic.warning,
    },
    {
      id: 'break',
      name: 'Pausa',
      description: 'Temporariamente indisponível',
      icon: 'pause-circle',
      color: COLORS.semantic.info,
    },
    {
      id: 'offline',
      name: 'Offline',
      description: 'Não recebendo solicitações',
      icon: 'stop-circle',
      color: COLORS.text.light,
    },
  ];

  const handleSave = () => {
    onStatusChange?.(selectedStatus);
    onPreferencesChange?.(tempPreferences);
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Status e preferências"
      subtitle="Configure sua disponibilidade"
      initialSnapPoint={0.8}
      snapPoints={[0.6, 0.8]}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Selection */}
        <View style={styles.section}>
          <Text style={[FONTS.styles.h3, styles.sectionTitle]}>
            Status atual
          </Text>
          
          <View style={styles.statusGrid}>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status.id}
                style={[
                  styles.statusCard,
                  selectedStatus === status.id && styles.statusCardSelected
                ]}
                onPress={() => setSelectedStatus(status.id)}
              >
                <Ionicons 
                  name={status.icon} 
                  size={RESPONSIVE.getIconSize('large')} 
                  color={status.color} 
                />
                <Text style={[FONTS.styles.body1, styles.statusName]}>
                  {status.name}
                </Text>
                <Text style={[FONTS.styles.caption, styles.statusDescription]}>
                  {status.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[FONTS.styles.h3, styles.sectionTitle]}>
            Preferências
          </Text>
          
          {/* Vehicle Types */}
          <View style={styles.preferenceItem}>
            <Text style={[FONTS.styles.body1, styles.preferenceLabel]}>
              Tipos de veículo
            </Text>
            <View style={styles.vehicleTypeContainer}>
              {['Coletivo', 'Taxi Normal', 'Taxi Executivo'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.vehicleTypeChip,
                    tempPreferences.vehicleTypes?.includes(type) && styles.vehicleTypeChipSelected
                  ]}
                  onPress={() => {
                    const currentTypes = tempPreferences.vehicleTypes || [];
                    const newTypes = currentTypes.includes(type)
                      ? currentTypes.filter(t => t !== type)
                      : [...currentTypes, type];
                    
                    setTempPreferences(prev => ({
                      ...prev,
                      vehicleTypes: newTypes
                    }));
                  }}
                >
                  <Text style={[
                    FONTS.styles.caption,
                    styles.vehicleTypeText,
                    tempPreferences.vehicleTypes?.includes(type) && styles.vehicleTypeTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Max Distance */}
          <View style={styles.preferenceItem}>
            <Text style={[FONTS.styles.body1, styles.preferenceLabel]}>
              Distância máxima: {tempPreferences.maxDistance}km
            </Text>
            <View style={styles.distanceSlider}>
              {[5, 10, 15, 20].map((distance) => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.distanceOption,
                    tempPreferences.maxDistance === distance && styles.distanceOptionSelected
                  ]}
                  onPress={() => setTempPreferences(prev => ({
                    ...prev,
                    maxDistance: distance
                  }))}
                >
                  <Text style={[
                    FONTS.styles.caption,
                    styles.distanceText,
                    tempPreferences.maxDistance === distance && styles.distanceTextSelected
                  ]}>
                    {distance}km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Auto Accept */}
          <View style={styles.preferenceItem}>
            <View style={styles.autoAcceptContainer}>
              <View style={styles.autoAcceptInfo}>
                <Text style={[FONTS.styles.body1, styles.preferenceLabel]}>
                  Aceitar automaticamente
                </Text>
                <Text style={[FONTS.styles.caption, styles.autoAcceptDescription]}>
                  Aceita corridas automaticamente dentro das suas preferências
                </Text>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  tempPreferences.autoAccept && styles.toggleSwitchActive
                ]}
                onPress={() => setTempPreferences(prev => ({
                  ...prev,
                  autoAccept: !prev.autoAccept
                }))}
              >
                <View style={[
                  styles.toggleHandle,
                  tempPreferences.autoAccept && styles.toggleHandleActive
                ]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <ResponsiveButton
          title="Salvar configurações"
          variant="primary"
          size="large"
          onPress={handleSave}
          fullWidth
        />
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  // Timer header
  timerHeader: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.xl,
  },
  
  timerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.spacing.md,
  },
  
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.semantic.error,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  
  timerText: {
    color: COLORS.text.inverse,
    fontWeight: '700',
  },
  
  progressRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.semantic.error,
    borderTopColor: 'transparent',
  },
  
  timerLabel: {
    color: COLORS.text.light,
    textAlign: 'center',
  },

  // Passenger card
  passengerCard: {
    marginBottom: SIZES.spacing.lg,
  },
  
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.md,
  },
  
  passengerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  passengerInfo: {
    flex: 1,
  },
  
  passengerName: {
    marginBottom: SIZES.spacing.xs,
  },
  
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.xs,
  },
  
  ratingText: {
    marginLeft: SIZES.spacing.sm,
    color: COLORS.text.light,
  },
  
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.semantic.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Trip card
  tripCard: {
    marginBottom: SIZES.spacing.lg,
  },
  
  sectionTitle: {
    marginBottom: SIZES.spacing.lg,
  },
  
  routeInfo: {
    position: 'relative',
    marginBottom: SIZES.spacing.lg,
  },
  
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SIZES.spacing.md,
    gap: SIZES.spacing.md,
  },
  
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  
  originDot: {
    backgroundColor: COLORS.semantic.success,
  },
  
  destinationDot: {
    backgroundColor: COLORS.semantic.error,
  },
  
  routeLine: {
    position: 'absolute',
    left: 5,
    top: 35,
    bottom: 35,
    width: 2,
    backgroundColor: COLORS.border,
  },
  
  routeDetails: {
    flex: 1,
  },
  
  pointLabel: {
    color: COLORS.text.light,
    marginBottom: SIZES.spacing.xs,
    fontWeight: '600',
  },
  
  pointText: {
    color: COLORS.text.primary,
  },
  
  distanceText: {
    color: COLORS.text.light,
    marginTop: 4,
  },
  
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SIZES.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.xs,
  },
  
  statText: {
    color: COLORS.text.light,
  },

  // Earnings card
  earningsCard: {
    marginBottom: SIZES.spacing.lg,
  },
  
  earningsHeader: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  
  earningsTitle: {
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.sm,
  },
  
  earningsAmount: {
    color: COLORS.semantic.success,
    fontWeight: '700',
  },
  
  earningsBreakdown: {
    gap: SIZES.spacing.md,
  },
  
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  earningsLabel: {
    color: COLORS.text.secondary,
  },
  
  earningsValue: {
    fontWeight: '600',
  },

  // Action buttons
  actionContainer: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
    paddingTop: SIZES.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  declineButton: {
    flex: 1,
  },
  
  acceptButton: {
    flex: 2,
  },

  // Status modal styles
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: SIZES.spacing.xl,
  },
  
  section: {
    marginBottom: SIZES.spacing.xl,
  },
  
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.spacing.md,
  },
  
  statusCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
    borderRadius: SIZES.radius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface.card,
    gap: SIZES.spacing.sm,
  },
  
  statusCardSelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  
  statusName: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  statusDescription: {
    color: COLORS.text.light,
    textAlign: 'center',
  },
  
  preferenceItem: {
    marginBottom: SIZES.spacing.lg,
  },
  
  preferenceLabel: {
    fontWeight: '600',
    marginBottom: SIZES.spacing.md,
  },
  
  vehicleTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.spacing.sm,
  },
  
  vehicleTypeChip: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface.card,
  },
  
  vehicleTypeChipSelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  
  vehicleTypeText: {
    color: COLORS.text.secondary,
  },
  
  vehicleTypeTextSelected: {
    color: COLORS.primary[700],
    fontWeight: '600',
  },
  
  distanceSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.spacing.sm,
  },
  
  distanceOption: {
    flex: 1,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface.card,
    alignItems: 'center',
  },
  
  distanceOptionSelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  
  distanceText: {
    color: COLORS.text.secondary,
  },
  
  distanceTextSelected: {
    color: COLORS.primary[700],
    fontWeight: '600',
  },
  
  autoAcceptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.md,
  },
  
  autoAcceptInfo: {
    flex: 1,
  },
  
  autoAcceptDescription: {
    color: COLORS.text.light,
    marginTop: SIZES.spacing.xs,
  },
  
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    padding: 2,
    justifyContent: 'center',
  },
  
  toggleSwitchActive: {
    backgroundColor: COLORS.primary[500],
  },
  
  toggleHandle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surface.card,
    position: 'absolute',
    left: 2,
  },
  
  toggleHandleActive: {
    left: 22,
  },
  
  saveContainer: {
    paddingTop: SIZES.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export { DriverRequestModal, DriverStatusModal };

export default {
  DriverRequestModal,
  DriverStatusModal,
};