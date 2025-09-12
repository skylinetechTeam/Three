import { Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Cores principais
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  primaryDark: '#1d4ed8',
  secondary: '#64748b',
  secondaryLight: '#94a3b8',
  secondaryDark: '#475569',
  
  // Cores de fundo
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  backgroundTertiary: '#f1f5f9',
  card: '#ffffff',
  white: '#ffffff',
  
  // Cores de texto
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    light: '#94a3b8',
    inverse: '#ffffff'
  },
  
  // Cores de input
  input: {
    background: '#ffffff',
    backgroundFocused: '#f8fafc',
    placeholder: '#94a3b8',
    border: '#e2e8f0',
    borderFocused: '#2563eb',
    error: '#ef4444'
  },
  
  // Cores de status
  success: '#10b981',
  successLight: '#34d399',
  successDark: '#059669',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningDark: '#d97706',
  error: '#ef4444',
  errorLight: '#f87171',
  errorDark: '#dc2626',
  info: '#3b82f6',
  infoLight: '#60a5fa',
  infoDark: '#2563eb',
  
  // Cores de estado
  online: '#10b981',
  offline: '#ef4444',
  pending: '#f59e0b',
  
  // Cores de interface
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',
  divider: '#e2e8f0',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Cores do mapa
  map: {
    route: '#2563eb',
    routeShadow: '#1d4ed8',
    marker: '#2563eb',
    userMarker: '#10b981',
    pickupMarker: '#2563eb',
    destinationMarker: '#ef4444'
  },
  
  // Cores de gradiente
  gradient: {
    primary: ['#2563eb', '#3b82f6'],
    success: ['#10b981', '#34d399'],
    warning: ['#f59e0b', '#fbbf24'],
    error: ['#ef4444', '#f87171']
  }
};

export const SIZES = {
  // Tamanhos globais
  base: 8,
  xs: 4,
  small: 8,
  medium: 12,
  large: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Dimensões da tela
  width,
  height,
  screenWidth: width,
  screenHeight: height,
  
  // Raios de borda
  radius: {
    xs: 4,
    small: 8,
    medium: 12,
    large: 16,
    xl: 20,
    xxl: 24,
    full: 9999
  },
  
  // Espaçamentos
  spacing: {
    xs: 4,
    small: 8,
    medium: 12,
    large: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40
  },
  
  // Padding
  padding: {
    xs: 4,
    small: 8,
    medium: 12,
    large: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32
  },
  
  // Margin
  margin: {
    xs: 4,
    small: 8,
    medium: 12,
    large: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32
  },
  
  // Altura de componentes
  height: {
    input: 56,
    button: 56,
    buttonSmall: 44,
    buttonLarge: 64,
    header: 60,
    tabBar: 80
  },
  
  // Largura de componentes
  width: {
    button: '100%',
    buttonSmall: 120,
    buttonMedium: 160,
    buttonLarge: 200,
    card: '100%',
    modal: width * 0.9
  },
  
  // Tamanhos de ícones
  icon: {
    xs: 12,
    small: 16,
    medium: 20,
    large: 24,
    xl: 28,
    xxl: 32,
    xxxl: 40
  },
  
  // Tamanhos de fonte
  fontSize: {
    xs: 12,
    small: 14,
    medium: 16,
    large: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    xxxxl: 32
  },
  
  // Altura de linha
  lineHeight: {
    xs: 16,
    small: 20,
    medium: 24,
    large: 28,
    xl: 32,
    xxl: 36,
    xxxl: 40
  }
};

