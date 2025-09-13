import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '../BaseModal/ModalVariants';
import { ResponsiveButton, ResponsiveCard } from '../ResponsiveUI';
import { useResponsive, useNotification } from '../../contexts/UIContext';
import { COLORS, SIZES, FONTS, SHADOWS, RESPONSIVE } from '../../config/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * TripConfirmationModal - Final trip confirmation with route preview and pricing breakdown
 */
export const TripConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  onCancel,
  origin,
  destination,
  selectedTaxi,
  estimatedPrice,
  distance,
  estimatedTime,
  routePreview,
  isLoading = false,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Only cash according to requirements
  const { isSmallScreen, getSize, getSpacing, screenSize } = useResponsive();
  const { showNotification } = useNotification();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Responsive configurations
  const getResponsiveSnapPoints = () => {
    if (isSmallScreen) return [0.8, 0.9, 0.95];
    if (screenSize === 'tablet') return [0.6, 0.7, 0.8];
    return [0.7, 0.85, 0.95];
  };

  const getResponsiveInitialHeight = () => {
    if (isSmallScreen) return 0.85;
    if (screenSize === 'tablet') return 0.65;
    return 0.8;
  };

  // Pulse animation for loading state
  useEffect(() => {
    if (isLoading || isConfirming) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
      
      return () => pulseAnimation.stop();
    }
  }, [isLoading, isConfirming, pulseAnim]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    
    try {
      // Show confirmation dialog for cash payment
      Alert.alert(
        'Confirmar viagem',
        `Confirma a solicitação da viagem por ${estimatedPrice.toLocaleString()} Kz? O pagamento será em dinheiro diretamente ao motorista.`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setIsConfirming(false),
          },
          {
            text: 'Confirmar',
            onPress: async () => {
              try {
                await onConfirm?.({
                  origin,
                  destination,
                  selectedTaxi,
                  estimatedPrice,
                  paymentMethod,
                  distance,
                  estimatedTime,
                });
                
                showNotification({
                  type: 'success',
                  title: 'Viagem solicitada',
                  message: 'Procurando motorista disponível...',
                });
              } catch (error) {
                showNotification({
                  type: 'error',
                  title: 'Erro',
                  message: 'Não foi possível solicitar a viagem. Tente novamente.',
                });
              } finally {
                setIsConfirming(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      setIsConfirming(false);
    }
  };

  const formatPrice = (price) => {
    return `${price.toLocaleString()} Kz`;
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  // Calculate price breakdown
  const priceBreakdown = {
    base: selectedTaxi?.basePrice || 0,
    distance: (distance * (selectedTaxi?.pricePerKm || 0)),
    total: estimatedPrice,
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Confirmar viagem"
      subtitle="Revise os detalhes antes de confirmar"
      initialSnapPoint={getResponsiveInitialHeight()}
      snapPoints={getResponsiveSnapPoints()}
      enableGestures={!isConfirming}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: getSpacing(SIZES.spacing.xl) }
        ]}
      >
        {/* Route Information */}
        <ResponsiveCard style={[
          styles.routeCard,
          { marginBottom: getSpacing(SIZES.spacing.lg) }
        ]} variant="elevated" padding="large">
          <Text style={[
            getSize({
              small: FONTS.styles.h4,
              standard: FONTS.styles.h3,
              large: FONTS.styles.h3,
              tablet: FONTS.styles.h2
            }),
            styles.sectionTitle
          ]}>Rota</Text>
          
          <View style={styles.routeInfo}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, styles.originDot]} />
              <View style={styles.routeDetails}>
                <Text style={[FONTS.styles.caption, styles.pointLabel]}>Origem</Text>
                <Text style={[FONTS.styles.body1, styles.pointText]} numberOfLines={2}>
                  {origin?.name || origin?.address}
                </Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, styles.destinationDot]} />
              <View style={styles.routeDetails}>
                <Text style={[FONTS.styles.caption, styles.pointLabel]}>Destino</Text>
                <Text style={[FONTS.styles.body1, styles.pointText]} numberOfLines={2}>
                  {destination?.name || destination?.address}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={[
            styles.routeStats,
            { paddingTop: getSpacing(SIZES.spacing.lg) }
          ]}>
            <View style={styles.statItem}>
              <Ionicons 
                name="location" 
                size={getSize({
                  small: 14,
                  standard: 16,
                  large: 18,
                  tablet: 20
                })} 
                color={COLORS.text.light} 
              />
              <Text style={[FONTS.styles.caption, styles.statText]}>
                {distance?.toFixed(1)} km
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons 
                name="time" 
                size={getSize({
                  small: 14,
                  standard: 16,
                  large: 18,
                  tablet: 20
                })} 
                color={COLORS.text.light} 
              />
              <Text style={[FONTS.styles.caption, styles.statText]}>
                {formatTime(estimatedTime)}
              </Text>
            </View>
          </View>
        </ResponsiveCard>

        {/* Taxi Information */}
        <ResponsiveCard style={styles.taxiCard} variant="elevated" padding="large">
          <Text style={[FONTS.styles.h3, styles.sectionTitle]}>Veículo</Text>
          
          <View style={styles.taxiInfo}>
            <View style={styles.taxiIconContainer}>
              <Text style={styles.taxiIcon}>{selectedTaxi?.icon}</Text>
            </View>
            
            <View style={styles.taxiDetails}>
              <Text style={[FONTS.styles.h3, styles.taxiName]}>
                {selectedTaxi?.name}
              </Text>
              <Text style={[FONTS.styles.body2, styles.taxiDescription]}>
                {selectedTaxi?.description}
              </Text>
              <Text style={[FONTS.styles.caption, styles.taxiCapacity]}>
                {selectedTaxi?.capacity} • {selectedTaxi?.estimatedWait}
              </Text>
            </View>
          </View>
        </ResponsiveCard>

        {/* Price Breakdown */}
        <ResponsiveCard style={styles.priceCard} variant="elevated" padding="large">
          <Text style={[FONTS.styles.h3, styles.sectionTitle]}>Detalhes do preço</Text>
          
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={[FONTS.styles.body2, styles.priceLabel]}>Taxa base</Text>
              <Text style={[FONTS.styles.body2, styles.priceValue]}>
                {formatPrice(priceBreakdown.base)}
              </Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={[FONTS.styles.body2, styles.priceLabel]}>
                Distância ({distance?.toFixed(1)} km)
              </Text>
              <Text style={[FONTS.styles.body2, styles.priceValue]}>
                {formatPrice(priceBreakdown.distance)}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.priceRow}>
              <Text style={[FONTS.styles.h3, styles.totalLabel]}>Total</Text>
              <Text style={[FONTS.styles.h3, styles.totalValue]}>
                {formatPrice(priceBreakdown.total)}
              </Text>
            </View>
          </View>
        </ResponsiveCard>

        {/* Payment Method */}
        <ResponsiveCard style={styles.paymentCard} variant="flat" padding="large">
          <Text style={[FONTS.styles.h3, styles.sectionTitle]}>Forma de pagamento</Text>
          
          <View style={styles.paymentMethod}>
            <View style={styles.paymentIcon}>
              <MaterialIcons name="payments" size={24} color={COLORS.semantic.success} />
            </View>
            
            <View style={styles.paymentDetails}>
              <Text style={[FONTS.styles.body1, styles.paymentName]}>
                Dinheiro
              </Text>
              <Text style={[FONTS.styles.body2, styles.paymentDescription]}>
                Pagamento direto ao motorista
              </Text>
            </View>
            
            <Ionicons name="checkmark-circle" size={20} color={COLORS.semantic.success} />
          </View>
          
          <View style={styles.paymentNote}>
            <Ionicons name="information-circle" size={16} color={COLORS.text.light} />
            <Text style={[FONTS.styles.caption, styles.noteText]}>
              Tenha o valor exato ou próximo para facilitar o troco
            </Text>
          </View>
        </ResponsiveCard>

        {/* Terms and conditions */}
        <View style={styles.termsContainer}>
          <Text style={[FONTS.styles.caption, styles.termsText]}>
            Ao confirmar, você concorda com nossos{' '}
            <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <ResponsiveButton
          title="Cancelar"
          variant="secondary"
          size="large"
          onPress={onCancel || onClose}
          disabled={isConfirming}
          style={styles.cancelButton}
        />
        
        <Animated.View style={[
          styles.confirmButtonContainer,
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <ResponsiveButton
            title={isConfirming ? "Confirmando..." : "Confirmar viagem"}
            variant="primary"
            size="large"
            onPress={handleConfirm}
            loading={isConfirming}
            disabled={isConfirming}
            style={styles.confirmButton}
          />
        </Animated.View>
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.xl),
  },
  
  sectionTitle: {
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
    color: COLORS.text.primary,
  },
  
  // Route card styles
  routeCard: {
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
  },
  
  routeInfo: {
    position: 'relative',
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
  },
  
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: RESPONSIVE.getDynamicSpacing(SIZES.spacing.md),
    gap: RESPONSIVE.getDynamicSpacing(SIZES.spacing.md),
  },
  
  routeDot: {
    width: RESPONSIVE.getDynamicSpacing(12),
    height: RESPONSIVE.getDynamicSpacing(12),
    borderRadius: RESPONSIVE.getDynamicSpacing(6),
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
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.xs),
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  
  pointText: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
  },
  
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE.getDynamicSpacing(SIZES.spacing.sm),
  },
  
  statText: {
    color: COLORS.text.light,
    fontWeight: '500',
  },
  
  // Taxi card styles
  taxiCard: {
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
  },
  
  taxiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
  },
  
  taxiIconContainer: {
    width: RESPONSIVE.getDynamicSpacing(60),
    height: RESPONSIVE.getDynamicSpacing(60),
    borderRadius: RESPONSIVE.getDynamicSpacing(30),
    backgroundColor: COLORS.surface.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  taxiIcon: {
    fontSize: RESPONSIVE.getDynamicSpacing(28),
  },
  
  taxiDetails: {
    flex: 1,
  },
  
  taxiName: {
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.xs),
  },
  
  taxiDescription: {
    color: COLORS.text.secondary,
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.xs),
  },
  
  taxiCapacity: {
    color: COLORS.text.light,
  },
  
  // Price card styles
  priceCard: {
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
  },
  
  priceBreakdown: {
    gap: RESPONSIVE.getDynamicSpacing(SIZES.spacing.md),
  },
  
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  priceLabel: {
    color: COLORS.text.secondary,
  },
  
  priceValue: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: RESPONSIVE.getDynamicSpacing(SIZES.spacing.sm),
  },
  
  totalLabel: {
    color: COLORS.text.primary,
    fontWeight: '700',
  },
  
  totalValue: {
    color: COLORS.semantic.success,
    fontWeight: '700',
  },
  
  // Payment card styles
  paymentCard: {
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
  },
  
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE.getDynamicSpacing(SIZES.spacing.md),
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
  },
  
  paymentIcon: {
    width: RESPONSIVE.getDynamicSpacing(50),
    height: RESPONSIVE.getDynamicSpacing(50),
    borderRadius: RESPONSIVE.getDynamicSpacing(25),
    backgroundColor: COLORS.semantic.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  paymentDetails: {
    flex: 1,
  },
  
  paymentName: {
    fontWeight: '600',
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.xs),
  },
  
  paymentDescription: {
    color: COLORS.text.secondary,
  },
  
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: RESPONSIVE.getDynamicSpacing(SIZES.spacing.sm),
    padding: RESPONSIVE.getDynamicSpacing(SIZES.spacing.md),
    backgroundColor: COLORS.semantic.infoLight,
    borderRadius: SIZES.radius.medium,
  },
  
  noteText: {
    flex: 1,
    color: COLORS.text.light,
    lineHeight: 18,
  },
  
  // Terms styles
  termsContainer: {
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.xl),
    paddingHorizontal: RESPONSIVE.getDynamicSpacing(SIZES.spacing.md),
  },
  
  termsText: {
    color: COLORS.text.light,
    textAlign: 'center',
    lineHeight: 18,
  },
  
  termsLink: {
    color: COLORS.primary[500],
    fontWeight: '500',
  },
  
  // Action buttons
  actionContainer: {
    flexDirection: 'row',
    gap: RESPONSIVE.getDynamicSpacing(SIZES.spacing.md),
    paddingTop: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    // Responsive button sizing
    minHeight: RESPONSIVE.getButtonHeight(),
  },
  
  cancelButton: {
    flex: 1,
  },
  
  confirmButtonContainer: {
    flex: 2,
  },
  
  confirmButton: {
    width: '100%',
  },
});

export default TripConfirmationModal;