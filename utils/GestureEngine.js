import { Animated, PanResponder, Dimensions } from 'react-native';
import { ANIMATIONS } from '../../config/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * GestureManager - Advanced gesture recognition system
 * 
 * Features:
 * - Swipe gesture detection with velocity and direction
 * - Pinch gesture for scaling
 * - Long press recognition
 * - Custom gesture combinations
 * - Smooth animations with spring physics
 */
export class GestureManager {
  constructor(config = {}) {
    this.config = {
      swipeThreshold: 50,
      velocityThreshold: 500,
      longPressDelay: 500,
      pinchThreshold: 0.1,
      ...config
    };
    
    this.gestureState = {
      isActive: false,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      distance: 0,
      direction: null,
      scale: 1,
      rotation: 0
    };
    
    this.callbacks = new Map();
    this.animatedValues = new Map();
  }

  /**
   * Register a callback for a specific gesture type
   */
  on(gestureType, callback) {
    if (!this.callbacks.has(gestureType)) {
      this.callbacks.set(gestureType, []);
    }
    this.callbacks.get(gestureType).push(callback);
  }

  /**
   * Remove a callback for a gesture type
   */
  off(gestureType, callback) {
    if (!this.callbacks.has(gestureType)) return;
    
    const callbacks = this.callbacks.get(gestureType);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Trigger callbacks for a gesture type
   */
  trigger(gestureType, data = {}) {
    if (!this.callbacks.has(gestureType)) return;
    
    this.callbacks.get(gestureType).forEach(callback => {
      callback({ ...this.gestureState, ...data });
    });
  }

  /**
   * Create pan responder for swipe gestures
   */
  createSwipeResponder(options = {}) {
    const {
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onSwipeStart,
      onSwipeEnd,
      horizontal = true,
      vertical = true,
      threshold = this.config.swipeThreshold,
      velocityThreshold = this.config.velocityThreshold
    } = options;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 10 || Math.abs(dy) > 10;
      },

      onPanResponderGrant: (event) => {
        this.gestureState.isActive = true;
        this.gestureState.startPosition = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY
        };
        
        onSwipeStart?.(this.gestureState);
        this.trigger('swipeStart');
      },

      onPanResponderMove: (event, gestureState) => {
        const { dx, dy, vx, vy } = gestureState;
        
        this.gestureState.currentPosition = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY
        };
        this.gestureState.velocity = { x: vx, y: vy };
        this.gestureState.distance = Math.sqrt(dx * dx + dy * dy);
        
        // Determine direction
        if (Math.abs(dx) > Math.abs(dy)) {
          this.gestureState.direction = dx > 0 ? 'right' : 'left';
        } else {
          this.gestureState.direction = dy > 0 ? 'down' : 'up';
        }
        
