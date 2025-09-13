import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';
import LocalDatabase from '../services/localDatabase';
import authService from '../services/authService';

export default function EditProfileScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
  });

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      let userProfile = null;

      // Try to get user profile from local storage first
      userProfile = await LocalDatabase.getUserProfile();
      console.log('📱 User profile from LocalDatabase:', userProfile);
      
      // If no user profile, try passenger profile
      if (!userProfile) {
        userProfile = await LocalDatabase.getPassengerProfile();
        console.log('🚗 Passenger profile from LocalDatabase:', userProfile);
      }

      if (userProfile) {
        // Filter out demo data - check if it's real user data
        const isDemoData = userProfile.name === 'Usuário Demo' || 
                          userProfile.nome === 'Usuário Demo' ||
                          userProfile.phone === '923456789' ||
                          userProfile.telefone === '923456789';
        
        if (isDemoData) {
          console.log('⚠️ Demo data detected, clearing fields for real user input');
          setProfile({
            nome: '',
            email: '',
            telefone: '',
            endereco: '',
          });
          Toast.show({
            type: 'info',
            text1: 'Perfil em Branco',
            text2: 'Por favor, preencha suas informações reais',
          });
        } else {
          setProfile({
            nome: userProfile.nome || userProfile.name || userProfile.fullName || '',
            email: userProfile.email || '',
            telefone: userProfile.telefone || userProfile.phone || '',
            endereco: userProfile.endereco || userProfile.address || '',
          });
          console.log('✅ Real user profile loaded successfully');
        }
      } else {
        console.log('⚠️ No user profile found, starting with empty form');
        setProfile({
          nome: '',
          email: '',
          telefone: '',
          endereco: '',
        });
        Toast.show({
          type: 'info',
          text1: 'Novo Perfil',
          text2: 'Por favor, preencha suas informações',
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar o perfil',
      });
      // Set empty form on error
      setProfile({
        nome: '',
        email: '',
        telefone: '',
        endereco: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile.nome.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Por favor, preencha o nome',
      });
      return;
    }

    if (!profile.telefone.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Por favor, preencha o telefone',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Create updated profile data
      const updatedProfile = {
        nome: profile.nome.trim(),
        name: profile.nome.trim(), // For compatibility
        email: profile.email.trim(),
        telefone: profile.telefone.trim(),
        phone: profile.telefone.trim(), // For compatibility
        endereco: profile.endereco.trim(),
        address: profile.endereco.trim(), // For compatibility
        updatedAt: new Date().toISOString(),
      };

      console.log('💾 Saving profile data:', updatedProfile);

      // Save to both storage locations
      await LocalDatabase.saveUserProfile(updatedProfile);
      await LocalDatabase.updatePassengerProfile(updatedProfile);
      
      console.log('✅ Profile saved successfully to local storage');

      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Perfil atualizado com sucesso',
      });

      // Go back to previous screen
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível salvar o perfil',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface.card} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface.card} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Form */}
        <View style={styles.formContainer}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile.nome ? profile.nome.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            </View>
            <Text style={styles.avatarSubtext}>Foto do perfil</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome Completo</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color={COLORS.text.secondary} />
              <TextInput
                style={styles.textInput}
                value={profile.nome}
                onChangeText={(value) => handleInputChange('nome', value)}
                placeholder="Digite seu nome completo"
                placeholderTextColor={COLORS.input.placeholder}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color={COLORS.text.secondary} />
              <TextInput
                style={styles.textInput}
                value={profile.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Digite seu email"
                placeholderTextColor={COLORS.input.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefone</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color={COLORS.text.secondary} />
              <TextInput
                style={styles.textInput}
                value={profile.telefone}
                onChangeText={(value) => handleInputChange('telefone', value)}
                placeholder="Digite seu telefone"
                placeholderTextColor={COLORS.input.placeholder}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Address Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Endereço (Opcional)</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="location-on" size={20} color={COLORS.text.secondary} />
              <TextInput
                style={styles.textInput}
                value={profile.endereco}
                onChangeText={(value) => handleInputChange('endereco', value)}
                placeholder="Digite seu endereço"
                placeholderTextColor={COLORS.input.placeholder}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          {isSaving ? (
            <View style={styles.loadingButtonContent}>
              <ActivityIndicator size="small" color={COLORS.text.inverse} />
              <Text style={styles.saveButtonText}>Salvando...</Text>
            </View>
          ) : (
            <>
              <MaterialIcons name="save" size={20} color={COLORS.text.inverse} />
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
    paddingBottom: 20,
    backgroundColor: COLORS.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formContainer: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text.inverse,
  },
  avatarSubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: COLORS.surface.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[500],
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    ...SHADOWS.medium,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.text.light,
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.inverse,
    marginLeft: 8,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});