export const FONTS = {
  // Pesos de fonte
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800'
  },
  
  // Títulos
  h1: {
    fontSize: SIZES.fontSize.xxxxl,
    fontWeight: '700',
    lineHeight: SIZES.lineHeight.xxxl,
    color: COLORS.text.primary,
  },
  h2: {
    fontSize: SIZES.fontSize.xxxl,
    fontWeight: '700',
    lineHeight: SIZES.lineHeight.xxl,
    color: COLORS.text.primary,
  },
  h3: {
    fontSize: SIZES.fontSize.xxl,
    fontWeight: '600',
    lineHeight: SIZES.lineHeight.xl,
    color: COLORS.text.primary,
  },
  h4: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: '600',
    lineHeight: SIZES.lineHeight.large,
    color: COLORS.text.primary,
  },
  h5: {
    fontSize: SIZES.fontSize.large,
    fontWeight: '600',
    lineHeight: SIZES.lineHeight.medium,
    color: COLORS.text.primary,
  },
  h6: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: '600',
    lineHeight: SIZES.lineHeight.small,
    color: COLORS.text.primary,
  },
  
  // Texto do corpo
  body1: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: '400',
    lineHeight: SIZES.lineHeight.medium,
    color: COLORS.text.primary,
  },
  body2: {
    fontSize: SIZES.fontSize.small,
    fontWeight: '400',
    lineHeight: SIZES.lineHeight.small,
    color: COLORS.text.secondary,
  },
  body3: {
    fontSize: SIZES.fontSize.xs,
    fontWeight: '400',
    lineHeight: SIZES.lineHeight.xs,
    color: COLORS.text.tertiary,
  },
  
  // Texto pequeno
  caption: {
    fontSize: SIZES.fontSize.xs,
    fontWeight: '400',
    lineHeight: SIZES.lineHeight.xs,
    color: COLORS.text.light,
  },
  overline: {
    fontSize: SIZES.fontSize.xs,
    fontWeight: '600',
    lineHeight: SIZES.lineHeight.xs,
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Botões
  button: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: '600',
    lineHeight: SIZES.lineHeight.medium,
  },
  buttonSmall: {
    fontSize: SIZES.fontSize.small,
    fontWeight: '600',
    lineHeight: SIZES.lineHeight.small,
  },
  buttonLarge: {
    fontSize: SIZES.fontSize.large,
    fontWeight: '600',
    lineHeight: SIZES.lineHeight.large,
  },
  
  // Labels
  label: {
    fontSize: SIZES.fontSize.small,
    fontWeight: '500',
    lineHeight: SIZES.lineHeight.small,
    color: COLORS.text.primary,
  },
  labelSmall: {
    fontSize: SIZES.fontSize.xs,
    fontWeight: '500',
    lineHeight: SIZES.lineHeight.xs,
    color: COLORS.text.secondary,
  },
  
  // Status
  status: {
    fontSize: SIZES.fontSize.xs,
    fontWeight: '600',
    lineHeight: SIZES.lineHeight.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  xs: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  },
  xl: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12
  },
  // Sombras coloridas
  primary: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  success: {
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  error: {
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  warning: {
    shadowColor: COLORS.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  }
};

export const ANIMATIONS = {
  spring: {
    tension: 20,
    friction: 7
  },
  timing: {
    duration: 250,
    easing: Easing.inOut(Easing.ease)
  }
};

// Estilos comuns para componentes
export const COMMON_STYLES = {
  // Container principal
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Conteúdo scrollável
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  
  // Header padrão
  header: {
    width: '100%',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingVertical: SIZES.padding.large,
    paddingBottom: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  
  // Card estilo cartão elevado
  card: {
    width: width * 0.9,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding.large,
    marginTop: -25,
    ...SHADOWS.medium,
    marginBottom: SIZES.padding.large,
  },
  
  // Container de inputs
  inputContainer: {
    width: '100%',
  },
  
  // Label de inputs
  label: {
    fontSize: SIZES.font,
    ...FONTS.medium,
    color: COLORS.text.primary,
    marginBottom: 8,
    marginLeft: 4,
  },
  
  // Wrapper de inputs com ícone
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: COLORS.input.background,
    height: SIZES.inputHeight,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  
  // Ícone de input
  inputIcon: {
    marginHorizontal: 12,
  },
  
  // Estilo do input
  textInput: {
    flex: 1,
    fontSize: SIZES.medium,
    color: COLORS.text.primary,
    height: '100%',
  },
  
  // Botão primário
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMedium,
    height: SIZES.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...SHADOWS.dark,
  },
  
  // Texto do botão primário
  primaryButtonText: {
    color: COLORS.white,
    fontSize: SIZES.large,
    ...FONTS.bold,
  },
  
  // Botão secundário (outline)
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
    borderRadius: SIZES.radiusMedium,
    height: SIZES.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  
  // Texto do botão secundário
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.large,
    ...FONTS.bold,
  },
  
  // Texto de footer
  footerText: {
    fontSize: SIZES.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginHorizontal: SIZES.padding.large,
    marginTop: SIZES.padding.small,
    marginBottom: 30,
  },
};

export default {
  COLORS,
  SIZES,
  FONTS,
  SHADOWS,
  COMMON_STYLES
};