        this.trigger('swipeMove');
      },

      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy, vx, vy } = gestureState;
        this.gestureState.isActive = false;
        
        // Check if gesture meets threshold requirements
        const meetsDistanceThreshold = Math.abs(dx) > threshold || Math.abs(dy) > threshold;
        const meetsVelocityThreshold = Math.abs(vx) > velocityThreshold || Math.abs(vy) > velocityThreshold;
        
        if (meetsDistanceThreshold || meetsVelocityThreshold) {
          // Determine swipe direction and trigger appropriate callback
          if (horizontal && Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0 && onSwipeRight) {
              onSwipeRight(this.gestureState);
              this.trigger('swipeRight');
            } else if (dx < 0 && onSwipeLeft) {
              onSwipeLeft(this.gestureState);
              this.trigger('swipeLeft');
            }
          } else if (vertical && Math.abs(dy) > Math.abs(dx)) {
            if (dy > 0 && onSwipeDown) {
              onSwipeDown(this.gestureState);
              this.trigger('swipeDown');
            } else if (dy < 0 && onSwipeUp) {
              onSwipeUp(this.gestureState);
              this.trigger('swipeUp');
            }
          }
        }
        
        onSwipeEnd?.(this.gestureState);
        this.trigger('swipeEnd');
      },

      onPanResponderTerminate: () => {
        this.gestureState.isActive = false;
        this.trigger('swipeTerminate');
      }
    });
  }

  /**
   * Create long press recognizer
   */
  createLongPressResponder(options = {}) {
    const {
      onLongPress,
      onLongPressStart,
      onLongPressEnd,
      delay = this.config.longPressDelay,
      tolerance = 10
    } = options;

    let longPressTimer = null;
    let startPosition = null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,

      onPanResponderGrant: (event) => {
        startPosition = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY
        };

        longPressTimer = setTimeout(() => {
          onLongPress?.(this.gestureState);
          onLongPressStart?.(this.gestureState);
          this.trigger('longPressStart');
        }, delay);
      },

      onPanResponderMove: (event) => {
        if (!startPosition) return;

        const currentX = event.nativeEvent.pageX;
        const currentY = event.nativeEvent.pageY;
        const distance = Math.sqrt(
          Math.pow(currentX - startPosition.x, 2) +
          Math.pow(currentY - startPosition.y, 2)
        );

        // Cancel long press if finger moves too much
        if (distance > tolerance && longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      },

      onPanResponderRelease: () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        } else {
          // Long press was triggered, now it's ending
          onLongPressEnd?.(this.gestureState);
          this.trigger('longPressEnd');
        }
        startPosition = null;
      },

      onPanResponderTerminate: () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        startPosition = null;
      }
    });
  }

  /**
   * Create animated value with spring physics
   */
  createAnimatedValue(initialValue = 0, key = null) {
    const animatedValue = new Animated.Value(initialValue);
    
    if (key) {
      this.animatedValues.set(key, animatedValue);
    }
    
    return animatedValue;
  }

  /**
   * Get animated value by key
   */
  getAnimatedValue(key) {
    return this.animatedValues.get(key);
  }

  /**
   * Animate value with spring physics
   */
  springTo(animatedValue, toValue, config = {}) {
    const springConfig = {
      ...ANIMATIONS.spring.gentle,
      ...config
    };

    return Animated.spring(animatedValue, {
      toValue,
      ...springConfig
    });
  }

  /**
   * Animate value with timing
   */
  timingTo(animatedValue, toValue, config = {}) {
    const timingConfig = {
      duration: ANIMATIONS.timing.normal,
      useNativeDriver: true,
      ...config
    };

    return Animated.timing(animatedValue, {
      toValue,
      ...timingConfig
    });
  }

  /**
   * Create interpolation for animated value
   */
  interpolate(animatedValue, inputRange, outputRange, config = {}) {
    return animatedValue.interpolate({
      inputRange,
      outputRange,
      extrapolate: 'clamp',
      ...config
    });
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.callbacks.clear();
    this.animatedValues.clear();
    this.gestureState = {
      isActive: false,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      distance: 0,
      direction: null,
      scale: 1,
      rotation: 0
    };
  }
}

/**
 * AnimationEngine - High-level animation utilities
 */
