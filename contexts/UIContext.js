import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Dimensions, Appearance } from 'react-native';
import { RESPONSIVE, COLORS } from '../config/theme';

// Initial state
const initialState = {
  // Screen dimensions and orientation
  screenSize: RESPONSIVE.getScreenSize(),
  screenWidth: Dimensions.get('window').width,
  screenHeight: Dimensions.get('window').height,
  isLandscape: Dimensions.get('window').width > Dimensions.get('window').height,
  
  // Theme and appearance
  colorScheme: Appearance.getColorScheme() || 'light',
  isHighContrast: false,
  fontScale: RESPONSIVE.getFontScale(),
  
  // Modal state
  activeModals: [],
  modalZIndex: 1000,
  
  // Accessibility
  isScreenReaderEnabled: false,
  reduceMotion: false,
  
  // Loading states
  globalLoading: false,
  loadingMessage: '',
  
  // Notifications
  notifications: [],
  
  // Keyboard
  keyboardHeight: 0,
  isKeyboardVisible: false,
  
  // Network status
  isConnected: true,
  networkType: 'wifi',
};

// Action types
const UI_ACTIONS = {
  SET_SCREEN_SIZE: 'SET_SCREEN_SIZE',
  SET_ORIENTATION: 'SET_ORIENTATION',
  SET_COLOR_SCHEME: 'SET_COLOR_SCHEME',
  SET_HIGH_CONTRAST: 'SET_HIGH_CONTRAST',
  SET_FONT_SCALE: 'SET_FONT_SCALE',
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  CLOSE_ALL_MODALS: 'CLOSE_ALL_MODALS',
  SET_ACCESSIBILITY: 'SET_ACCESSIBILITY',
  SET_GLOBAL_LOADING: 'SET_GLOBAL_LOADING',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_KEYBOARD_STATE: 'SET_KEYBOARD_STATE',
  SET_NETWORK_STATUS: 'SET_NETWORK_STATUS',
};

// Reducer
const uiReducer = (state, action) => {
  switch (action.type) {
    case UI_ACTIONS.SET_SCREEN_SIZE:
      return {
        ...state,
        screenSize: action.payload.screenSize,
        screenWidth: action.payload.width,
        screenHeight: action.payload.height,
        isLandscape: action.payload.width > action.payload.height,
      };
      
    case UI_ACTIONS.SET_ORIENTATION:
      return {
        ...state,
        isLandscape: action.payload,
      };
      
    case UI_ACTIONS.SET_COLOR_SCHEME:
      return {
        ...state,
        colorScheme: action.payload,
      };
      
    case UI_ACTIONS.SET_HIGH_CONTRAST:
      return {
        ...state,
        isHighContrast: action.payload,
      };
      
    case UI_ACTIONS.SET_FONT_SCALE:
      return {
        ...state,
        fontScale: action.payload,
      };
      
    case UI_ACTIONS.OPEN_MODAL:
      return {
        ...state,
        activeModals: [...state.activeModals, {
          id: action.payload.id,
          component: action.payload.component,
          props: action.payload.props,
          zIndex: state.modalZIndex + state.activeModals.length,
        }],
      };
      
    case UI_ACTIONS.CLOSE_MODAL:
      return {
        ...state,
        activeModals: state.activeModals.filter(modal => modal.id !== action.payload),
      };
      
    case UI_ACTIONS.CLOSE_ALL_MODALS:
      return {
        ...state,
        activeModals: [],
      };
      
    case UI_ACTIONS.SET_ACCESSIBILITY:
      return {
        ...state,
        isScreenReaderEnabled: action.payload.screenReader ?? state.isScreenReaderEnabled,
        reduceMotion: action.payload.reduceMotion ?? state.reduceMotion,
      };
      
    case UI_ACTIONS.SET_GLOBAL_LOADING:
      return {
        ...state,
        globalLoading: action.payload.loading,
        loadingMessage: action.payload.message || '',
      };
      
    case UI_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, {
          id: action.payload.id || Date.now().toString(),
          type: action.payload.type || 'info',
          title: action.payload.title,
          message: action.payload.message,
          duration: action.payload.duration || 5000,
          timestamp: Date.now(),
        }],
      };
      
    case UI_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
      };
      
    case UI_ACTIONS.SET_KEYBOARD_STATE:
      return {
        ...state,
        keyboardHeight: action.payload.height,
        isKeyboardVisible: action.payload.visible,
      };
      
    case UI_ACTIONS.SET_NETWORK_STATUS:
      return {
        ...state,
        isConnected: action.payload.isConnected,
        networkType: action.payload.networkType || state.networkType,
      };
      
    default:
      return state;
  }
};

// Create context
const UIContext = createContext({
  state: initialState,
  dispatch: () => {},
  actions: {},
});

