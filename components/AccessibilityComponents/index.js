import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  AccessibilityInfo,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '../BaseModal/ModalVariants';
import { ResponsiveButton, ResponsiveCard } from '../ResponsiveUI';
import { useUI, useResponsive } from '../../contexts/UIContext';
import { COLORS, SIZES, FONTS, RESPONSIVE } from '../../config/theme';

/**
 * AccessibilitySettingsModal - Comprehensive accessibility configuration
 */
export const AccessibilitySettingsModal = ({
  visible,
  onClose,
  onSettingsChange,
}) => {
  const { state, actions } = useUI();
  const { isSmallScreen } = useResponsive();

  const [settings, setSettings] = React.useState({
    screenReader: state.isScreenReaderEnabled,
    highContrast: state.isHighContrast,
    reduceMotion: state.reduceMotion,
    hapticFeedback: true,
    fontSize: state.fontScale || 1,
    voiceAnnouncements: false,
    buttonHaptics: true,
    navigationHaptics: true,
  });

  React.useEffect(() => {
    // Check if screen reader is enabled
    AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
      setSettings(prev => ({ ...prev, screenReader: enabled }));
      actions.setAccessibilitySettings({ screenReader: enabled });
    });

    // Listen for screen reader changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        setSettings(prev => ({ ...prev, screenReader: enabled }));
        actions.setAccessibilitySettings({ screenReader: enabled });
      }
    );

    return () => subscription?.remove();
  }, []);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Update UI context
    switch (key) {
      case 'highContrast':
        actions.toggleHighContrast();
        break;
      case 'fontSize':
        actions.setFontScale(value);
        break;
      case 'reduceMotion':
        actions.setAccessibilitySettings({ reduceMotion: value });
        break;
    }

    // Provide haptic feedback if enabled
    if (settings.hapticFeedback) {
      triggerHapticFeedback('selection');
    }

    onSettingsChange?.(newSettings);
  };

  const triggerHapticFeedback = (type = 'selection') => {
    if (!settings.hapticFeedback) return;

    if (Platform.OS === 'ios') {
      // iOS haptic feedback
      const { HapticFeedback } = require('expo-haptics');
      switch (type) {
        case 'selection':
          HapticFeedback.selectionAsync();
          break;
        case 'impact':
          HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Medium);
          break;
        case 'notification':
          HapticFeedback.notificationAsync(HapticFeedback.NotificationFeedbackType.Success);
          break;
      }
    } else {
      // Android vibration
      switch (type) {
        case 'selection':
          Vibration.vibrate(50);
          break;
        case 'impact':
          Vibration.vibrate(100);
          break;
        case 'notification':
          Vibration.vibrate([0, 100, 100, 100]);
          break;
      }
    }
  };

  const testScreenReader = () => {
    AccessibilityInfo.announceForAccessibility(
      'Teste de leitor de tela funcionando corretamente'
    );
  };

  const renderSettingRow = (
    title,
    description,
    value,
    onValueChange,
    type = 'switch',
    icon = null,
    options = null
  ) => (
    <View 
      style={styles.settingRow}
      accessible={true}
      accessibilityRole={type === 'switch' ? 'switch' : 'button'}
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={type === 'switch' ? { checked: value } : undefined}
    >
      <View style={styles.settingInfo}>
        {icon && (
          <View style={styles.settingIcon}>
            <Ionicons 
              name={icon} 
              size={RESPONSIVE.getIconSize('medium')} 
              color={COLORS.primary[500]} 
            />
          </View>
        )}
        
        <View style={styles.settingText}>
          <Text style={[
            FONTS.styles.body1, 
            styles.settingTitle,
            settings.highContrast && styles.highContrastText
          ]}>
            {title}
          </Text>
          <Text style={[
            FONTS.styles.body2, 
            styles.settingDescription,
            settings.highContrast && styles.highContrastSecondaryText
          ]}>
            {description}
          </Text>
        </View>
      </View>

      <View style={styles.settingControl}>
        {type === 'switch' && (
          <Switch
            value={value}
            onValueChange={(newValue) => {
              onValueChange(newValue);
              triggerHapticFeedback('selection');
            }}
            trackColor={{
              false: COLORS.border,
              true: COLORS.primary[300],
            }}
            thumbColor={value ? COLORS.primary[500] : COLORS.surface.card}
            accessibilityLabel={title}
          />
        )}
        
        {type === 'selector' && options && (
          <View style={styles.selectorContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.selectorOption,
                  value === option.value && styles.selectorOptionSelected,
                  settings.highContrast && value === option.value && styles.highContrastSelected
                ]}
                onPress={() => {
                  onValueChange(option.value);
                  triggerHapticFeedback('selection');
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: value === option.value }}
              >
                <Text style={[
                  FONTS.styles.caption,
                  styles.selectorText,
                  value === option.value && styles.selectorTextSelected,
                  settings.highContrast && styles.highContrastText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Acessibilidade"
      subtitle="Configure as opções de acessibilidade"
      initialSnapPoint={0.9}
      snapPoints={[0.7, 0.9]}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessible={false}
      >
        {/* Visual Accessibility */}
        <ResponsiveCard 
          style={[
            styles.section,
            settings.highContrast && styles.highContrastCard
          ]} 
          variant="flat"
        >
          <Text style={[
            FONTS.styles.h3, 
            styles.sectionTitle,
            settings.highContrast && styles.highContrastText
          ]}>
            Acessibilidade Visual
          </Text>

          {renderSettingRow(
            'Alto contraste',
            'Aumenta o contraste das cores para melhor visibilidade',
            settings.highContrast,
            (value) => updateSetting('highContrast', value),
            'switch',
            'contrast'
          )}

          {renderSettingRow(
            'Tamanho da fonte',
            'Ajusta o tamanho do texto em todo o aplicativo',
            settings.fontSize,
            (value) => updateSetting('fontSize', value),
            'selector',
            'text',
            [
              { label: 'Pequeno', value: 0.8 },
              { label: 'Normal', value: 1.0 },
              { label: 'Grande', value: 1.2 },
              { label: 'Muito Grande', value: 1.4 },
            ]
          )}

          {renderSettingRow(
            'Reduzir movimentos',
            'Diminui animações e transições para usuários sensíveis ao movimento',
            settings.reduceMotion,
            (value) => updateSetting('reduceMotion', value),
            'switch',
            'pause'
          )}
        </ResponsiveCard>

        {/* Screen Reader */}
        <ResponsiveCard 
          style={[
            styles.section,
            settings.highContrast && styles.highContrastCard
          ]} 
          variant="flat"
        >
          <Text style={[
            FONTS.styles.h3, 
            styles.sectionTitle,
            settings.highContrast && styles.highContrastText
          ]}>
            Leitor de Tela
          </Text>

          {renderSettingRow(
            'Leitor de tela ativo',
            settings.screenReader 
              ? 'Leitor de tela detectado e ativo' 
              : 'Nenhum leitor de tela detectado',
            settings.screenReader,
            () => {}, // Read-only
            'switch',
            'eye'
          )}

          {renderSettingRow(
            'Anúncios por voz',
            'Anuncia automaticamente mudanças importantes no aplicativo',
            settings.voiceAnnouncements,
            (value) => updateSetting('voiceAnnouncements', value),
            'switch',
            'volume-high'
          )}

          <TouchableOpacity
            style={[
              styles.testButton,
              settings.highContrast && styles.highContrastButton
            ]}
            onPress={testScreenReader}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Testar leitor de tela"
            accessibilityHint="Reproduz um anúncio de teste para verificar se o leitor de tela está funcionando"
          >
            <Ionicons 
              name="play-circle" 
              size={RESPONSIVE.getIconSize('medium')} 
              color={COLORS.primary[500]} 
            />
            <Text style={[
              FONTS.styles.body1, 
              styles.testButtonText,
              settings.highContrast && styles.highContrastText
            ]}>
              Testar leitor de tela
            </Text>
          </TouchableOpacity>
        </ResponsiveCard>

        {/* Haptic Feedback */}
        <ResponsiveCard 
          style={[
            styles.section,
            settings.highContrast && styles.highContrastCard
          ]} 
          variant="flat"
        >
          <Text style={[
            FONTS.styles.h3, 
            styles.sectionTitle,
            settings.highContrast && styles.highContrastText
          ]}>
            Feedback Tátil
          </Text>

          {renderSettingRow(
            'Feedback háptico',
            'Vibração ao interagir com elementos da interface',
            settings.hapticFeedback,
            (value) => updateSetting('hapticFeedback', value),
            'switch',
            'phone-vibrate'
          )}

          {renderSettingRow(
            'Haptics em botões',
            'Vibração ao tocar em botões',
            settings.buttonHaptics,
            (value) => updateSetting('buttonHaptics', value),
            'switch',
            'radio-button-on'
          )}

          {renderSettingRow(
            'Haptics na navegação',
            'Vibração ao navegar entre telas',
            settings.navigationHaptics,
            (value) => updateSetting('navigationHaptics', value),
            'switch',
            'navigate'
          )}

          <TouchableOpacity
            style={[
              styles.testButton,
              settings.highContrast && styles.highContrastButton
            ]}
            onPress={() => triggerHapticFeedback('notification')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Testar feedback háptico"
            accessibilityHint="Reproduz uma vibração de teste"
          >
            <Ionicons 
              name="phone-vibrate" 
              size={RESPONSIVE.getIconSize('medium')} 
              color={COLORS.primary[500]} 
            />
            <Text style={[
              FONTS.styles.body1, 
              styles.testButtonText,
              settings.highContrast && styles.highContrastText
            ]}>
              Testar vibração
            </Text>
          </TouchableOpacity>
        </ResponsiveCard>

        {/* Information */}
        <ResponsiveCard 
          style={[
            styles.section,
            settings.highContrast && styles.highContrastCard
          ]} 
          variant="flat"
        >
          <View style={styles.infoContainer}>
            <Ionicons 
              name="information-circle" 
              size={RESPONSIVE.getIconSize('large')} 
              color={COLORS.semantic.info} 
            />
            <View style={styles.infoText}>
              <Text style={[
                FONTS.styles.body1, 
                styles.infoTitle,
                settings.highContrast && styles.highContrastText
              ]}>
                Sobre a acessibilidade
              </Text>
              <Text style={[
                FONTS.styles.body2, 
                styles.infoDescription,
                settings.highContrast && styles.highContrastSecondaryText
              ]}>
                Estas configurações ajudam a tornar o aplicativo mais acessível para usuários com diferentes necessidades. 
                As alterações são salvas automaticamente.
              </Text>
            </View>
          </View>
        </ResponsiveCard>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <ResponsiveButton
          title="Restaurar padrões"
          variant="secondary"
          size="medium"
          onPress={() => {
            Alert.alert(
              'Restaurar configurações padrão',
              'Tem certeza que deseja restaurar todas as configurações de acessibilidade para os valores padrão?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Restaurar',
                  onPress: () => {
                    const defaultSettings = {
                      screenReader: false,
                      highContrast: false,
                      reduceMotion: false,
                      hapticFeedback: true,
                      fontSize: 1,
                      voiceAnnouncements: false,
                      buttonHaptics: true,
                      navigationHaptics: true,
                    };
                    setSettings(defaultSettings);
                    onSettingsChange?.(defaultSettings);
                    triggerHapticFeedback('notification');
                  },
                },
              ]
            );
          }}
          style={styles.restoreButton}
        />
        
        <ResponsiveButton
          title="Fechar"
          variant="primary"
          size="medium"
          onPress={onClose}
          style={styles.closeButton}
        />
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: SIZES.spacing.xl,
  },
  
  section: {
    marginBottom: SIZES.spacing.lg,
    padding: SIZES.spacing.lg,
  },
  
  sectionTitle: {
    marginBottom: SIZES.spacing.lg,
    color: COLORS.text.primary,
  },
  
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SIZES.spacing.md,
  },
  
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.md,
  },
  
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  settingText: {
    flex: 1,
  },
  
  settingTitle: {
    fontWeight: '600',
    marginBottom: SIZES.spacing.xs,
  },
  
  settingDescription: {
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  
  settingControl: {
    alignItems: 'flex-end',
  },
  
  selectorContainer: {
    flexDirection: 'row',
    gap: SIZES.spacing.xs,
  },
  
  selectorOption: {
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface.card,
  },
  
  selectorOptionSelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  
  selectorText: {
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  selectorTextSelected: {
    color: COLORS.primary[700],
  },
  
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.medium,
    backgroundColor: COLORS.primary[50],
    marginTop: SIZES.spacing.md,
    gap: SIZES.spacing.sm,
  },
  
  testButtonText: {
    color: COLORS.primary[700],
    fontWeight: '600',
  },
  
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.spacing.md,
  },
  
  infoText: {
    flex: 1,
  },
  
  infoTitle: {
    fontWeight: '600',
    marginBottom: SIZES.spacing.sm,
  },
  
  infoDescription: {
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  
  actionContainer: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
    paddingTop: SIZES.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  restoreButton: {
    flex: 1,
  },
  
  closeButton: {
    flex: 1,
  },
  
  // High contrast styles
  highContrastCard: {
    backgroundColor: COLORS.accessibility.highContrast.background,
    borderWidth: 2,
    borderColor: COLORS.accessibility.highContrast.primary,
  },
  
  highContrastText: {
    color: COLORS.accessibility.highContrast.text,
  },
  
  highContrastSecondaryText: {
    color: COLORS.accessibility.highContrast.text,
    opacity: 0.8,
  },
  
  highContrastSelected: {
    backgroundColor: COLORS.accessibility.highContrast.primary,
  },
  
  highContrastButton: {
    backgroundColor: COLORS.accessibility.highContrast.primary,
  },
});

export default AccessibilitySettingsModal;