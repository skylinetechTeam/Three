import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { InteractionManager, LayoutAnimation, Platform } from 'react-native';
import { RESPONSIVE } from '../config/theme';

/**
 * Performance optimization utilities for the Travel app
 */

// Lazy loading component wrapper
export const LazyComponent = ({ children, fallback = null, delay = 0 }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        setIsLoaded(true);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isLoaded ? children : fallback;
};

// Memoized component factory
export const createMemoComponent = (Component, arePropsEqual = null) => {
  return memo(Component, arePropsEqual);
};

// Optimized FlatList renderer
export const OptimizedFlatList = createMemoComponent(({
  data,
  renderItem,
  keyExtractor,
  getItemLayout = null,
  removeClippedSubviews = true,
  maxToRenderPerBatch = 10,
  windowSize = 10,
  initialNumToRender = 10,
  ...props
}) => {
  const FlatList = require('react-native').FlatList;
  
  // Optimize render item
  const optimizedRenderItem = useCallback(({ item, index }) => {
    return React.createElement(LazyComponent, {
      delay: index > initialNumToRender ? 50 : 0,
      children: renderItem({ item, index })
    });
  }, [renderItem, initialNumToRender]);

  // Auto-calculate item layout if possible
  const optimizedGetItemLayout = useMemo(() => {
    if (getItemLayout) return getItemLayout;
    
    // Simple layout calculation for uniform items
    const itemHeight = RESPONSIVE.getDynamicSize({ small: 60, standard: 70, large: 80, tablet: 90 });
    return (data, index) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [getItemLayout]);

  return React.createElement(FlatList, {
    data,
    renderItem: optimizedRenderItem,
    keyExtractor,
    getItemLayout: optimizedGetItemLayout,
    removeClippedSubviews,
    maxToRenderPerBatch,
    windowSize,
    initialNumToRender,
    ...props
  });
});

// Image optimization component
export const OptimizedImage = createMemoComponent(({
  source,
  style,
  resizeMode = 'cover',
  fadeDuration = 300,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const Image = require('react-native').Image;

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return null; // Or return a placeholder
  }

  return React.createElement(Image, {
    source,
    style: [style, { opacity: isLoaded ? 1 : 0 }],
    resizeMode,
    fadeDuration,
    onLoad: handleLoad,
    onError: handleError,
    ...props
  });
});

// Animation optimization utilities
export class AnimationOptimizer {
  static shouldReduceMotion = false;
  static isLowEndDevice = false;

  static initialize() {
    // Detect device performance characteristics
    this.isLowEndDevice = this.detectLowEndDevice();
    
    // Check if user prefers reduced motion
    // In a real app, this would check system preferences
    this.shouldReduceMotion = false;
  }

  static detectLowEndDevice() {
    // Simple heuristic - in a real app, use more sophisticated detection
    const screenSize = RESPONSIVE.getScreenSize();
    return screenSize === 'small';
  }

  static getOptimizedDuration(duration) {
    if (this.shouldReduceMotion) return 0;
    if (this.isLowEndDevice) return Math.max(duration * 0.7, 150);
    return duration;
  }

  static createOptimizedLayoutAnimation(type = 'easeInEaseOut') {
    if (this.shouldReduceMotion) return;

    const config = {
      duration: this.getOptimizedDuration(300),
      type: LayoutAnimation.Types[type] || LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    };

    if (Platform.OS === 'android') {
      LayoutAnimation.configureNext({
        duration: config.duration,
        create: config,
        update: config,
        delete: config,
      });
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }
}

// Memory management utilities
export class MemoryManager {
  static cache = new Map();
  static maxCacheSize = 50;
  static cacheCleanupInterval = null;

  static initialize() {
    // Start periodic cleanup
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupCache();
    }, 60000); // Clean every minute
  }

  static cleanup() {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    this.cache.clear();
  }

  static cleanupCache() {
    if (this.cache.size > this.maxCacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  static set(key, value, ttl = 300000) { // Default 5 minutes TTL
    const expiryTime = Date.now() + ttl;
    this.cache.set(key, { value, expiryTime });
    this.cleanupCache();
  }

  static get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiryTime) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  static has(key) {
    return this.get(key) !== null;
  }

  static remove(key) {
    this.cache.delete(key);
  }
}

// Debounce utility for performance
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle utility
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

// Virtual list component for large datasets
export const VirtualizedList = createMemoComponent(({
  data,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 3,
  ...props
}) => {
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const ScrollView = require('react-native').ScrollView;

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollOffset / itemHeight) - overscan);
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((scrollOffset + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollOffset, itemHeight, containerHeight, data.length, overscan]);

  const visibleItems = useMemo(() => {
    return data.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [data, visibleRange]);

  const handleScroll = useThrottle((event) => {
    setScrollOffset(event.nativeEvent.contentOffset.y);
  }, 16); // ~60fps

  return React.createElement(ScrollView, {
    style: { height: containerHeight },
    contentContainerStyle: { height: data.length * itemHeight },
    onScroll: handleScroll,
    scrollEventThrottle: 16,
    ...props,
    children: [
      // Spacer for items before visible range
      React.createElement('div', {
        key: 'spacer-top',
        style: { height: visibleRange.startIndex * itemHeight }
      }),
      // Visible items
      ...visibleItems.map((item, index) =>
        renderItem({
          item,
          index: visibleRange.startIndex + index
        })
      ),
      // Spacer for items after visible range
      React.createElement('div', {
        key: 'spacer-bottom',
        style: { height: (data.length - visibleRange.endIndex - 1) * itemHeight }
      })
    ]
  });
});

// Component lifecycle optimizer
export const useOptimizedEffect = (effect, deps, options = {}) => {
  const { 
    skipMount = false,
    skipUnmount = false,
    delay = 0 
  } = options;

  const isFirstRun = useRef(true);

  useEffect(() => {
    if (skipMount && isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    let cleanup;
    const timer = setTimeout(() => {
      cleanup = effect();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (cleanup && !skipUnmount) {
        cleanup();
      }
    };
  }, deps);
};

// Bundle size optimizer - dynamic imports
export const importComponent = (importFunc) => {
  return React.lazy(() => 
    importFunc().then(module => ({
      default: module.default || module
    }))
  );
};

// Performance monitoring
export class PerformanceMonitor {
  static metrics = new Map();

  static startTimer(name) {
    this.metrics.set(name, Date.now());
  }

  static endTimer(name) {
    const startTime = this.metrics.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`Performance: ${name} took ${duration}ms`);
      this.metrics.delete(name);
      return duration;
    }
    return 0;
  }

  static measureComponent(WrappedComponent, name) {
    return memo((props) => {
      useEffect(() => {
        PerformanceMonitor.startTimer(`${name}_render`);
        return () => {
          PerformanceMonitor.endTimer(`${name}_render`);
        };
      });

      return React.createElement(WrappedComponent, props);
    });
  }
}

// Initialize optimizations
AnimationOptimizer.initialize();
MemoryManager.initialize();

export default {
  LazyComponent,
  createMemoComponent,
  OptimizedFlatList,
  OptimizedImage,
  AnimationOptimizer,
  MemoryManager,
  useDebounce,
  useThrottle,
  VirtualizedList,
  useOptimizedEffect,
  importComponent,
  PerformanceMonitor,
};