// Context provider
export const UIProvider = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  // Screen dimension change listener
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const screenSize = window.width < 360 ? 'small' :
                        window.width < 414 ? 'standard' :
                        window.width < 768 ? 'large' : 'tablet';
      
      dispatch({
        type: UI_ACTIONS.SET_SCREEN_SIZE,
        payload: {
          screenSize,
          width: window.width,
          height: window.height,
        },
      });
    });

    return () => subscription?.remove();
  }, []);

  // Color scheme change listener
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      dispatch({
        type: UI_ACTIONS.SET_COLOR_SCHEME,
        payload: colorScheme,
      });
    });

    return () => subscription?.remove();
  }, []);

  // Action creators
  const actions = {
    // Screen and layout
    updateScreenSize: (dimensions) => {
      dispatch({
        type: UI_ACTIONS.SET_SCREEN_SIZE,
        payload: dimensions,
      });
    },

    setOrientation: (isLandscape) => {
      dispatch({
        type: UI_ACTIONS.SET_ORIENTATION,
        payload: isLandscape,
      });
    },

    // Theme and appearance
    setColorScheme: (scheme) => {
      dispatch({
        type: UI_ACTIONS.SET_COLOR_SCHEME,
        payload: scheme,
      });
    },

    toggleHighContrast: () => {
      dispatch({
        type: UI_ACTIONS.SET_HIGH_CONTRAST,
        payload: !state.isHighContrast,
      });
    },

    setFontScale: (scale) => {
      dispatch({
        type: UI_ACTIONS.SET_FONT_SCALE,
        payload: scale,
      });
    },

    // Modal management
    openModal: (modalData) => {
      const id = modalData.id || `modal_${Date.now()}`;
      dispatch({
        type: UI_ACTIONS.OPEN_MODAL,
        payload: {
          id,
          component: modalData.component,
          props: modalData.props || {},
        },
      });
      return id;
    },

    closeModal: (modalId) => {
      dispatch({
        type: UI_ACTIONS.CLOSE_MODAL,
        payload: modalId,
      });
    },

    closeAllModals: () => {
      dispatch({
        type: UI_ACTIONS.CLOSE_ALL_MODALS,
      });
    },

    // Accessibility
    setAccessibilitySettings: (settings) => {
      dispatch({
        type: UI_ACTIONS.SET_ACCESSIBILITY,
        payload: settings,
      });
    },

    // Loading states
    setGlobalLoading: (loading, message = '') => {
      dispatch({
        type: UI_ACTIONS.SET_GLOBAL_LOADING,
        payload: { loading, message },
      });
    },

    // Notifications
    showNotification: (notification) => {
      const id = actions.addNotification(notification);
      
      // Auto-remove notification after duration
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          actions.removeNotification(id);
        }, notification.duration);
      }
      
      return id;
    },

    addNotification: (notification) => {
      const id = notification.id || `notification_${Date.now()}`;
      dispatch({
        type: UI_ACTIONS.ADD_NOTIFICATION,
        payload: { ...notification, id },
      });
      return id;
    },

    removeNotification: (notificationId) => {
      dispatch({
        type: UI_ACTIONS.REMOVE_NOTIFICATION,
        payload: notificationId,
      });
    },

    // Keyboard
    setKeyboardState: (visible, height = 0) => {
      dispatch({
        type: UI_ACTIONS.SET_KEYBOARD_STATE,
        payload: { visible, height },
      });
    },

    // Network
    setNetworkStatus: (isConnected, networkType) => {
      dispatch({
        type: UI_ACTIONS.SET_NETWORK_STATUS,
        payload: { isConnected, networkType },
      });
    },

    // Utility functions
    getResponsiveSize: (sizes) => {
      return RESPONSIVE.getDynamicSize(sizes);
    },

    getResponsiveSpacing: (base) => {
      return RESPONSIVE.getDynamicSpacing(base);
    },

    isSmallScreen: () => {
      return state.screenSize === 'small';
    },

    isTablet: () => {
      return state.screenSize === 'tablet';
    },

    getAdaptiveColors: () => {
      if (state.isHighContrast) {
        return COLORS.accessibility.highContrast;
      }
      return COLORS;
    },
  };

  const contextValue = {
    state,
    dispatch,
    actions,
    // Computed properties
    isSmallScreen: state.screenSize === 'small',
    isTablet: state.screenSize === 'tablet',
    hasActiveModals: state.activeModals.length > 0,
    hasNotifications: state.notifications.length > 0,
  };

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
};

// Custom hook to use UI context
export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

// Custom hook for responsive design
export const useResponsive = () => {
  const { state, actions } = useUI();
  
  return {
    screenSize: state.screenSize,
    screenWidth: state.screenWidth,
    screenHeight: state.screenHeight,
    isLandscape: state.isLandscape,
    isSmallScreen: state.screenSize === 'small',
    isTablet: state.screenSize === 'tablet',
    getSize: actions.getResponsiveSize,
    getSpacing: actions.getResponsiveSpacing,
    fontScale: state.fontScale,
  };
};

// Custom hook for modal management
export const useModal = () => {
  const { state, actions } = useUI();
  
  return {
    activeModals: state.activeModals,
    hasActiveModals: state.activeModals.length > 0,
    openModal: actions.openModal,
    closeModal: actions.closeModal,
    closeAllModals: actions.closeAllModals,
  };
};

// Custom hook for notifications
export const useNotification = () => {
  const { state, actions } = useUI();
  
  return {
    notifications: state.notifications,
    showNotification: actions.showNotification,
    removeNotification: actions.removeNotification,
    showSuccess: (title, message, duration) => 
      actions.showNotification({ type: 'success', title, message, duration }),
    showError: (title, message, duration) => 
      actions.showNotification({ type: 'error', title, message, duration }),
    showInfo: (title, message, duration) => 
      actions.showNotification({ type: 'info', title, message, duration }),
    showWarning: (title, message, duration) => 
      actions.showNotification({ type: 'warning', title, message, duration }),
  };
};

export default UIContext;