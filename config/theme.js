import { Dimensions, Platform, PixelRatio, Easing } from 'react-native';

// Responsive Design System - com leitura dinâmica de dimensões
export const RESPONSIVE = {
  // Ler dimensões sempre atualizadas
  getScreenDimensions: () => {
    return Dimensions.get('window');
  },
  
  getScreenSize: () => {
    const { width } = Dimensions.get('window');
    if (width < 360) return 'small';
    if (width < 414) return 'standard';
    if (width < 768) return 'large';
    return 'tablet';
  },
  
  getDynamicSize: (sizes) => {
    const screenSize = RESPONSIVE.getScreenSize();
    return sizes[screenSize] || sizes.standard || sizes.default;
  },
  
  getDynamicSpacing: (base) => {
    const screenSize = RESPONSIVE.getScreenSize();
    const multiplier = screenSize === 'small' ? 0.8 : 
                     screenSize === 'tablet' ? 1.2 : 1;
    return Math.round(base * multiplier);
  },
  
  getModalHeight: () => {
    const { height } = Dimensions.get('window');
    const screenSize = RESPONSIVE.getScreenSize();
    const heights = {
      small: 0.75,
      standard: 0.80,
      large: 0.70,
      tablet: 0.60
    };
    return height * heights[screenSize];
  },
  
  getButtonHeight: () => {
    const screenSize = RESPONSIVE.getScreenSize();
    const heights = {
      small: 48,
      standard: 55,
      large: 60,
      tablet: 65
    };
    return heights[screenSize];
  },
  
  getIconSize: (size = 'medium') => {
    const screenSize = RESPONSIVE.getScreenSize();
    const sizes = {
      small: { small: 16, medium: 20, large: 24 },
      standard: { small: 18, medium: 24, large: 28 },
      large: { small: 20, medium: 28, large: 32 },
      tablet: { small: 24, medium: 32, large: 36 }
    };
    return sizes[screenSize][size];
  },
  
  getFontScale: () => {
    const fontScale = PixelRatio.getFontScale();
    const screenSize = RESPONSIVE.getScreenSize();
    let scale = 1;
    
    if (screenSize === 'small') scale = 0.9;
    else if (screenSize === 'tablet') scale = 1.1;
    
    return Math.min(scale * fontScale, 1.3); // Cap at 1.3x for readability
  },
  
  isSmallScreen: () => RESPONSIVE.getScreenSize() === 'small',
  isTablet: () => RESPONSIVE.getScreenSize() === 'tablet',
  
  // Device-specific adjustments
  deviceInfo: {
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    pixelRatio: PixelRatio.get(),
    fontScale: PixelRatio.getFontScale()
  }
};

// Enhanced Color System with semantic colors and accessibility
export const COLORS = {
  // Primary brand colors with accessibility variants
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#2563eb', // Main brand color
    600: '#1d4ed8',
    700: '#1e40af',
    800: '#1e3a8a',
    900: '#1e293b'
  },
  
  // Semantic colors for different states
  semantic: {
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fee2e2',
    info: '#3b82f6',
    infoLight: '#dbeafe'
  },
  
  // Surface colors for cards, modals, backgrounds
  surface: {
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    card: '#ffffff',
    cardSecondary: '#f8fafc',
    overlay: 'rgba(0, 0, 0, 0.5)',
    modal: '#ffffff',
    modalDark: 'rgba(0, 0, 0, 0.8)'
  },
  
  // Legacy colors for backward compatibility
  secondary: '#4b5563',
  background: '#ffffff',
  card: '#ffffff',
  white: '#ffffff',
  gray: '#6b7280',
  
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    light: '#9ca3af',
    inverse: '#ffffff',
    disabled: '#d1d5db'
  },
  
  input: {
    background: '#f9fafb',
    backgroundFocused: '#ffffff',
    placeholder: '#9ca3af',
    border: '#e5e7eb',
    borderFocused: '#2563eb'
  },
  
  border: '#e5e7eb',
  notification: '#ef4444',
  success: '#10b981',
  
  map: {
    route: '#2563eb',
    marker: '#2563eb',
    userMarker: '#2563eb'
  },
  
  // Accessibility colors for high contrast mode
  accessibility: {
    focus: '#2563eb',
    highContrast: {
      background: '#000000',
      text: '#ffffff',
      primary: '#0066cc'
    }
  }
};