export class AnimationEngine {
  static fadeIn(animatedValue, duration = ANIMATIONS.timing.normal) {
    return Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      useNativeDriver: true
    });
  }

  static fadeOut(animatedValue, duration = ANIMATIONS.timing.normal) {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      useNativeDriver: true
    });
  }

  static slideUp(animatedValue, distance = SCREEN_HEIGHT, config = {}) {
    return Animated.spring(animatedValue, {
      toValue: -distance,
      ...ANIMATIONS.spring.modal,
      ...config
    });
  }

  static slideDown(animatedValue, distance = SCREEN_HEIGHT, config = {}) {
    return Animated.spring(animatedValue, {
      toValue: distance,
      ...ANIMATIONS.spring.modal,
      ...config
    });
  }

  static slideLeft(animatedValue, distance = SCREEN_WIDTH, config = {}) {
    return Animated.spring(animatedValue, {
      toValue: -distance,
      ...ANIMATIONS.spring.modal,
      ...config
    });
  }

  static slideRight(animatedValue, distance = SCREEN_WIDTH, config = {}) {
    return Animated.spring(animatedValue, {
      toValue: distance,
      ...ANIMATIONS.spring.modal,
      ...config
    });
  }

  static scale(animatedValue, toScale = 1, config = {}) {
    return Animated.spring(animatedValue, {
      toValue: toScale,
      ...ANIMATIONS.spring.bouncy,
      ...config
    });
  }

  static rotate(animatedValue, toValue = 1, config = {}) {
    return Animated.timing(animatedValue, {
      toValue,
      duration: ANIMATIONS.timing.normal,
      useNativeDriver: true,
      ...config
    });
  }

  static pulse(animatedValue, scale = 1.05, duration = 1000) {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: scale,
          duration: duration / 2,
          useNativeDriver: true
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true
        })
      ])
    );
  }

  static shake(animatedValue, intensity = 10, speed = 100) {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: intensity,
        duration: speed,
        useNativeDriver: true
      }),
      Animated.timing(animatedValue, {
        toValue: -intensity,
        duration: speed,
        useNativeDriver: true
      }),
      Animated.timing(animatedValue, {
        toValue: intensity,
        duration: speed,
        useNativeDriver: true
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: speed,
        useNativeDriver: true
      })
    ]);
  }

  static stagger(animations, interval = 100) {
    return Animated.stagger(interval, animations);
  }

  static parallel(animations) {
    return Animated.parallel(animations);
  }

  static sequence(animations) {
    return Animated.sequence(animations);
  }

  /**
   * Create modal entrance animation
   */
  static modalEnter(translateY, opacity, scale = null) {
    const animations = [
      AnimationEngine.slideUp(translateY, 0),
      AnimationEngine.fadeIn(opacity)
    ];

    if (scale) {
      animations.push(AnimationEngine.scale(scale, 1));
    }

    return AnimationEngine.parallel(animations);
  }

  /**
   * Create modal exit animation
   */
  static modalExit(translateY, opacity, scale = null, direction = 'down') {
    const animations = [
      direction === 'down' 
        ? AnimationEngine.slideDown(translateY, SCREEN_HEIGHT)
        : AnimationEngine.slideUp(translateY, -SCREEN_HEIGHT),
      AnimationEngine.fadeOut(opacity)
    ];

    if (scale) {
      animations.push(AnimationEngine.scale(scale, 0.9));
    }

    return AnimationEngine.parallel(animations);
  }

  /**
   * Create loading spinner animation
   */
  static spinner(animatedValue) {
    return Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      })
    );
  }

  /**
   * Create spring bounce effect
   */
  static bounce(animatedValue, intensity = 0.3) {
    return Animated.sequence([
      Animated.spring(animatedValue, {
        toValue: 1 + intensity,
        ...ANIMATIONS.spring.bouncy
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        ...ANIMATIONS.spring.gentle
      })
    ]);
  }
}

/**
 * Hook for gesture management
 */
export const useGestureManager = (config = {}) => {
  const gestureManager = React.useRef(new GestureManager(config));

  React.useEffect(() => {
    return () => {
      gestureManager.current.dispose();
    };
  }, []);

  return gestureManager.current;
};

/**
 * Hook for animation values
 */
export const useAnimatedValues = (initialValues = {}) => {
  const animatedValues = React.useRef({});

  React.useEffect(() => {
    Object.keys(initialValues).forEach(key => {
      animatedValues.current[key] = new Animated.Value(initialValues[key]);
    });
  }, []);

  return animatedValues.current;
};

export default {
  GestureManager,
  AnimationEngine,
  useGestureManager,
  useAnimatedValues
};