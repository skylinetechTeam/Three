import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BaseModal from './index';
import { COLORS, SIZES, FONTS, RESPONSIVE } from '../../config/theme';

/**
 * BottomSheetModal - Modal that slides up from bottom with gesture support
 */
export const BottomSheetModal = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  actions,
  snapPoints = [0.25, 0.5, 0.75, 0.9],
  initialSnapPoint = 0.75,
  showHandle = true,
  ...props
}) => {
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottomSheet"
      enableGestures={true}
      showHandle={showHandle}
      snapPoints={snapPoints}
      initialSnapPoint={initialSnapPoint}
      {...props}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text style={[FONTS.styles.h3, styles.title]}>{title}</Text>
          )}
          {subtitle && (
            <Text style={[FONTS.styles.body2, styles.subtitle]}>{subtitle}</Text>
          )}
        </View>
      )}
      
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {children}
      </ScrollView>
      
      {actions && (
        <View style={styles.actionsContainer}>
          {actions}
        </View>
      )}
    </BaseModal>
  );
};

/**
 * OverlayModal - Centered modal with backdrop for confirmations and alerts
 */
export const OverlayModal = ({
  visible,
  onClose,
  title,
  message,
  children,
  primaryAction,
  secondaryAction,
  icon,
  iconColor = COLORS.primary[500],
  ...props
}) => {
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="overlay"
      enableGestures={false}
      showHandle={false}
      height="auto"
      {...props}
    >
      <View style={styles.overlayContent}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons 
              name={icon} 
              size={RESPONSIVE.getIconSize('large')} 
              color={iconColor} 
            />
          </View>
        )}
        
        {title && (
          <Text style={[FONTS.styles.h3, styles.overlayTitle]}>{title}</Text>
        )}
        
        {message && (
          <Text style={[FONTS.styles.body1, styles.overlayMessage]}>{message}</Text>
        )}
        
        {children}
        
        <View style={styles.overlayActions}>
          {secondaryAction && (
            <TouchableOpacity
              style={[styles.overlayButton, styles.secondaryButton]}
              onPress={secondaryAction.onPress}
            >
              <Text style={[FONTS.styles.button, styles.secondaryButtonText]}>
                {secondaryAction.title}
              </Text>
            </TouchableOpacity>
          )}
          
          {primaryAction && (
            <TouchableOpacity
              style={[styles.overlayButton, styles.primaryButton]}
              onPress={primaryAction.onPress}
            >
              <Text style={[FONTS.styles.button, styles.primaryButtonText]}>
                {primaryAction.title}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </BaseModal>
  );
};

/**
 * FullscreenModal - Full screen modal for complex interactions
 */
export const FullscreenModal = ({
  visible,
  onClose,
  title,
  headerActions,
  children,
  showCloseButton = true,
  ...props
}) => {
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="fullscreen"
      enableGestures={false}
      showHandle={false}
      showCloseButton={showCloseButton}
      {...props}
    >
      <View style={styles.fullscreenHeader}>
        <TouchableOpacity
          style={styles.fullscreenCloseButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name="close" 
            size={RESPONSIVE.getIconSize('medium')} 
            color={COLORS.text.primary} 
          />
        </TouchableOpacity>
        
        {title && (
          <Text style={[FONTS.styles.h3, styles.fullscreenTitle]}>{title}</Text>
        )}
        
        <View style={styles.headerActionsContainer}>
          {headerActions}
        </View>
      </View>
      
      <View style={styles.fullscreenContent}>
        {children}
      </View>
    </BaseModal>
  );
};

/**
 * SlideModal - Modal that slides from side for step-by-step processes
 */