// Enhanced responsive sizing system
export const SIZES = {
  // Base measurements
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  xlarge: 24,
  xxlarge: 32,
  
  // Screen dimensions - getters dinâmicos
  get width() {
    return Dimensions.get('window').width;
  },
  get height() {
    return Dimensions.get('window').height;
  },
  
  // Responsive radius system
  radius: {
    small: RESPONSIVE.getDynamicSpacing(8),
    medium: RESPONSIVE.getDynamicSpacing(12),
    large: RESPONSIVE.getDynamicSpacing(20),
    xlarge: RESPONSIVE.getDynamicSpacing(24),
    round: 9999
  },
  
  // Legacy radius for backward compatibility
  radiusSmall: 8,
  radiusMedium: 12,
  radiusLarge: 20,
  
  // Responsive spacing system
  spacing: {
    xs: RESPONSIVE.getDynamicSpacing(4),
    sm: RESPONSIVE.getDynamicSpacing(8),
    md: RESPONSIVE.getDynamicSpacing(12),
    lg: RESPONSIVE.getDynamicSpacing(16),
    xl: RESPONSIVE.getDynamicSpacing(24),
    xxl: RESPONSIVE.getDynamicSpacing(32),
    xxxl: RESPONSIVE.getDynamicSpacing(48)
  },
  
  // Legacy padding for backward compatibility
  padding: {
    small: 10,
    medium: 15,
    large: 20,
    xlarge: 30,
  },
  
  // Responsive component heights
  heights: {
    button: RESPONSIVE.getButtonHeight(),
    input: RESPONSIVE.getButtonHeight(),
    touchable: Math.max(44, RESPONSIVE.getButtonHeight()), // iOS accessibility guideline
    modal: RESPONSIVE.getModalHeight(),
    header: RESPONSIVE.getDynamicSpacing(60),
    tabBar: RESPONSIVE.getDynamicSpacing(60)
  },
  
  // Legacy heights for backward compatibility
  buttonHeight: 55,
  inputHeight: 55,
  
  // Responsive icon sizing
  icons: {
    xs: RESPONSIVE.getIconSize('small'),
    sm: RESPONSIVE.getIconSize('medium'),
    md: RESPONSIVE.getIconSize('large'),
    lg: RESPONSIVE.getDynamicSize({ small: 28, standard: 32, large: 36, tablet: 40 }),
    xl: RESPONSIVE.getDynamicSize({ small: 32, standard: 40, large: 48, tablet: 56 })
  },
  
  // Legacy icon sizes for backward compatibility
  iconSmall: 16,
  iconMedium: 20,
  iconLarge: 24,
  
  // Typography scale with responsive font sizing - escala fluida
  typography: {
    // Função helper para escala fluida baseada na largura do viewport
    getFluidSize: (minSize, maxSize, minVw = 360, maxVw = 768) => {
      const { width } = Dimensions.get('window');
      const vw = Math.max(minVw, Math.min(width, maxVw));
      const scale = (vw - minVw) / (maxVw - minVw);
      return Math.round(minSize + (maxSize - minSize) * scale);
    },
    
    get caption() {
      const { width } = Dimensions.get('window');
      const fontScale = RESPONSIVE.getFontScale();
      const baseSize = width < 360 ? 11 : width < 768 ? 12 : 13;
      return Math.round(baseSize * fontScale);
    },
    
    get body2() {
      const { width } = Dimensions.get('window');
      const fontScale = RESPONSIVE.getFontScale();
      const baseSize = width < 360 ? 13 : width < 768 ? 14 : 15;
      return Math.round(baseSize * fontScale);
    },
    
    get body1() {
      const { width } = Dimensions.get('window');
      const fontScale = RESPONSIVE.getFontScale();
      const baseSize = width < 360 ? 15 : width < 768 ? 16 : 17;
      return Math.round(baseSize * fontScale);
    },
    
    get subtitle() {
      const { width } = Dimensions.get('window');
      const fontScale = RESPONSIVE.getFontScale();
      const baseSize = width < 360 ? 16 : width < 768 ? 18 : 20;
      return Math.round(baseSize * fontScale);
    },
    
    get title() {
      const { width } = Dimensions.get('window');
      const fontScale = RESPONSIVE.getFontScale();
      const baseSize = width < 360 ? 18 : width < 768 ? 20 : 22;
      return Math.round(baseSize * fontScale);
    },
    
    get heading() {
      const { width } = Dimensions.get('window');
      const fontScale = RESPONSIVE.getFontScale();
      const baseSize = width < 360 ? 22 : width < 768 ? 24 : 28;
      return Math.round(baseSize * fontScale);
    },
    
    get display() {
      const { width } = Dimensions.get('window');
      const fontScale = RESPONSIVE.getFontScale();
      const baseSize = width < 360 ? 28 : width < 768 ? 32 : 40;
      return Math.round(baseSize * fontScale);
    }
  }
};

