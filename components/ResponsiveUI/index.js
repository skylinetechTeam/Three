import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS, RESPONSIVE, ANIMATIONS } from '../../config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * ResponsiveButton - Enhanced button component with responsive sizing and animations
 */
export const ResponsiveButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'ghost', 'danger'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left', // 'left', 'right'
  fullWidth = false,
  children,
  style,
  textStyle,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  const buttonSizes = {
    small: {
      height: RESPONSIVE.getDynamicSize({ small: 40, standard: 44, large: 48, tablet: 52 }),
      paddingHorizontal: SIZES.spacing.md,
      fontSize: SIZES.typography.body2,
    },
    medium: {
      height: SIZES.heights.button,
      paddingHorizontal: SIZES.spacing.lg,
      fontSize: SIZES.typography.body1,
    },
    large: {
      height: RESPONSIVE.getDynamicSize({ small: 60, standard: 65, large: 70, tablet: 75 }),
      paddingHorizontal: SIZES.spacing.xl,
      fontSize: SIZES.typography.subtitle,
    }
  };

  const variantStyles = {
    primary: {
      backgroundColor: disabled ? COLORS.text.disabled : COLORS.primary[500],
      borderColor: 'transparent',
      color: COLORS.text.inverse,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: disabled ? COLORS.text.disabled : COLORS.primary[500],
      color: disabled ? COLORS.text.disabled : COLORS.primary[500],
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: disabled ? COLORS.text.disabled : COLORS.primary[500],
    },
    danger: {
      backgroundColor: disabled ? COLORS.text.disabled : COLORS.semantic.error,
      borderColor: 'transparent',
      color: COLORS.text.inverse,
    },
  };

  const currentSize = buttonSizes[size];
  const currentVariant = variantStyles[variant];

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      ...ANIMATIONS.spring.snappy,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...ANIMATIONS.spring.snappy,
    }).start();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color={currentVariant.color}
            style={styles.loadingIndicator}
          />
          <Text style={[
            styles.buttonText,
            { 
              fontSize: currentSize.fontSize,
              color: currentVariant.color,
            },
            textStyle
          ]}>
            {title}
          </Text>
        </View>
      );
    }

    if (children) {
      return children;
    }

    return (
      <View style={styles.buttonContent}>
        {icon && iconPosition === 'left' && (
          <Ionicons 
            name={icon} 
            size={RESPONSIVE.getIconSize('medium')} 
            color={currentVariant.color}
            style={styles.iconLeft}
          />
        )}
        
        <Text style={[
          styles.buttonText,
          {
            fontSize: currentSize.fontSize,
            color: currentVariant.color,
          },
          textStyle
        ]}>
          {title}
        </Text>
        
        {icon && iconPosition === 'right' && (
          <Ionicons 
            name={icon} 
            size={RESPONSIVE.getIconSize('medium')} 
            color={currentVariant.color}
            style={styles.iconRight}
          />
        )}
      </View>
    );
  };

  return (
    <Animated.View style={[
      styles.buttonContainer,
      {
        transform: [{ scale: scaleAnim }],
        width: fullWidth ? '100%' : undefined,
      },
      style
    ]}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            height: currentSize.height,
            paddingHorizontal: currentSize.paddingHorizontal,
            backgroundColor: currentVariant.backgroundColor,
            borderColor: currentVariant.borderColor,
            borderWidth: variant === 'secondary' ? 1 : 0,
            opacity: disabled ? 0.6 : 1,
          },
          variant === 'primary' && !disabled && SHADOWS.button,
        ]}
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * ResponsiveInput - Enhanced input component with responsive design and animations
 */
