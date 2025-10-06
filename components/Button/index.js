import React from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS, RESPONSIVE } from '../../config/theme';

/**
 * Componente Button reutilizável com estados e acessibilidade
 * 
 * @param {Object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} props.variant - Variante visual do botão
 * @param {'sm'|'md'|'lg'} props.size - Tamanho do botão
 * @param {boolean} props.loading - Estado de carregamento
 * @param {boolean} props.disabled - Estado desabilitado
 * @param {React.ReactNode} props.iconLeft - Ícone à esquerda
 * @param {React.ReactNode} props.iconRight - Ícone à direita
 * @param {Function} props.onPress - Callback de pressão
 * @param {string} props.accessibilityLabel - Label de acessibilidade
 * @param {string} props.accessibilityHint - Hint de acessibilidade
 * @param {Object} props.style - Estilos customizados
 * @param {Object} props.textStyle - Estilos customizados para o texto
 * @param {React.ReactNode} props.children - Conteúdo do botão
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style = {},
  textStyle = {},
  children,
  ...rest
}) => {
  // Configurações de tamanho
  const sizeConfig = {
    sm: {
      height: Math.max(44, RESPONSIVE.getDynamicSize({ small: 40, standard: 44, large: 48, tablet: 52 })),
      paddingHorizontal: SIZES.spacing.md,
      fontSize: SIZES.typography.body2,
      iconSize: RESPONSIVE.getIconSize('small'),
    },
    md: {
      height: Math.max(44, SIZES.heights.button),
      paddingHorizontal: SIZES.spacing.lg,
      fontSize: SIZES.typography.body1,
      iconSize: RESPONSIVE.getIconSize('medium'),
    },
    lg: {
      height: Math.max(48, RESPONSIVE.getDynamicSize({ small: 56, standard: 60, large: 64, tablet: 68 })),
      paddingHorizontal: SIZES.spacing.xl,
      fontSize: SIZES.typography.subtitle,
      iconSize: RESPONSIVE.getIconSize('large'),
    },
  };

  const currentSize = sizeConfig[size];

  // Configurações de variante
  const variantStyles = {
    primary: {
      container: {
        backgroundColor: COLORS.primary[500],
        ...SHADOWS.button,
      },
      containerPressed: {
        backgroundColor: COLORS.primary[600],
      },
      text: {
        color: COLORS.text.inverse,
      },
      loader: COLORS.text.inverse,
    },
    secondary: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.primary[500],
      },
      containerPressed: {
        backgroundColor: COLORS.primary[50],
        borderColor: COLORS.primary[600],
      },
      text: {
        color: COLORS.primary[500],
      },
      loader: COLORS.primary[500],
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
      },
      containerPressed: {
        backgroundColor: COLORS.primary[50],
      },
      text: {
        color: COLORS.primary[500],
      },
      loader: COLORS.primary[500],
    },
    danger: {
      container: {
        backgroundColor: COLORS.semantic.error,
        ...SHADOWS.button,
      },
      containerPressed: {
        backgroundColor: '#dc2626', // darker red
      },
      text: {
        color: COLORS.text.inverse,
      },
      loader: COLORS.text.inverse,
    },
  };

  const currentVariant = variantStyles[variant];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : 'Button')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      style={({ pressed }) => [
        styles.container,
        {
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
        },
        currentVariant.container,
        pressed && !isDisabled && currentVariant.containerPressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {({ pressed }) => (
        <View style={styles.content}>
          {loading && (
            <ActivityIndicator
              size="small"
              color={currentVariant.loader}
              style={styles.loader}
            />
          )}
          
          {!loading && iconLeft && (
            <View style={[styles.icon, styles.iconLeft]}>
              {iconLeft}
            </View>
          )}
          
          {typeof children === 'string' ? (
            <Text
              style={[
                styles.text,
                {
                  fontSize: currentSize.fontSize,
                  fontWeight: '600',
                },
                currentVariant.text,
                isDisabled && styles.textDisabled,
                textStyle,
              ]}
              numberOfLines={1}
            >
              {children}
            </Text>
          ) : (
            children
          )}
          
          {!loading && iconRight && (
            <View style={[styles.icon, styles.iconRight]}>
              {iconRight}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SIZES.spacing.sm,
    minWidth: 64, // Material Design guideline
    // Garantir alvo tátil acessível
    minHeight: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.3,
    ...Platform.select({
      ios: {
        fontWeight: '600',
      },
      android: {
        fontWeight: '700',
      },
      default: {
        fontWeight: '600',
      },
    }),
  },
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    opacity: 0.7,
  },
  loader: {
    marginRight: SIZES.spacing.sm,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: SIZES.spacing.sm,
  },
  iconRight: {
    marginLeft: SIZES.spacing.sm,
  },
});

export default Button;