// Enhanced typography system with responsive scaling
export const FONTS = {
  // Font weights
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800'
  },
  
  // Legacy font weights for backward compatibility
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semiBold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  
  // Responsive typography styles
  styles: {
    display: {
      fontSize: SIZES.typography.display,
      fontWeight: '700',
      lineHeight: SIZES.typography.display * 1.2,
      color: COLORS.text.primary,
    },
    
    h1: {
      fontSize: SIZES.typography.heading,
      fontWeight: '700',
      lineHeight: SIZES.typography.heading * 1.3,
      color: COLORS.text.primary,
    },
    
    h2: {
      fontSize: SIZES.typography.title,
      fontWeight: '600',
      lineHeight: SIZES.typography.title * 1.4,
      color: COLORS.text.primary,
    },
    
    h3: {
      fontSize: SIZES.typography.subtitle,
      fontWeight: '600',
      lineHeight: SIZES.typography.subtitle * 1.4,
      color: COLORS.text.primary,
    },
    
    body1: {
      fontSize: SIZES.typography.body1,
      fontWeight: '400',
      lineHeight: SIZES.typography.body1 * 1.5,
      color: COLORS.text.primary,
    },
    
    body2: {
      fontSize: SIZES.typography.body2,
      fontWeight: '400',
      lineHeight: SIZES.typography.body2 * 1.5,
      color: COLORS.text.secondary,
    },
    
    caption: {
      fontSize: SIZES.typography.caption,
      fontWeight: '400',
      lineHeight: SIZES.typography.caption * 1.4,
      color: COLORS.text.light,
    },
    
    button: {
      fontSize: SIZES.typography.body1,
      fontWeight: '600',
      lineHeight: SIZES.typography.body1 * 1.2,
      color: COLORS.text.inverse,
    },
    
    label: {
      fontSize: SIZES.typography.body2,
      fontWeight: '500',
      lineHeight: SIZES.typography.body2 * 1.3,
      color: COLORS.text.primary,
    }
  },
  
  // Legacy font styles for backward compatibility
  h1: {
    fontSize: SIZES.xxlarge,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  h2: {
    fontSize: SIZES.xlarge,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  h3: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  body1: {
    fontSize: SIZES.medium,
    color: COLORS.text.primary,
  },
  body2: {
    fontSize: SIZES.font,
    color: COLORS.text.secondary,
  },
  small: {
    fontSize: SIZES.small,
    color: COLORS.text.light,
  },
};

// Enhanced shadow system with depth levels
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8
  },
  
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12
  },
  
  // Modal specific shadows
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15
  },
  
  // Interactive element shadows
  button: {
    shadowColor: COLORS.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  
  // Legacy shadow for backward compatibility
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5
  }
};

