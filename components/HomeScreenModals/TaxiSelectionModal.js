import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '../BaseModal/ModalVariants';
import { ResponsiveButton, ResponsiveCard } from '../ResponsiveUI';
import { useResponsive, useNotification } from '../../contexts/UIContext';
import { COLORS, SIZES, FONTS, SHADOWS, RESPONSIVE } from '../../config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * TaxiSelectionModal - Enhanced taxi type selection with visual cards and pricing
 */
export const TaxiSelectionModal = ({
  visible,
  onClose,
  onTaxiSelect,
  origin,
  destination,
  distance = 0,
  estimatedTime = 0,
}) => {
  const [selectedTaxi, setSelectedTaxi] = useState(null);
  const { isSmallScreen, getSize } = useResponsive();
  const { showNotification } = useNotification();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Mock taxi types with Angolan context
  const taxiTypes = [
    {
      id: 'coletivo',
      name: 'Coletivo',
      description: 'Rota compartilhada, mais econômico',
      icon: '🚐',
      basePrice: 300,
      pricePerKm: 50,
      capacity: '14 passageiros',
      estimatedWait: '3-8 min',
      features: ['Rota fixa', 'Mais barato', 'Ecológico'],
      color: COLORS.semantic.success,
      available: true,
    },
    {
      id: 'taxi_normal',
      name: 'Taxi Normal',
      description: 'Viagem individual, conforto padrão',
      icon: '🚗',
      basePrice: 800,
      pricePerKm: 120,
      capacity: '4 passageiros',
      estimatedWait: '5-12 min',
      features: ['Direto ao destino', 'Confortável', 'Flexível'],
      color: COLORS.primary[500],
      available: true,
    },
    {
      id: 'taxi_executivo',
      name: 'Taxi Executivo',
      description: 'Veículo premium, máximo conforto',
      icon: '🚙',
      basePrice: 1500,
      pricePerKm: 200,
      capacity: '4 passageiros',
      estimatedWait: '8-15 min',
      features: ['Veículo premium', 'Ar condicionado', 'WiFi'],
      color: COLORS.text.primary,
      available: false, // Temporarily unavailable
    },
  ];

  const calculatePrice = (taxiType) => {
    const basePrice = taxiType.basePrice;
    const distancePrice = distance * taxiType.pricePerKm;
    return Math.round(basePrice + distancePrice);
  };

  const formatPrice = (price) => {
    return `${price.toLocaleString()} Kz`;
  };

  const handleTaxiSelect = (taxiType) => {
    if (!taxiType.available) {
      showNotification({
        type: 'warning',
        title: 'Serviço indisponível',
        message: `${taxiType.name} não está disponível no momento`,
      });
      return;
    }

    setSelectedTaxi(taxiType.id);
    
    // Animate selection
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      onTaxiSelect?.({
        ...taxiType,
        estimatedPrice: calculatePrice(taxiType),
        distance,
        estimatedTime,
      });
      onClose();
    }, 200);
  };

  const renderTaxiCard = (taxiType) => {
    const isSelected = selectedTaxi === taxiType.id;
    const price = calculatePrice(taxiType);
    
    return (
      <Animated.View
        key={taxiType.id}
        style={[
          styles.taxiCard,
          {
            transform: [{ scale: isSelected ? scaleAnim : 1 }],
            opacity: taxiType.available ? 1 : 0.6,
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.taxiCardContent,
            isSelected && styles.selectedCard,
            !taxiType.available && styles.unavailableCard,
          ]}
          onPress={() => handleTaxiSelect(taxiType)}
          disabled={!taxiType.available}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.taxiIconContainer}>
              <Text style={styles.taxiIcon}>{taxiType.icon}</Text>
              {!taxiType.available && (
                <View style={styles.unavailableBadge}>
                  <Ionicons name="close" size={12} color={COLORS.text.inverse} />
                </View>
              )}
            </View>
            
            <View style={styles.taxiInfo}>
              <Text style={[FONTS.styles.h3, styles.taxiName]}>{taxiType.name}</Text>
              <Text style={[FONTS.styles.body2, styles.taxiDescription]}>
                {taxiType.description}
              </Text>
            </View>
            
            <View style={styles.priceContainer}>
              <Text style={[FONTS.styles.h3, styles.price]}>{formatPrice(price)}</Text>
              <Text style={[FONTS.styles.caption, styles.estimatedTime]}>
                {taxiType.estimatedWait}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="people" size={16} color={COLORS.text.light} />
              <Text style={[FONTS.styles.caption, styles.detailText]}>
                {taxiType.capacity}
              </Text>
            </View>
            
            {distance > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="location" size={16} color={COLORS.text.light} />
                <Text style={[FONTS.styles.caption, styles.detailText]}>
                  {distance.toFixed(1)}km • {estimatedTime}min
                </Text>
              </View>
            )}
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {taxiType.features.map((feature, index) => (
              <View key={index} style={styles.featureTag}>
                <Text style={[FONTS.styles.caption, styles.featureText]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Selection indicator */}
          {isSelected && (
            <View style={styles.selectionIndicator}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.semantic.success} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Escolher tipo de transporte"
      subtitle={distance > 0 ? `${distance.toFixed(1)}km • ${estimatedTime}min estimado` : ''}
      initialSnapPoint={0.75}
      snapPoints={[0.6, 0.75, 0.9]}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Route info */}
        {origin && destination && (
          <ResponsiveCard style={styles.routeCard} variant="flat" padding="medium">
            <View style={styles.routeInfo}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.originDot]} />
                <Text style={[FONTS.styles.body2, styles.routeText]} numberOfLines={1}>
                  {origin.name || origin.address}
                </Text>
              </View>
              
              <View style={styles.routeLine} />
              
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.destinationDot]} />
                <Text style={[FONTS.styles.body2, styles.routeText]} numberOfLines={1}>
                  {destination.name || destination.address}
                </Text>
              </View>
            </View>
          </ResponsiveCard>
        )}

        {/* Taxi options */}
        <Text style={[FONTS.styles.h3, styles.sectionTitle]}>
          Opções disponíveis
        </Text>
        
        <View style={styles.taxiList}>
          {taxiTypes.map(renderTaxiCard)}
        </View>

        {/* Information footer */}
        <View style={styles.infoFooter}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={16} color={COLORS.text.light} />
            <Text style={[FONTS.styles.caption, styles.infoText]}>
              Preços podem variar conforme tráfego e demanda
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.semantic.success} />
            <Text style={[FONTS.styles.caption, styles.infoText]}>
              Todos os motoristas são verificados
            </Text>
          </View>
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: SIZES.spacing.xl,
  },
  
  // Route card styles
  routeCard: {
    marginBottom: SIZES.spacing.lg,
  },
  
  routeInfo: {
    position: 'relative',
  },
  
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.sm,
    gap: SIZES.spacing.md,
  },
  
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    top: 25,
    bottom: 25,
    width: 2,
    backgroundColor: COLORS.border,
  },
  
  routeText: {
    flex: 1,
    color: COLORS.text.primary,
  },
  
  // Section title
  sectionTitle: {
    marginBottom: SIZES.spacing.lg,
    marginTop: SIZES.spacing.md,
  },
  
  // Taxi list styles
  taxiList: {
    gap: SIZES.spacing.md,
  },
  
  taxiCard: {
    marginBottom: SIZES.spacing.md,
  },
  
  taxiCardContent: {
    backgroundColor: COLORS.surface.card,
    borderRadius: SIZES.radius.large,
    padding: SIZES.spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    ...SHADOWS.medium,
  },
  
  selectedCard: {
    borderColor: COLORS.semantic.success,
    backgroundColor: COLORS.semantic.successLight,
  },
  
  unavailableCard: {
    backgroundColor: COLORS.surface.backgroundSecondary,
  },
  
  // Card header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
    gap: SIZES.spacing.md,
  },
  
  taxiIconContainer: {
    position: 'relative',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  taxiIcon: {
    fontSize: 24,
  },
  
  unavailableBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.semantic.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  taxiInfo: {
    flex: 1,
  },
  
  taxiName: {
    marginBottom: SIZES.spacing.xs,
  },
  
  taxiDescription: {
    color: COLORS.text.secondary,
  },
  
  priceContainer: {
    alignItems: 'flex-end',
  },
  
  price: {
    color: COLORS.semantic.success,
    fontWeight: '700',
  },
  
  estimatedTime: {
    color: COLORS.text.light,
    marginTop: SIZES.spacing.xs,
  },
  
  // Card details
  cardDetails: {
    flexDirection: 'row',
    gap: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
  },
  
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.xs,
  },
  
  detailText: {
    color: COLORS.text.light,
  },
  
  // Features
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.spacing.sm,
  },
  
  featureTag: {
    backgroundColor: COLORS.primary[50],
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.small,
  },
  
  featureText: {
    color: COLORS.primary[700],
    fontWeight: '500',
  },
  
  // Selection indicator
  selectionIndicator: {
    position: 'absolute',
    top: SIZES.spacing.sm,
    right: SIZES.spacing.sm,
  },
  
  // Info footer
  infoFooter: {
    marginTop: SIZES.spacing.xl,
    padding: SIZES.spacing.lg,
    backgroundColor: COLORS.surface.backgroundSecondary,
    borderRadius: SIZES.radius.medium,
    gap: SIZES.spacing.md,
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.sm,
  },
  
  infoText: {
    flex: 1,
    color: COLORS.text.light,
  },
});

export default TaxiSelectionModal;