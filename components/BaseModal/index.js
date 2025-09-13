import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Keyboard,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, ANIMATIONS, RESPONSIVE } from '../../config/theme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * BaseModal - Enhanced modal component with gesture support and responsive design
 * 
 * Features:
 * - Responsive height based on content and screen size
 * - Gesture-based interactions (swipe to dismiss, pull indicators)
 * - Keyboard-aware positioning
 * - Accessibility support with proper focus management
 * - Multiple modal variants (bottom sheet, fullscreen, overlay)
 * - Smooth animations with spring physics
 */
const BaseModal = ({
  visible,
  onClose,
  children,
  variant = 'bottomSheet', // 'bottomSheet', 'fullscreen', 'overlay', 'slide'
  height = 'auto',
  enableGestures = true,
  enableBackdropDismiss = true,
  showHandle = true,
  showCloseButton = false,
  animationType = 'slide',
  onShow,
  onDismiss,
  keyboardAvoidingBehavior = 'padding',
  statusBarTranslucent = true,
  customBackdrop,
  snapPoints = [0.25, 0.5, 0.75, 0.9],
  initialSnapPoint = 0.75,
  ...props
}) => {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint);
  const [isDragging, setIsDragging] = useState(false);

  // Animation values
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  // Calculate modal height based on variant and responsive design
  const getModalHeight = () => {
    if (height === 'auto') {
      switch (variant) {
        case 'bottomSheet':
          return SCREEN_HEIGHT * currentSnapPoint;
        case 'fullscreen':
          return SCREEN_HEIGHT - (Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0);
        case 'overlay':
          return RESPONSIVE.getModalHeight() * 0.6;
        case 'slide':
          return RESPONSIVE.getModalHeight();
        default:
          return RESPONSIVE.getModalHeight();
      }
    }
    
    if (typeof height === 'string' && height.includes('%')) {
      return SCREEN_HEIGHT * (parseFloat(height) / 100);
    }
    
    return typeof height === 'number' ? height : RESPONSIVE.getModalHeight();
  };

  const modalHeight = getModalHeight();

  // Pan responder for gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enableGestures && variant === 'bottomSheet',
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return enableGestures && variant === 'bottomSheet' && Math.abs(gestureState.dy) > 5;
      },
      
      onPanResponderGrant: () => {
        setIsDragging(true);
        translateY.setOffset(translateY._value);
        translateY.setValue(0);
      },
      
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) { // Only allow downward swipes
          translateY.setValue(gestureState.dy);
        }
      },
      
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        translateY.flattenOffset();
        
        const { dy, vy } = gestureState;
        const shouldDismiss = dy > modalHeight * 0.3 || vy > 0.5;
        
        if (shouldDismiss) {
          hideModal();
        } else {
          // Snap to nearest snap point
          const targetSnapPoint = findNearestSnapPoint(dy);
          setCurrentSnapPoint(targetSnapPoint);
          
          Animated.spring(translateY, {
            toValue: 0,
            ...ANIMATIONS.spring.snappy,
          }).start();
        }
      },
    })
  ).current;

  // Find nearest snap point based on current position
  const findNearestSnapPoint = (dy) => {
    const currentPosition = (modalHeight + dy) / SCREEN_HEIGHT;
    return snapPoints.reduce((prev, curr) => 
      Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition) ? curr : prev
    );
  };

  // Keyboard event listeners
  useEffect(() => {
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

  // Show modal animation
  const showModal = () => {
    const animations = [];
    
    switch (variant) {
      case 'bottomSheet':
      case 'slide':
        animations.push(
          Animated.spring(translateY, {
            toValue: 0,
            ...ANIMATIONS.spring.modal,
          })
        );
        break;
        
      case 'overlay':
      case 'fullscreen':
        animations.push(
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: ANIMATIONS.timing.modal,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              ...ANIMATIONS.spring.gentle,
            })
          ])
        );
        break;
    }
    
    animations.push(
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIMATIONS.timing.modal,
        useNativeDriver: true,
      })
    );
    
    Animated.parallel(animations).start(() => {
      onShow?.();
    });
  };

  // Hide modal animation
  const hideModal = () => {
    const animations = [];
    
    switch (variant) {
      case 'bottomSheet':
      case 'slide':
        animations.push(
          Animated.timing(translateY, {
            toValue: modalHeight,
            duration: ANIMATIONS.timing.gesture,
            useNativeDriver: true,
          })
        );
        break;
        
      case 'overlay':
      case 'fullscreen':
        animations.push(
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: ANIMATIONS.timing.modal,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 0.9,
              ...ANIMATIONS.spring.gentle,
            })
          ])
        );
        break;
    }
    
    Animated.parallel([
      ...animations,
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATIONS.timing.modal,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose?.();
      onDismiss?.();
    });
  };

  // Effect to handle modal visibility
  useEffect(() => {
    if (visible) {
      showModal();
    } else {
      hideModal();
    }
  }, [visible]);

  // Reset animation values when modal opens
  useEffect(() => {
    if (visible) {
      translateY.setValue(variant === 'bottomSheet' || variant === 'slide' ? modalHeight : 0);
      opacity.setValue(0);
      scale.setValue(variant === 'overlay' || variant === 'fullscreen' ? 0.9 : 1);
    }
  }, [visible, variant, modalHeight]);

  // Handle backdrop press
  const handleBackdropPress = () => {
    if (enableBackdropDismiss && !isDragging) {
      hideModal();
    }
  };

  // Render backdrop
  const renderBackdrop = () => {
    if (customBackdrop) {
      return customBackdrop;
    }
    
    return (
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <TouchableOpacity 
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />
      </Animated.View>
    );
  };

  // Render modal handle
  const renderHandle = () => {
    if (!showHandle || variant !== 'bottomSheet') return null;
    
    return (
      <View style={styles.handleContainer}>
        <View style={[styles.handle, {
          backgroundColor: COLORS.text.light,
          width: RESPONSIVE.getDynamicSize({ small: 32, standard: 40, large: 48, tablet: 56 }),
        }]} />
      </View>
    );
  };

  // Render close button
  const renderCloseButton = () => {
    if (!showCloseButton) return null;
    
    return (
      <TouchableOpacity 
        style={[styles.closeButton, {
          top: insets.top + SIZES.spacing.md,
          right: SIZES.spacing.lg,
        }]}
        onPress={hideModal}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Fechar modal"
        accessibilityRole="button"
      >
        <View style={styles.closeButtonBackground}>
          <Ionicons 
            name="close" 
            size={RESPONSIVE.getIconSize('medium')} 
            color={COLORS.text.primary} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Get container style based on variant
  const getContainerStyle = () => {
    const baseStyle = {
      height: modalHeight,
      maxHeight: SCREEN_HEIGHT - (keyboardHeight || 0) - insets.top,
      paddingBottom: Math.max(insets.bottom, SIZES.spacing.md),
    };

    switch (variant) {
      case 'bottomSheet':
        return [
          styles.bottomSheetContainer,
          baseStyle,
          {
            transform: [{ translateY }],
          }
        ];
        
      case 'fullscreen':
        return [
          styles.fullscreenContainer,
          {
            height: SCREEN_HEIGHT,
            paddingTop: insets.top,
            transform: [{ scale }],
          }
        ];
        
      case 'overlay':
        return [
          styles.overlayContainer,
          baseStyle,
          {
            transform: [{ scale }],
          }
        ];
        
      case 'slide':
        return [
          styles.slideContainer,
          baseStyle,
          {
            transform: [{ translateY }],
          }
        ];
        
      default:
        return [styles.bottomSheetContainer, baseStyle];
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent={statusBarTranslucent}
      onRequestClose={hideModal}
      onShow={onShow}
      onDismiss={onDismiss}
      {...props}
    >
      <View style={styles.modalOverlay}>
        {renderBackdrop()}
        
        <Animated.View
          style={getContainerStyle()}
          {...(enableGestures && variant === 'bottomSheet' ? panResponder.panHandlers : {})}
        >
          {renderHandle()}
          {renderCloseButton()}
          
          <View style={[styles.content, {
            paddingHorizontal: SIZES.spacing.lg,
            paddingTop: showHandle ? SIZES.spacing.sm : SIZES.spacing.lg,
          }]}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface.overlay,
  },
  
  backdropTouchable: {
    flex: 1,
  },
  
  bottomSheetContainer: {
    backgroundColor: COLORS.surface.modal,
    borderTopLeftRadius: SIZES.radius.large,
    borderTopRightRadius: SIZES.radius.large,
    ...SHADOWS.modal,
  },
  
  fullscreenContainer: {
    backgroundColor: COLORS.surface.modal,
    borderRadius: 0,
  },
  
  overlayContainer: {
    backgroundColor: COLORS.surface.modal,
    borderRadius: SIZES.radius.large,
    marginHorizontal: SIZES.spacing.lg,
    marginVertical: 'auto',
    ...SHADOWS.modal,
  },
  
  slideContainer: {
    backgroundColor: COLORS.surface.modal,
    borderTopLeftRadius: SIZES.radius.large,
    borderTopRightRadius: SIZES.radius.large,
    ...SHADOWS.modal,
  },
  
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
  },
  
  handle: {
    height: 4,
    borderRadius: 2,
  },
  
  closeButton: {
    position: 'absolute',
    zIndex: 10,
  },
  
  closeButtonBackground: {
    backgroundColor: COLORS.surface.background,
    borderRadius: SIZES.radius.round,
    padding: SIZES.spacing.sm,
    ...SHADOWS.small,
  },
  
  content: {
    flex: 1,
  },
});

export default BaseModal;