// Enhanced animation system with spring physics and gesture support
export const ANIMATIONS = {
  // Easing functions
  easing: {
    ease: Easing.inOut(Easing.ease),
    easeIn: Easing.in(Easing.ease),
    easeOut: Easing.out(Easing.ease),
    spring: Easing.elastic(1.3),
    bounce: Easing.bounce
  },
  
  // Timing configurations
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
    modal: 300,
    gesture: 200
  },
  
  // Spring configurations for different interaction types
  spring: {
    gentle: {
      tension: 120,
      friction: 8,
      useNativeDriver: true
    },
    
    bouncy: {
      tension: 180,
      friction: 6,
      useNativeDriver: true
    },
    
    snappy: {
      tension: 200,
      friction: 10,
      useNativeDriver: true
    },
    
    modal: {
      tension: 140,
      friction: 8,
      useNativeDriver: true
    }
  },
  
  // Gesture-based animation configs
  gesture: {
    swipe: {
      velocityThreshold: 500,
      distanceThreshold: 100,
      damping: 0.86,
      stiffness: 121.6
    },
    
    modal: {
      snapPoints: [0.25, 0.5, 0.75, 1],
      damping: 50,
      stiffness: 500
    }
  },
  
  // Legacy animation config for backward compatibility
  legacy: {
    spring: {
      tension: 20,
      friction: 7
    },
    timing: {
      duration: 250,
      easing: Easing.inOut(Easing.ease)
    }
  }
};

