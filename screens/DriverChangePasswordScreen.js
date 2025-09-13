
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import driverAuthService from '../services/driverAuthService';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';

export default function DriverChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const insets = useSafeAreaInsets();

  const validateCurrentPassword = () => {
    if (!currentPassword.trim()) {
      return 'Digite sua senha atual';
    }
    return null;
  };

  const validateNewPassword = () => {
    if (!newPassword.trim()) {
      return 'Digite a nova senha';
    }
    if (newPassword.length < 6) {
      return 'Nova senha deve ter pelo menos 6 caracteres';
    }
    if (newPassword === currentPassword) {
      return 'Nova senha deve ser diferente da atual';
    }
    return null;
  };

  const validateConfirmPassword = () => {
    if (!confirmPassword.trim()) {
      return 'Confirme a nova senha';
    }
    if (confirmPassword !== newPassword) {
      return 'As senhas não coincidem';
    }
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    
    const currentPasswordError = validateCurrentPassword();
    const newPasswordError = validateNewPassword();
    const confirmPasswordError = validateConfirmPassword();

    if (currentPasswordError) newErrors.currentPassword = currentPasswordError;
    if (newPasswordError) newErrors.newPassword = newPasswordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Erro de validação',
        text2: 'Por favor, corrija os erros no formulário',
      });
      return;
    }

    setLoading(true);

    try {
      // Get current driver data to get the ID
      const driverData = await driverAuthService.getLocalDriverData();
      
      if (!driverData) {
        throw new Error('Dados do motorista não encontrados');
      }

      // Verify current password
      const isCurrentPasswordValid = await driverAuthService.verifyDriverPassword(
        driverData.id, 
        currentPassword
      );

      if (!isCurrentPasswordValid) {
        setErrors({ currentPassword: 'Senha atual incorreta' });
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'Senha atual incorreta',
        });
        return;
      }

      // Update password
      await driverAuthService.setDriverPassword(driverData.id, newPassword);

      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Senha alterada com sucesso',
      });

      // Navigate back to settings
      navigation.goBack();

    } catch (error) {
      console.error('Error changing password:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.message || 'Erro ao alterar senha. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  const handleGoBack = () => {
    if (currentPassword || newPassword || confirmPassword) {
      Alert.alert(
        'Descartar alterações?',
        'Você tem alterações não salvas. Deseja mesmo sair?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sair', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const PasswordInput = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    secureTextEntry, 
    onToggleVisibility, 
    error 
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <MaterialIcons 
          name="lock-outline" 
          size={20} 
          color={error ? COLORS.notification : COLORS.text.secondary} 
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.input.placeholder}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={onToggleVisibility}
          disabled={loading}
        >
          <Ionicons
            name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={COLORS.text.secondary}
          />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Alterar Senha</Text>
        </View>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Container */}
        <View style={styles.formContainer}>
          <Text style={styles.instructionText}>
            Para alterar sua senha, digite sua senha atual e escolha uma nova senha segura.
          </Text>

          {/* Current Password */}
          <PasswordInput
            label="Senha Atual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Digite sua senha atual"
            secureTextEntry={!showCurrentPassword}
            onToggleVisibility={() => togglePasswordVisibility('current')}
            error={errors.currentPassword}
          />

          {/* New Password */}
          <PasswordInput
            label="Nova Senha"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Digite a nova senha"
            secureTextEntry={!showNewPassword}
            onToggleVisibility={() => togglePasswordVisibility('new')}
            error={errors.newPassword}
          />

          {/* Confirm Password */}
          <PasswordInput
            label="Confirmar Nova Senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirme a nova senha"
            secureTextEntry={!showConfirmPassword}
            onToggleVisibility={() => togglePasswordVisibility('confirm')}
            error={errors.confirmPassword}
          />

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Requisitos da senha:</Text>
            <Text style={styles.requirementItem}>• Mínimo de 6 caracteres</Text>
            <Text style={styles.requirementItem}>• Deve ser diferente da senha atual</Text>
          </View>

          {/* Change Password Button */}
          <TouchableOpacity
            style={[
              styles.changePasswordButton,
              loading && styles.buttonDisabled
            ]}
            onPress={handlePasswordChange}
            disabled={loading}
          >
            <Text style={styles.changePasswordButtonText}>
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1F2937',
    ...SHADOWS.medium,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    ...SHADOWS.medium,
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    height: 55,
    ...SHADOWS.small,
  },
  inputError: {
    borderColor: COLORS.notification,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    height: '100%',
  },
  eyeButton: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.notification,
    marginTop: 4,
    marginLeft: 4,
  },
  requirementsContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  changePasswordButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  changePasswordButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});