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
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';
import LocalDatabase from '../services/localDatabase';
import authService from '../services/authService';

export default function EditProfileScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profile, setProfile] = useState({
    nome: '',
    email: '',
    telefone: '',
    profileImageUrl: '',
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
      
      // Se tem telefone, buscar foto do Supabase
      if (userProfile && userProfile.telefone) {
        try {
          const { data: supabaseUser } = await authService.supabase
            .from('users')
            .select('profile_image_url')
            .eq('telefone', userProfile.telefone)
            .single();
          
          if (supabaseUser && supabaseUser.profile_image_url) {
            userProfile.profileImageUrl = supabaseUser.profile_image_url;
            console.log('📸 Foto carregada do Supabase:', supabaseUser.profile_image_url);
          }
        } catch (err) {
          console.log('⚠️ Não foi possível carregar foto do Supabase:', err.message);
        }
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
            profileImageUrl: '',
          });
          setProfileImage(null);
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
            profileImageUrl: userProfile.profileImageUrl || '',
          });
          if (userProfile.profileImageUrl) {
            setProfileImage(userProfile.profileImageUrl);
          }
          console.log('✅ Real user profile loaded successfully');
        }
      } else {
        console.log('⚠️ No user profile found, starting with empty form');
        setProfile({
          nome: '',
          email: '',
          telefone: '',
          profileImageUrl: '',
        });
        setProfileImage(null);
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
        profileImageUrl: '',
      });
      setProfileImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permissão Negada',
          text2: 'É necessário permitir acesso às fotos',
        });
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        handleInputChange('profileImageUrl', imageUri);
        
        Toast.show({
          type: 'success',
          text1: 'Foto Selecionada',
          text2: 'Lembre-se de salvar as alterações',
        });
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível selecionar a imagem',
      });
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permissão Negada',
          text2: 'É necessário permitir acesso à câmera',
        });
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        handleInputChange('profileImageUrl', imageUri);
        
        Toast.show({
          type: 'success',
          text1: 'Foto Capturada',
          text2: 'Lembre-se de salvar as alterações',
        });
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível tirar a foto',
      });
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Foto de Perfil',
      'Escolha uma opção',
      [
        {
          text: 'Tirar Foto',
          onPress: takePhoto,
        },
        {
          text: 'Escolher da Galeria',
          onPress: pickImage,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
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
        profileImageUrl: profileImage || profile.profileImageUrl || '',
        updatedAt: new Date().toISOString(),
      };

      console.log('💾 Saving profile data:', updatedProfile);

      // Save to both storage locations
      await LocalDatabase.saveUserProfile(updatedProfile);
      await LocalDatabase.updatePassengerProfile(updatedProfile);
      
      console.log('✅ Profile saved successfully to local storage');
      
      // Sincronizar com Supabase
      try {
        console.log('🔍 Buscando usuário no Supabase pelo telefone:', updatedProfile.telefone);
        
        // Buscar ID do usuário pelo telefone
        const { data: users, error: searchError } = await authService.supabase
          .from('users')
          .select('id')
          .eq('telefone', updatedProfile.telefone)
          .limit(1);
        
        console.log('📊 Resultado da busca:', { users, searchError });
        
        if (searchError) {
          console.error('❌ Erro ao buscar usuário:', searchError.message);
          throw searchError;
        }
        
        if (!users || users.length === 0) {
          console.warn('⚠️ Usuário não encontrado no Supabase. Criando novo registro...');
          
          // Se o usuário não existe, criar novo registro
          const { data: newUser, error: insertError } = await authService.supabase
            .from('users')
            .insert([{
              nome: updatedProfile.nome,
              email: updatedProfile.email,
              telefone: updatedProfile.telefone
            }])
            .select();
          
          if (insertError) {
            console.error('❌ Erro ao criar usuário:', insertError.message);
            throw insertError;
          }
          
          console.log('✅ Novo usuário criado no Supabase:', newUser);
        } else {
          const userId = users[0].id;
          console.log('🔄 Atualizando dados no Supabase...');
          
          let publicImageUrl = null;
          
          // Se tem foto nova, fazer upload para o Supabase Storage
          if (profileImage && profileImage.startsWith('file://')) {
            try {
              console.log('📸 Fazendo upload da foto para Supabase Storage...');
              console.log('📸 URI da imagem:', profileImage);
              
              // Ler arquivo como blob usando fetch (funciona em React Native)
              const response = await fetch(profileImage);
              const blob = await response.blob();
              
              console.log('📸 Blob criado, tamanho:', blob.size, 'tipo:', blob.type);
              
              // Converter blob para ArrayBuffer
              const arrayBuffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(blob);
              });
              
              console.log('📸 ArrayBuffer criado, tamanho:', arrayBuffer.byteLength);
              
              // Nome do arquivo: userId_timestamp.jpg
              const fileName = `${userId}_${Date.now()}.jpg`;
              const filePath = `${fileName}`;
              
              console.log('📸 Fazendo upload para:', filePath);
              
              // Upload para o bucket profile-images
              const { data: uploadData, error: uploadError } = await authService.supabase.storage
                .from('profile-images')
                .upload(filePath, arrayBuffer, {
                  contentType: 'image/jpeg',
                  upsert: true // Substituir se já existir
                });
              
              if (uploadError) {
                console.error('❌ Erro no upload:', uploadError);
                console.error('❌ Detalhes:', JSON.stringify(uploadError, null, 2));
              } else {
                console.log('✅ Upload concluído:', uploadData);
                
                // Obter URL pública da imagem
                const { data: urlData } = authService.supabase.storage
                  .from('profile-images')
                  .getPublicUrl(filePath);
                
                publicImageUrl = urlData.publicUrl;
                console.log('🌐 URL pública da imagem:', publicImageUrl);
              }
            } catch (uploadError) {
              console.error('❌ Erro ao fazer upload da imagem:', uploadError);
              console.error('❌ Stack:', uploadError.stack);
            }
          }
          
          // Atualizar dados no Supabase (incluindo URL da foto se houver)
          const updateData = {
            nome: updatedProfile.nome,
            email: updatedProfile.email,
            telefone: updatedProfile.telefone
          };
          
          // Se conseguiu fazer upload, adiciona a URL da foto
          if (publicImageUrl) {
            updateData.profile_image_url = publicImageUrl;
          }
          
          console.log('📝 Dados a atualizar no Supabase:', updateData);
          
          // Atualizar usando query direta para incluir profile_image_url
          const { error: updateError } = await authService.supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);
          
          if (updateError) {
            console.error('❌ Erro ao atualizar:', updateError.message);
            console.error('❌ Detalhes do erro:', JSON.stringify(updateError, null, 2));
            throw updateError;
          } else {
            console.log('✅ Dados sincronizados com Supabase!', publicImageUrl ? '(com foto)' : '');
            
            // Atualizar profileImageUrl local com a URL pública se houver
            if (publicImageUrl) {
              updatedProfile.profileImageUrl = publicImageUrl;
              await LocalDatabase.saveUserProfile(updatedProfile);
              await LocalDatabase.updatePassengerProfile(updatedProfile);
              console.log('✅ URL da foto atualizada no storage local');
            }
          }
        }
      } catch (syncError) {
        console.error('⚠️ Erro ao sincronizar com Supabase:', syncError);
        console.error('⚠️ Detalhes:', {
          message: syncError.message,
          code: syncError.code,
          details: syncError.details,
          hint: syncError.hint
        });
        
        // Mostrar erro ao usuário
        Toast.show({
          type: 'warning',
          text1: 'Aviso',
          text2: 'Salvo localmente, mas não sincronizado com servidor',
        });
      }

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
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={showImageOptions}
              activeOpacity={0.7}
            >
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {profile.nome ? profile.nome.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <MaterialIcons name="camera-alt" size={20} color={COLORS.text.inverse} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarSubtext}>Toque para alterar a foto</Text>
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
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    ...SHADOWS.medium,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface.card,
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