// Enhanced common styles with responsive design and accessibility
export const COMMON_STYLES = {
  // Container variants
  container: {
    flex: 1,
    backgroundColor: COLORS.surface.background,
  },
  
  containerPadded: {
    flex: 1,
    backgroundColor: COLORS.surface.background,
    paddingHorizontal: SIZES.spacing.lg,
  },
  
  containerSafeArea: {
    flex: 1,
    backgroundColor: COLORS.surface.background,
  },
  
  // Scrollable content
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.xl,
  },
  
  // Enhanced header system
  header: {
    backgroundColor: COLORS.primary[500],
    paddingTop: RESPONSIVE.deviceInfo.isIOS ? 44 : 24,
    paddingBottom: SIZES.spacing.lg,
    paddingHorizontal: SIZES.spacing.lg,
    borderBottomLeftRadius: SIZES.radius.large,
    borderBottomRightRadius: SIZES.radius.large,
    ...SHADOWS.medium,
  },
  
  headerTitle: {
    ...FONTS.styles.h2,
    color: COLORS.text.inverse,
    textAlign: 'center',
  },
  
  // Enhanced card system - responsivo dinâmico
  get card() {
    const screenSize = RESPONSIVE.getScreenSize();
    const padding = screenSize === 'small' ? SIZES.spacing.md : 
                    screenSize === 'tablet' ? SIZES.spacing.xl : SIZES.spacing.lg;
    const margin = screenSize === 'small' ? SIZES.spacing.md : SIZES.spacing.lg;
    
    return {
      backgroundColor: COLORS.surface.card,
      borderRadius: SIZES.radius.large,
      padding: padding,
      marginHorizontal: margin,
      marginVertical: SIZES.spacing.md,
      ...SHADOWS.medium,
    };
  },
  
  get cardElevated() {
    const screenSize = RESPONSIVE.getScreenSize();
    const padding = screenSize === 'small' ? SIZES.spacing.md : 
                    screenSize === 'tablet' ? SIZES.spacing.xl : SIZES.spacing.lg;
    const margin = screenSize === 'small' ? SIZES.spacing.md : SIZES.spacing.lg;
    
    return {
      backgroundColor: COLORS.surface.card,
      borderRadius: SIZES.radius.large,
      padding: padding,
      marginHorizontal: margin,
      marginVertical: SIZES.spacing.md,
      ...SHADOWS.large,
    };
  },
  
  get cardFlat() {
    const screenSize = RESPONSIVE.getScreenSize();
    const padding = screenSize === 'small' ? SIZES.spacing.md : SIZES.spacing.lg;
    const margin = screenSize === 'small' ? SIZES.spacing.md : SIZES.spacing.lg;
    
    return {
      backgroundColor: COLORS.surface.card,
      borderRadius: SIZES.radius.medium,
      padding: padding,
      marginHorizontal: margin,
      marginVertical: SIZES.spacing.sm,
      borderWidth: 1,
      borderColor: COLORS.border,
    };
  },
  
  // Enhanced input system - responsivo
  get inputContainer() {
    const screenSize = RESPONSIVE.getScreenSize();
    const marginBottom = screenSize === 'small' ? SIZES.spacing.md : SIZES.spacing.lg;
    
    return {
      width: '100%',
      marginBottom: marginBottom,
    };
  },
  
  label: {
    ...FONTS.styles.label,
    marginBottom: SIZES.spacing.sm,
    marginLeft: SIZES.spacing.xs,
  },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.input.border,
    borderRadius: SIZES.radius.medium,
    backgroundColor: COLORS.input.background,
    height: SIZES.heights.input,
    ...SHADOWS.small,
  },
  
  inputWrapperFocused: {
    borderColor: COLORS.input.borderFocused,
    backgroundColor: COLORS.input.backgroundFocused,
    ...SHADOWS.medium,
  },
  
  inputIcon: {
    marginHorizontal: SIZES.spacing.md,
  },
  
  textInput: {
    flex: 1,
    fontSize: SIZES.typography.body1,
    color: COLORS.text.primary,
    height: '100%',
    paddingRight: SIZES.spacing.md,
  },
  
  // Enhanced button system
  button: {
    borderRadius: SIZES.radius.medium,
    height: SIZES.heights.button,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SIZES.spacing.lg,
    marginVertical: SIZES.spacing.sm,
  },
  
  primaryButton: {
    backgroundColor: COLORS.primary[500],
    borderRadius: SIZES.radius.medium,
    height: SIZES.heights.button,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SIZES.spacing.lg,
    marginVertical: SIZES.spacing.sm,
    ...SHADOWS.button,
  },
  
  primaryButtonText: {
    ...FONTS.styles.button,
    color: COLORS.text.inverse,
  },
  
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.primary[500],
    backgroundColor: 'transparent',
    borderRadius: SIZES.radius.medium,
    height: SIZES.heights.button,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SIZES.spacing.lg,
    marginVertical: SIZES.spacing.sm,
  },
  
  secondaryButtonText: {
    ...FONTS.styles.button,
    color: COLORS.primary[500],
  },
  
  ghostButton: {
    backgroundColor: 'transparent',
    borderRadius: SIZES.radius.medium,
    height: SIZES.heights.button,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SIZES.spacing.lg,
    marginVertical: SIZES.spacing.sm,
  },
  
  ghostButtonText: {
    ...FONTS.styles.button,
    color: COLORS.primary[500],
  },
  
  // Loading and disabled states
  buttonDisabled: {
    opacity: 0.6,
  },
  
  loadingIndicator: {
    marginRight: SIZES.spacing.sm,
  },
  
  // Modal styles - responsivo
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.surface.overlay,
    justifyContent: 'flex-end',
  },
  
  get modalContainer() {
    const screenSize = RESPONSIVE.getScreenSize();
    const radius = screenSize === 'tablet' ? SIZES.radius.xlarge : SIZES.radius.large;
    const paddingTop = screenSize === 'small' ? SIZES.spacing.sm : SIZES.spacing.md;
    
    return {
      backgroundColor: COLORS.surface.modal,
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
      paddingTop: paddingTop,
      maxHeight: SIZES.heights.modal,
      ...SHADOWS.modal,
    };
  },
  
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.text.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  
  // Layout helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  // Accessibility helpers
  accessibilityFocus: {
    borderWidth: 2,
    borderColor: COLORS.accessibility.focus,
  },
  
  // Legacy styles for backward compatibility
  footerText: {
    ...FONTS.styles.caption,
    textAlign: 'center',
    marginHorizontal: SIZES.spacing.lg,
    marginTop: SIZES.spacing.md,
    marginBottom: SIZES.spacing.xl,
  },
};

// Export everything for easy access
export default {
  RESPONSIVE,
  COLORS,
  SIZES,
  FONTS,
  SHADOWS,
  ANIMATIONS,
  COMMON_STYLES,
  
  // Utility functions
  utils: {
    getResponsiveSize: RESPONSIVE.getDynamicSize,
    getResponsiveSpacing: RESPONSIVE.getDynamicSpacing,
    isSmallScreen: RESPONSIVE.isSmallScreen,
    isTablet: RESPONSIVE.isTablet,
    getScreenSize: RESPONSIVE.getScreenSize,
  }
};