export const SlideModal = ({
  visible,
  onClose,
  title,
  currentStep,
  totalSteps,
  children,
  onNext,
  onPrevious,
  nextTitle = "Próximo",
  previousTitle = "Anterior",
  canGoNext = true,
  canGoPrevious = true,
  ...props
}) => {
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="slide"
      enableGestures={true}
      showHandle={true}
      {...props}
    >
      <View style={styles.slideHeader}>
        {title && (
          <Text style={[FONTS.styles.h3, styles.slideTitle]}>{title}</Text>
        )}
        
        {(currentStep && totalSteps) && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${(currentStep / totalSteps) * 100}%` }
                ]} 
              />
            </View>
            <Text style={[FONTS.styles.caption, styles.progressText]}>
              Etapa {currentStep} de {totalSteps}
            </Text>
          </View>
        )}
      </View>
      
      <ScrollView
        style={styles.slideContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {children}
      </ScrollView>
      
      <View style={styles.slideActions}>
        {canGoPrevious && onPrevious && (
          <TouchableOpacity
            style={[styles.slideButton, styles.slideSecondaryButton]}
            onPress={onPrevious}
          >
            <Text style={[FONTS.styles.button, styles.slideSecondaryButtonText]}>
              {previousTitle}
            </Text>
          </TouchableOpacity>
        )}
        
        {canGoNext && onNext && (
          <TouchableOpacity
            style={[styles.slideButton, styles.slidePrimaryButton]}
            onPress={onNext}
          >
            <Text style={[FONTS.styles.button, styles.slidePrimaryButtonText]}>
              {nextTitle}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  // Common header styles
  header: {
    paddingBottom: SIZES.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SIZES.spacing.lg,
  },
  
  title: {
    textAlign: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  
  scrollContent: {
    flex: 1,
  },
  
  actionsContainer: {
    paddingTop: SIZES.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SIZES.spacing.lg,
  },
  
  // Overlay modal styles
  overlayContent: {
    padding: SIZES.spacing.xl,
    alignItems: 'center',
  },
  
  iconContainer: {
    width: RESPONSIVE.getDynamicSize({ small: 64, standard: 72, large: 80, tablet: 88 }),
    height: RESPONSIVE.getDynamicSize({ small: 64, standard: 72, large: 80, tablet: 88 }),
    borderRadius: SIZES.radius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  
  overlayTitle: {
    textAlign: 'center',
    marginBottom: SIZES.spacing.md,
  },
  
  overlayMessage: {
    textAlign: 'center',
    marginBottom: SIZES.spacing.xl,
  },
  
  overlayActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SIZES.spacing.md,
  },
  
  overlayButton: {
    paddingHorizontal: SIZES.spacing.xl,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.medium,
    minWidth: 100,
    alignItems: 'center',
  },
  
  primaryButton: {
    backgroundColor: COLORS.primary[500],
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  primaryButtonText: {
    color: COLORS.text.inverse,
  },
  
  secondaryButtonText: {
    color: COLORS.text.primary,
  },
  
  // Fullscreen modal styles
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  fullscreenCloseButton: {
    padding: SIZES.spacing.sm,
  },
  
  fullscreenTitle: {
    flex: 1,
    textAlign: 'center',
  },
  
  headerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  fullscreenContent: {
    flex: 1,
    padding: SIZES.spacing.lg,
  },
  
  // Slide modal styles
  slideHeader: {
    paddingBottom: SIZES.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SIZES.spacing.lg,
  },
  
  slideTitle: {
    textAlign: 'center',
    marginBottom: SIZES.spacing.md,
  },
  
  progressContainer: {
    alignItems: 'center',
  },
  
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: SIZES.spacing.sm,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary[500],
    borderRadius: 2,
  },
  
  progressText: {
    color: COLORS.text.light,
  },
  
  slideContent: {
    flex: 1,
  },
  
  slideActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SIZES.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SIZES.spacing.lg,
    gap: SIZES.spacing.md,
  },
  
  slideButton: {
    flex: 1,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.medium,
    alignItems: 'center',
  },
  
  slidePrimaryButton: {
    backgroundColor: COLORS.primary[500],
  },
  
  slideSecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  slidePrimaryButtonText: {
    color: COLORS.text.inverse,
  },
  
  slideSecondaryButtonText: {
    color: COLORS.text.primary,
  },
});

export default {
  BottomSheetModal,
  OverlayModal,
  FullscreenModal,
  SlideModal,
};