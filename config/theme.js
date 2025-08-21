import { Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  primary: '#2563eb', // Azul mais suave
  secondary: '#4b5563',
  background: '#ffffff',
  card: '#ffffff',
  white: '#ffffff', // Add white color explicitly
  gray: '#6b7280', // Adicionando cor gray
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    light: '#9ca3af'
  },
  input: {
    background: '#f9fafb',
    placeholder: '#9ca3af'
  },
  border: '#e5e7eb',
  notification: '#ef4444',
  success: '#10b981',
  map: {
    route: '#2563eb',
    marker: '#2563eb',
    userMarker: '#2563eb'
  }
};

export const SIZES = {
  // Tamanhos globais
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  xlarge: 24,
  xxlarge: 32,
  
  // Dimensões
  width,
  height,
  
  // Raios
  radiusSmall: 8,
  radiusMedium: 12,
  radiusLarge: 20,
  
  // Espaçamentos
  padding: {
    small: 10,
    medium: 15,
    large: 20,
    xlarge: 30,
  },
  
  // Altura de botões/inputs
  buttonHeight: 55,
  inputHeight: 55,
  
  // Tamanhos de ícones
  iconSmall: 16,
  iconMedium: 20,
  iconLarge: 24,
};

export const FONTS = {
  regular: {
    fontWeight: 'normal',
  },
  medium: {
    fontWeight: '500',
  },
  semiBold: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: 'bold',
  },
  
  // Tamanhos de fonte
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
    color: COLORS.text.tertiary,
  },
};

export const SHADOWS = {
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