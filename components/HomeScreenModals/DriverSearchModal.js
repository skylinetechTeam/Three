import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '../BaseModal/ModalVariants';
import { ResponsiveButton } from '../ResponsiveUI';
import { useResponsive, useNotification } from '../../contexts/UIContext';
import { COLORS, SIZES, FONTS, RESPONSIVE } from '../../config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * DriverSearchModal - Live driver search with progress animation and status updates
 */
export const DriverSearchModal = ({
  visible,
  onClose,
  onDriverFound,
  onCancel,
  selectedTaxi,
  estimatedPrice,
  searchTimeRemaining = 30,
}) => {
  const [searchTime, setSearchTime] = useState(0);
  const [searchStatus, setSearchStatus] = useState('searching'); // 'searching', 'found', 'timeout'
  const [driversNearby, setDriversNearby] = useState(3);
  const { isSmallScreen } = useResponsive();
  const { showNotification } = useNotification();
  
  // Get responsive hook functions
  const { getSize, getSpacing, screenSize } = useResponsive();
  
  // Responsive configurations
  const getResponsiveSnapPoints = () => {
    if (isSmallScreen) return [0.4, 0.6];
    if (screenSize === 'tablet') return [0.3, 0.5];
    return [0.5, 0.7];
  };

  const getResponsiveInitialHeight = () => {
    if (isSmallScreen) return 0.45;
    if (screenSize === 'tablet') return 0.35;
    return 0.5;
  };

  const getResponsiveIconSize = () => {
    return getSize({
      small: 60,
      standard: 80,
      large: 100,
      tablet: 120
    });
  };

  // Start search animations when modal opens
  useEffect(() => {
    if (visible) {
      startSearchAnimations();
      startSearchTimer();
    }
  }, [visible]);

  const startSearchAnimations = () => {
    // Pulse animation for the search icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
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

    // Ripple effect animation
    const rippleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    rippleAnimation.start();

    return () => {
      pulseAnimation.stop();
      rippleAnimation.stop();
    };
  };

  const startSearchTimer = () => {
    const timer = setInterval(() => {
      setSearchTime((prevTime) => {
        const newTime = prevTime + 1;
        
        // Update progress animation
        Animated.timing(progressAnim, {
          toValue: newTime / searchTimeRemaining,
          duration: 500,
          useNativeDriver: false,
        }).start();

        // Simulate decreasing drivers nearby
        if (newTime % 5 === 0 && driversNearby > 1) {
          setDriversNearby(prev => Math.max(1, prev - 1));
        }

        // Check if search time is over
        if (newTime >= searchTimeRemaining) {
          clearInterval(timer);
          simulateDriverFound();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  const simulateDriverFound = () => {
    // 90% chance of finding a driver
    const found = Math.random() > 0.1;
    
    if (found) {
      setSearchStatus('found');
      showNotification({
        type: 'success',
        title: 'Motorista encontrado!',
        message: 'Motorista a caminho da sua localização',
      });
      
      // Mock driver data
      const driverData = {
        id: 'driver_123',
        name: 'João Silva',
        rating: 4.8,
        vehicle: {
          make: 'Toyota',
          model: 'Corolla',
          color: 'Branco',
          plate: 'LD-123-AB',
        },
        location: {
          lat: -8.8390,
          lng: 13.2894,
        },
        estimatedArrival: 8,
        photo: null, // Would contain driver photo URL
      };
      
      setTimeout(() => {
        onDriverFound?.(driverData);
      }, 2000);
    } else {
      setSearchStatus('timeout');
      showNotification({
        type: 'warning',
        title: 'Nenhum motorista encontrado',
        message: 'Tente novamente em alguns minutos',
      });
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSearchMessage = () => {
    switch (searchStatus) {
      case 'searching':
        return `Procurando ${selectedTaxi?.name?.toLowerCase()} próximo...`;
      case 'found':
        return 'Motorista encontrado!';
      case 'timeout':
        return 'Nenhum motorista disponível no momento';
      default:
        return 'Procurando motorista...';
    }
  };

  const getStatusIcon = () => {
    switch (searchStatus) {
      case 'searching':
        return (
          <Animated.View style={[
            styles.searchIconContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <MaterialIcons 
              name="local-taxi" 
              size={RESPONSIVE.getIconSize('xl')} 
              color={COLORS.primary[500]} 
            />
            
            {/* Ripple effects */}
            {[1, 2, 3].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.ripple,
                  {
                    opacity: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 0],
                    }),
                    transform: [
                      {
                        scale: rippleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2 + index * 0.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>
        );
        
      case 'found':
        return (
          <View style={styles.successIconContainer}>
            <Ionicons 
              name="checkmark-circle" 
              size={RESPONSIVE.getIconSize('xl')} 
              color={COLORS.semantic.success} 
            />
          </View>
        );
        
      case 'timeout':
        return (
          <View style={styles.errorIconContainer}>
            <Ionicons 
              name="alert-circle" 
              size={RESPONSIVE.getIconSize('xl')} 
              color={COLORS.semantic.warning} 
            />
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={searchStatus !== 'searching' ? onClose : undefined}
      title="Buscando motorista"
      enableGestures={searchStatus !== 'searching'}
      enableBackdropDismiss={searchStatus !== 'searching'}
      initialSnapPoint={getResponsiveInitialHeight()}
      snapPoints={getResponsiveSnapPoints()}
    >
      <View style={[
        styles.content,
        { padding: getSpacing(SIZES.spacing.lg) }
      ]}>
        {/* Status Icon */}
        <View style={[
          styles.iconSection,
          { marginBottom: getSpacing(SIZES.spacing.xl) }
        ]}>
          {getStatusIcon()}
        </View>

        {/* Status Message */}
        <Text style={[FONTS.styles.h3, styles.statusMessage]}>
          {getSearchMessage()}
        </Text>

        {/* Progress Information */}
        {searchStatus === 'searching' && (
          <>
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <Animated.View style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]} />
              </View>
              
              <Text style={[FONTS.styles.body2, styles.timeText]}>
                {formatTime(searchTimeRemaining - searchTime)} restantes
              </Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons 
                  name="people" 
                  size={RESPONSIVE.getIconSize('medium')} 
                  color={COLORS.text.light} 
                />
                <Text style={[FONTS.styles.body2, styles.infoText]}>
                  {driversNearby} motoristas próximos
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <MaterialIcons 
                  name="local-taxi" 
                  size={RESPONSIVE.getIconSize('medium')} 
                  color={COLORS.text.light} 
                />
                <Text style={[FONTS.styles.body2, styles.infoText]}>
                  {selectedTaxi?.name}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons 
                  name="card" 
                  size={RESPONSIVE.getIconSize('medium')} 
                  color={COLORS.text.light} 
                />
                <Text style={[FONTS.styles.body2, styles.infoText]}>
                  {estimatedPrice?.toLocaleString()} Kz
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Success Message */}
        {searchStatus === 'found' && (
          <View style={styles.successSection}>
            <Text style={[FONTS.styles.body1, styles.successText]}>
              Seu motorista foi encontrado e está a caminho!
            </Text>
            
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary[500]} />
              <Text style={[FONTS.styles.body2, styles.loadingText]}>
                Carregando detalhes do motorista...
              </Text>
            </View>
          </View>
        )}

        {/* Timeout Message */}
        {searchStatus === 'timeout' && (
          <View style={styles.timeoutSection}>
            <Text style={[FONTS.styles.body1, styles.timeoutText]}>
              Não encontramos motoristas disponíveis no momento.
            </Text>
            
            <Text style={[FONTS.styles.body2, styles.suggestionText]}>
              Tente novamente em alguns minutos ou escolha outro tipo de veículo.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {searchStatus === 'searching' && (
            <ResponsiveButton
              title="Cancelar busca"
              variant="secondary"
              size="large"
              onPress={handleCancel}
              fullWidth
            />
          )}
          
          {searchStatus === 'timeout' && (
            <>
              <ResponsiveButton
                title="Tentar novamente"
                variant="primary"
                size="large"
                onPress={() => {
                  setSearchStatus('searching');
                  setSearchTime(0);
                  setDriversNearby(3);
                  progressAnim.setValue(0);
                  startSearchAnimations();
                  startSearchTimer();
                }}
                style={styles.retryButton}
              />
              
              <ResponsiveButton
                title="Voltar"
                variant="ghost"
                size="large"
                onPress={onClose}
                style={styles.backButton}
              />
            </>
          )}
        </View>
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    padding: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
  },
  
  iconSection: {
    alignItems: 'center',
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.xl),
  },
  
  searchIconContainer: {
    width: RESPONSIVE.getDynamicSpacing(100),
    height: RESPONSIVE.getDynamicSpacing(100),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  
  ripple: {
    position: 'absolute',
    width: RESPONSIVE.getDynamicSpacing(100),
    height: RESPONSIVE.getDynamicSpacing(100),
    borderRadius: RESPONSIVE.getDynamicSpacing(50),
    borderWidth: 2,
    borderColor: COLORS.primary[300],
  },
  
  successIconContainer: {
    alignItems: 'center',
  },
  
  errorIconContainer: {
    alignItems: 'center',
  },
  
  statusMessage: {
    textAlign: 'center',
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.xl),
    color: COLORS.text.primary,
  },
  
  progressSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.xl),
  },
  
  progressBar: {
    width: '100%',
    height: RESPONSIVE.getDynamicSpacing(6),
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.md),
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary[500],
    borderRadius: 3,
  },
  
  timeText: {
    color: COLORS.text.light,
  },
  
  infoSection: {
    width: '100%',
    gap: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.xl),
  },
  
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RESPONSIVE.getDynamicSpacing(SIZES.spacing.md),
  },
  
  infoText: {
    color: COLORS.text.secondary,
  },
  
  successSection: {
    alignItems: 'center',
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.xl),
  },
  
  successText: {
    textAlign: 'center',
    color: COLORS.semantic.success,
    fontWeight: '600',
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.lg),
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE.getDynamicSpacing(SIZES.spacing.md),
  },
  
  loadingText: {
    color: COLORS.text.light,
  },
  
  timeoutSection: {
    alignItems: 'center',
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.xl),
  },
  
  timeoutText: {
    textAlign: 'center',
    color: COLORS.semantic.warning,
    fontWeight: '600',
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.md),
  },
  
  suggestionText: {
    textAlign: 'center',
    color: COLORS.text.secondary,
  },
  
  actionSection: {
    width: '100%',
    gap: RESPONSIVE.getDynamicSpacing(SIZES.spacing.md),
    // Responsive button sizing
    minHeight: RESPONSIVE.getButtonHeight(),
  },
  
  retryButton: {
    marginBottom: RESPONSIVE.getDynamicSpacing(SIZES.spacing.sm),
  },
  
  backButton: {
    marginTop: RESPONSIVE.getDynamicSpacing(SIZES.spacing.sm),
  },
});

export default DriverSearchModal;