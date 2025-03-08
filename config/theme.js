import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  primary: '#0072bb',       // Azul principal
  primaryDark: '#005c95',   // Azul escuro para hover/pressed
  primaryLight: '#e0f4ff',  // Azul claro para backgrounds sutis
  
  secondary: '#ff6b00',     // Laranja para CTAs secundários
  
  white: '#ffffff',
  black: '#000000',
  
  background: '#f5f5f5',    // Background cinza claro
  card: '#ffffff',          // Background de cards
  
  text: {
    primary: '#333333',     // Texto escuro principal
    secondary: '#666666',   // Texto cinza médio
    tertiary: '#8a8a8a',    // Texto cinza claro
    white: '#ffffff',       // Texto branco
    link: '#0072bb',        // Texto de links
  },
  
  border: '#e1e1e1',        // Cor de bordas
  input: {
    background: '#f9f9f9',  // Background de inputs
    placeholder: '#8a8a8a', // Cor de placeholder
  },
  
  success: '#4caf50',       // Verde para sucessos
  error: '#f44336',         // Vermelho para erros
  warning: '#ff9800',       // Laranja para avisos
  info: '#2196f3',          // Azul para informações
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
  light: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 8,
  },
  dark: {
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
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
    ...SHADOWS.light,
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