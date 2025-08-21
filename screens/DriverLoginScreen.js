import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  ImageBackground,
  Image,
  Alert,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import LocalDatabase from "../services/localDatabase";
import { COLORS, SIZES, FONTS, SHADOWS, COMMON_STYLES } from "../config/theme";
import * as ImagePicker from 'expo-image-picker';

export default function DriverLoginScreen({ navigation }) {
  const [emailOrPhone, setEmailOrPhone] = useState("912345678");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [driverPhoto, setDriverPhoto] = useState(null);

  // Tirar foto do motorista
  const takePhoto = async () => {
    try {
      // Solicitar permissão da câmera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos da permissão da câmera para tirar sua foto.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configurações', onPress: () => ImagePicker.requestCameraPermissionsAsync() }
          ]
        );
        return;
      }

      // Abrir câmera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setDriverPhoto(result.assets[0].uri);
        Toast.show({
          type: "success",
          text1: "Foto tirada!",
          text2: "Foto capturada com sucesso",
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível tirar a foto. Tente novamente.",
      });
    }
  };

  // Selecionar foto da galeria
  const selectPhoto = async () => {
    try {
      // Solicitar permissão da galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos da permissão da galeria para selecionar sua foto.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configurações', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
          ]
        );
        return;
      }

      // Abrir galeria
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setDriverPhoto(result.assets[0].uri);
        Toast.show({
          type: "success",
          text1: "Foto selecionada!",
          text2: "Foto escolhida com sucesso",
        });
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível selecionar a foto. Tente novamente.",
      });
    }
  };

  // Verificar se o motorista existe e permitir definir nova senha
  const handleDriverLogin = async () => {
    if (!emailOrPhone) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Por favor, insira seu email ou telefone cadastrado.",
      });
      return;
    }

    try {
      const input = (emailOrPhone || '').trim();
      
      // Verificar se existe um perfil de motorista cadastrado
      let storedDriverProfile = await LocalDatabase.getDriverProfile();
      
      if (!storedDriverProfile) {
        // Criar um perfil padrão para demonstração
        const defaultDriverProfile = {
          nome: 'João Silva',
          email: 'joao.motorista@email.com',
          telefone: '912345678',
          phone: '912345678', // Adicionar também como 'phone' para compatibilidade
          veiculo: {
            modelo: 'Toyota Corolla',
            placa: 'LD-12-34-AB',
            cor: 'Branco',
            ano: 2020,
          },
          rating: 4.8,
          totalTrips: 142,
          joinDate: '2023-01-15',
          isLoggedIn: false,
          isOnline: false,
        };
        
        await LocalDatabase.saveDriverProfile(defaultDriverProfile);
        storedDriverProfile = defaultDriverProfile;
        
        Toast.show({
          type: "info",
          text1: "Perfil criado",
          text2: "Perfil de demonstração criado com sucesso",
        });
      }

      // Verificar se o input é o número padrão ou corresponde ao perfil
      const isDefaultNumber = input === '912345678';
      const emailMatch = (storedDriverProfile.email || '').toLowerCase() === input.toLowerCase();
      const phoneMatch = (storedDriverProfile.telefone || storedDriverProfile.phone || '') === input;

      if (!(emailMatch || phoneMatch || isDefaultNumber)) {
        Toast.show({
          type: "error",
          text1: "Motorista não encontrado",
          text2: "Email ou telefone não encontrado no sistema.",
        });
        return;
      }

      // Se for o número padrão, atualizar o perfil com esse número
      if (isDefaultNumber && !phoneMatch) {
        await LocalDatabase.updateDriverProfile({
          telefone: '912345678'
        });
        Toast.show({
          type: "info",
          text1: "Telefone atualizado",
          text2: "Número 912345678 configurado para teste",
        });
      }

      // Ir para o step de tirar foto
      setIsTakingPhoto(true);

    } catch (error) {
      console.error('Driver login error:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Tente novamente.",
      });
    }
  };

  // Continuar para definir senha após tirar foto
  const handleContinueToPassword = () => {
    console.log('handleContinueToPassword chamado');
    console.log('driverPhoto:', driverPhoto);
    console.log('isSettingPassword antes:', isSettingPassword);
    console.log('isTakingPhoto antes:', isTakingPhoto);
    
    if (!driverPhoto) {
      Toast.show({
        type: "error",
        text1: "Foto obrigatória",
        text2: "Você deve tirar uma foto para continuar.",
      });
      return;
    }
    
    setIsSettingPassword(true);
    setIsTakingPhoto(false);
    
    console.log('Estados atualizados - isSettingPassword:', true, 'isTakingPhoto:', false);
  };

  // Definir nova senha e fazer login
  const handleSetNewPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Por favor, preencha todos os campos de senha.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "As senhas não coincidem.",
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    try {
      const input = (emailOrPhone || '').trim();
      
      // Atualizar a senha do motorista e garantir que o telefone esteja correto
      await LocalDatabase.updateDriverProfile({
        password: newPassword,
        telefone: emailOrPhone, // Garantir que o telefone usado no login seja salvo
        photo: driverPhoto, // Salvar a foto do motorista
        isLoggedIn: true,
        lastLogin: new Date().toISOString(),
      });

      const driverProfile = await LocalDatabase.getDriverProfile();

      Toast.show({
        type: "success",
        text1: "Bem-vindo!",
        text2: `Olá, ${driverProfile.nome || driverProfile.fullName || driverProfile.email}!`,
      });

      // Navegar para a área do motorista
      navigation.reset({ index: 0, routes: [{ name: "DriverTabs" }] });

    } catch (error) {
      console.error('Set password error:', error);
      Toast.show({
        type: "error",
        text1: "Erro ao definir senha",
        text2: "Tente novamente.",
      });
    }
  };

  // Renderizar o step atual
  const renderCurrentStep = () => {
    console.log('Renderizando step - isTakingPhoto:', isTakingPhoto, 'isSettingPassword:', isSettingPassword);
    
    // Step 1: Login
    if (!isTakingPhoto && !isSettingPassword) {
      return (
        <>
          {/* Email/Phone Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email ou Telefone</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.gray} />
              <TextInput
                style={styles.input}
                placeholder="Digite seu email ou telefone"
                placeholderTextColor={COLORS.gray}
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleDriverLogin}>
            <Text style={styles.loginButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={styles.buttonIcon} />
          </TouchableOpacity>
        </>
      );
    }
    
    // Step 2: Foto
    if (isTakingPhoto) {
      return (
        <>
          {/* Photo Section */}
          <View style={styles.photoContainer}>
            {driverPhoto ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: driverPhoto }} style={styles.photoImage} />
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={() => setDriverPhoto(null)}
                >
                  <Ionicons name="refresh" size={20} color={COLORS.white} />
                  <Text style={styles.retakeButtonText}>Tirar Novamente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={60} color={COLORS.gray} />
                <Text style={styles.photoPlaceholderText}>
                  Clique em um dos botões abaixo para tirar ou selecionar uma foto
                </Text>
              </View>
            )}
          </View>

          {/* Photo Action Buttons */}
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color={COLORS.white} />
              <Text style={styles.photoButtonText}>Tirar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.photoButton, styles.galleryButton]} onPress={selectPhoto}>
              <Ionicons name="images" size={24} color={COLORS.primary} />
              <Text style={styles.photoButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>

          {/* Continue Button */}
          {driverPhoto && (
            <TouchableOpacity style={styles.loginButton} onPress={handleContinueToPassword}>
              <Text style={styles.loginButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={styles.buttonIcon} />
            </TouchableOpacity>
          )}
        </>
      );
    }
    
    // Step 3: Senha
    if (isSettingPassword) {
      return (
        <>
          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nova Senha</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} />
              <TextInput
                style={styles.input}
                placeholder="Digite sua nova senha"
                placeholderTextColor={COLORS.gray}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirmar Senha</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} />
              <TextInput
                style={styles.input}
                placeholder="Confirme sua nova senha"
                placeholderTextColor={COLORS.gray}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Set Password Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleSetNewPassword}>
            <Text style={styles.loginButtonText}>Definir Senha e Entrar</Text>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.white} style={styles.buttonIcon} />
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backToEmailButton} 
            onPress={() => {
              setIsSettingPassword(false);
              setIsTakingPhoto(true);
            }}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
            <Text style={styles.backToEmailText}>Voltar</Text>
          </TouchableOpacity>
        </>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header com gradiente */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => {
                if (isSettingPassword) {
                  setIsSettingPassword(false);
                  setIsTakingPhoto(true);
                } else if (isTakingPhoto) {
                  setIsTakingPhoto(false);
                } else {
                  navigation.goBack();
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            
            {/* Logo/Ícone do motorista */}
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Ionicons name="car-sport" size={40} color={COLORS.white} />
              </View>
            </View>
          </View>

          {/* Container principal com card */}
          <View style={styles.mainContainer}>
            {/* Título */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                {isSettingPassword ? "Definir Nova Senha" : 
                 isTakingPhoto ? "Tirar Foto" : "Área do Motorista"}
              </Text>
              <Text style={styles.subtitle}>
                {isSettingPassword 
                  ? "Crie uma senha segura para acessar sua conta"
                  : isTakingPhoto
                  ? "Tire uma foto para seu perfil de motorista"
                  : "Digite seu email ou telefone cadastrado"
                }
              </Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {renderCurrentStep()}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerText}>
                É passageiro? <Text style={styles.linkText}>Entrar como passageiro</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.padding.large,
  },
  header: {
    paddingTop: SIZES.padding.large,
    marginBottom: SIZES.padding.xlarge,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  logoContainer: {
    marginTop: SIZES.padding.large,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  mainContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding.xlarge,
    marginBottom: SIZES.padding.xlarge,
    ...SHADOWS.medium,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding.xlarge,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SIZES.padding.medium,
  },
  subtitle: {
    ...FONTS.body1,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: SIZES.padding.large,
  },
  inputLabel: {
    ...FONTS.body1,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.small,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: SIZES.padding.large,
    height: SIZES.inputHeight,
    backgroundColor: COLORS.input.background,
    ...SHADOWS.light,
  },
  input: {
    flex: 1,
    marginLeft: SIZES.padding.medium,
    ...FONTS.body1,
    color: COLORS.text.primary,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMedium,
    paddingVertical: SIZES.padding.large,
    alignItems: 'center',
    marginTop: SIZES.padding.large,
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  loginButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: SIZES.padding.small,
  },
  backToEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.padding.large,
    paddingVertical: SIZES.padding.medium,
  },
  backToEmailText: {
    ...FONTS.body1,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SIZES.padding.small,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SIZES.padding.large,
  },
  footerText: {
    ...FONTS.body1,
    color: COLORS.white,
    textAlign: 'center',
  },
  linkText: {
    color: COLORS.white,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  // Novos estilos para foto
  photoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding.large,
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.input.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding.large,
  },
  photoPlaceholderText: {
    ...FONTS.body2,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: SIZES.padding.medium,
    marginTop: SIZES.padding.medium,
  },
  photoPreview: {
    alignItems: 'center',
    marginBottom: SIZES.padding.large,
  },
  photoImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: SIZES.padding.medium,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding.medium,
    paddingVertical: SIZES.padding.small,
    borderRadius: SIZES.radiusMedium,
  },
  retakeButtonText: {
    ...FONTS.body2,
    color: COLORS.white,
    marginLeft: SIZES.padding.small,
    fontWeight: '600',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding.large,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding.large,
    borderRadius: SIZES.radiusMedium,
    marginHorizontal: SIZES.padding.small,
    ...SHADOWS.medium,
  },
  galleryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  photoButtonText: {
    ...FONTS.body1,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: SIZES.padding.small,
  },
  galleryButtonText: {
    color: COLORS.primary,
  },
});