export const ResponsiveInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  icon,
  rightIcon,
  onRightIconPress,
  error,
  success,
  disabled = false,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  returnKeyType = 'done',
  style,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const labelPositionAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(borderColorAnim, {
      toValue: isFocused ? 1 : 0,
      duration: ANIMATIONS.timing.fast,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  useEffect(() => {
    Animated.timing(labelPositionAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: ANIMATIONS.timing.fast,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? COLORS.semantic.error : COLORS.input.border,
      error ? COLORS.semantic.error : COLORS.input.borderFocused
    ],
  });

  const backgroundColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.input.background, COLORS.input.backgroundFocused],
  });

  const labelTop = labelPositionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SIZES.heights.input / 2 - 8, -8],
  });

  const labelFontSize = labelPositionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SIZES.typography.body1, SIZES.typography.caption],
  });

  return (
    <View style={[styles.inputContainer, style]}>
      <Animated.View style={[
        styles.inputWrapper,
        {
          borderColor,
          backgroundColor,
          height: multiline ? Math.max(SIZES.heights.input, numberOfLines * 20 + 20) : SIZES.heights.input,
        },
        disabled && styles.inputDisabled,
      ]}>
        {icon && (
          <View style={styles.inputIcon}>
            <Ionicons 
              name={icon} 
              size={RESPONSIVE.getIconSize('medium')} 
              color={isFocused ? COLORS.primary[500] : COLORS.text.light} 
            />
          </View>
        )}

        <View style={styles.inputTextContainer}>
          {label && (
            <Animated.Text style={[
              styles.floatingLabel,
              {
                top: labelTop,
                fontSize: labelFontSize,
                color: error 
                  ? COLORS.semantic.error 
                  : isFocused 
                    ? COLORS.primary[500] 
                    : COLORS.text.light,
              }
            ]}>
              {label}
            </Animated.Text>
          )}

          <TextInput
            style={[
              styles.textInput,
              {
                paddingTop: label ? SIZES.spacing.lg : SIZES.spacing.md,
                color: disabled ? COLORS.text.disabled : COLORS.text.primary,
                fontSize: SIZES.typography.body1,
              },
              multiline && { 
                height: undefined,
                textAlignVertical: 'top',
                paddingTop: label ? SIZES.spacing.lg + 4 : SIZES.spacing.md,
              },
              inputStyle
            ]}
            placeholder={label ? undefined : placeholder}
            placeholderTextColor={COLORS.input.placeholder}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            keyboardType={keyboardType}
            returnKeyType={returnKeyType}
            {...props}
          />
        </View>

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={togglePasswordVisibility}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isPasswordVisible ? 'eye-off' : 'eye'} 
              size={RESPONSIVE.getIconSize('medium')} 
              color={COLORS.text.light} 
            />
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={rightIcon} 
              size={RESPONSIVE.getIconSize('medium')} 
              color={COLORS.text.light} 
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {(error || success) && (
        <View style={styles.messageContainer}>
          <Ionicons 
            name={error ? 'alert-circle' : 'checkmark-circle'} 
            size={RESPONSIVE.getIconSize('small')} 
            color={error ? COLORS.semantic.error : COLORS.semantic.success}
            style={styles.messageIcon}
          />
          <Text style={[
            styles.messageText,
            { color: error ? COLORS.semantic.error : COLORS.semantic.success }
          ]}>
            {error || success}
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * ResponsiveCard - Enhanced card component with responsive design
 */
export const ResponsiveCard = ({
  children,
  variant = 'elevated', // 'elevated', 'flat', 'outlined'
  padding = 'medium', // 'small', 'medium', 'large'
  margin = 'medium',
  onPress,
  style,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const paddingSizes = {
    small: SIZES.spacing.md,
    medium: SIZES.spacing.lg,
    large: SIZES.spacing.xl,
  };

  const marginSizes = {
    small: SIZES.spacing.sm,
    medium: SIZES.spacing.md,
    large: SIZES.spacing.lg,
  };

  const variantStyles = {
    elevated: {
      backgroundColor: COLORS.surface.card,
      borderWidth: 0,
      ...SHADOWS.medium,
    },
    flat: {
      backgroundColor: COLORS.surface.cardSecondary,
      borderWidth: 0,
    },
    outlined: {
      backgroundColor: COLORS.surface.card,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
  };

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        ...ANIMATIONS.spring.snappy,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...ANIMATIONS.spring.snappy,
      }).start();
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={[
      {
        transform: [{ scale: scaleAnim }],
        margin: marginSizes[margin],
      },
      style
    ]}>
      <CardComponent
        style={[
          styles.card,
          variantStyles[variant],
          {
            padding: paddingSizes[padding],
            borderRadius: SIZES.radius.large,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={onPress ? 0.95 : 1}
        {...props}
      >
        {children}
      </CardComponent>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Button styles
  buttonContainer: {
    alignSelf: 'flex-start',
  },
  
  button: {
    borderRadius: SIZES.radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingIndicator: {
    marginRight: SIZES.spacing.sm,
  },
  
  iconLeft: {
    marginRight: SIZES.spacing.sm,
  },
  
  iconRight: {
    marginLeft: SIZES.spacing.sm,
  },
  
  // Input styles
  inputContainer: {
    marginBottom: SIZES.spacing.lg,
  },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: SIZES.radius.medium,
    position: 'relative',
  },
  
  inputDisabled: {
    opacity: 0.6,
  },
  
  inputIcon: {
    paddingLeft: SIZES.spacing.md,
  },
  
  inputTextContainer: {
    flex: 1,
    position: 'relative',
  },
  
  floatingLabel: {
    position: 'absolute',
    left: SIZES.spacing.md,
    fontWeight: '500',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  
  textInput: {
    flex: 1,
    paddingHorizontal: SIZES.spacing.md,
    paddingBottom: SIZES.spacing.md,
    color: COLORS.text.primary,
  },
  
  passwordToggle: {
    padding: SIZES.spacing.md,
  },
  
  rightIcon: {
    padding: SIZES.spacing.md,
  },
  
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.xs,
  },
  
  messageIcon: {
    marginRight: SIZES.spacing.xs,
  },
  
  messageText: {
    fontSize: SIZES.typography.caption,
    fontWeight: '500',
  },
  
  // Card styles
  card: {
    overflow: 'hidden',
  },
});

export default {
  ResponsiveButton,
  ResponsiveInput,
  ResponsiveCard,
};