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
import apiService from "../services/apiService";
import driverAuthService from "../services/driverAuthService";
import { COLORS, SIZES, FONTS, SHADOWS, COMMON_STYLES } from "../config/theme";
import * as ImagePicker from 'expo-image-picker';

export default function DriverLoginScreen({ navigation }) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isEnteringPassword, setIsEnteringPassword] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [driverPhoto, setDriverPhoto] = useState(null);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // NOVO FLUXO: Verificar se motorista existe no Supabase
  const handleDriverLogin = async () => {
    if (!emailOrPhone.trim()) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Por favor, insira seu email ou telefone.",
      });
      return;
    }

    setLoading(true);

    try {
      const input = emailOrPhone.trim();
      
      // Verificar se motorista existe no banco de dados
      const driverCheck = await driverAuthService.checkDriverExists(input);
      
      if (driverCheck.exists) {
        // Motorista existe no banco
        setCurrentDriver(driverCheck.driver);
        
        if (driverCheck.hasPassword) {
          // Motorista já tem senha - ir para tela de inserir senha
          setIsEnteringPassword(true);
          Toast.show({
            type: "success",
            text1: "Motorista encontrado",
            text2: `Olá ${driverCheck.driver.name}, digite sua senha.`,
          });
        } else {
          // Motorista não tem senha - ir direto para tirar foto
          setIsTakingPhoto(true);
          Toast.show({
            type: "info",
            text1: "Bem-vindo!",
            text2: `${driverCheck.driver.name}, tire uma foto para continuar.`,
          });
        }
      } else {
        // Motorista não existe no banco
        Toast.show({
          type: "error",
          text1: "Motorista não encontrado",
          text2: "Email ou telefone não cadastrado no sistema.",
        });
      }

    } catch (error) {
      console.error('Erro no login:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Erro ao verificar motorista. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // NOVA FUNÇÃO: Verificar senha existente
  const handlePasswordLogin = async () => {
    if (!password.trim()) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Por favor, digite sua senha.",
      });
      return;
    }

    setLoading(true);

    try {
      // Verificar senha no banco
      const isValidPassword = await driverAuthService.verifyDriverPassword(currentDriver.id, password);
      
      if (isValidPassword) {
        // Senha correta - ir para tirar foto
        setIsEnteringPassword(false);
        setIsTakingPhoto(true);
        Toast.show({
          type: "success",
          text1: "Senha correta!",
          text2: "Agora tire uma foto para continuar.",
        });
      } else {
        // Senha incorreta
        Toast.show({
          type: "error",
          text1: "Senha incorreta",
          text2: "Verifique sua senha e tente novamente.",
        });
      }

    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Erro ao verificar senha. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // NOVA FUNÇÃO: Finalizar login após tirar foto (quando já tem senha)
  const handleFinishLogin = async () => {
    if (!driverPhoto) {
      Toast.show({
        type: "error",
        text1: "Foto obrigatória",
        text2: "Você deve tirar uma foto para continuar.",
      });
      return;
    }

    setLoading(true);

    try {
      // Salvar foto localmente e no Supabase
      await driverAuthService.saveDriverPhoto(driverPhoto, currentDriver.id);
      
      // Salvar dados do motorista localmente
      await driverAuthService.saveDriverLocally(currentDriver, driverPhoto);
      
      // Registrar motorista na API para WebSocket (se necessário)
      try {
        const driverData = {
          name: currentDriver.name,
          phone: currentDriver.phone,
          email: currentDriver.email,
          licenseNumber: currentDriver.license_number || 'CNH123456789',
          vehicleInfo: require('../utils/vehicleUtils').extractVehicleInfo(currentDriver)
        };

        const apiResponse = await apiService.registerDriver(driverData);
        
        // Conectar ao socket
        if (apiResponse?.data?.driverId) {
          apiService.connectSocket('driver', apiResponse.data.driverId);
        }
        
      } catch (apiError) {
        console.warn('API registration failed, continuing with local login:', apiError);
        // Continue mesmo se API falhar
      }

      Toast.show({
        type: "success",
        text1: "Login realizado!",
        text2: `Bem-vindo de volta, ${currentDriver.name}!`,
      });

      // Navegar para a área do motorista
      navigation.reset({ index: 0, routes: [{ name: "DriverTabs" }] });

    } catch (error) {
      console.error('Erro ao finalizar login:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Erro ao finalizar login. Tente novamente.",
      });
    } finally {
      setLoading(false);
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

  // NOVA FUNÇÃO: Definir nova senha e finalizar login
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

    setLoading(true);

    try {
      // Definir senha no banco de dados
      await driverAuthService.setDriverPassword(currentDriver.id, newPassword);
      
      // Salvar foto localmente e no Supabase
      if (driverPhoto) {
        await driverAuthService.saveDriverPhoto(driverPhoto, currentDriver.id);
      }
      
      // Salvar dados do motorista localmente
      await driverAuthService.saveDriverLocally(currentDriver, driverPhoto);
      
      // Registrar motorista na API para WebSocket (se necessário)
      try {
        const driverData = {
          name: currentDriver.name,
          phone: currentDriver.phone,
          email: currentDriver.email,
          licenseNumber: currentDriver.license_number || 'CNH123456789',
          vehicleInfo: require('../utils/vehicleUtils').extractVehicleInfo(currentDriver)
        };

        const apiResponse = await apiService.registerDriver(driverData);
        
        // Conectar ao socket
        if (apiResponse?.data?.driverId) {
          apiService.connectSocket('driver', apiResponse.data.driverId);
        }
        
      } catch (apiError) {
        console.warn('API registration failed, continuing with local login:', apiError);
        // Continue mesmo se API falhar
      }

      Toast.show({
        type: "success",
        text1: "Login realizado!",
        text2: `Bem-vindo, ${currentDriver.name}!`,
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
    console.log('Renderizando step - isEnteringPassword:', isEnteringPassword, 'isTakingPhoto:', isTakingPhoto, 'isSettingPassword:', isSettingPassword);
    
    // Step 1: Email/Telefone inicial
    if (!isEnteringPassword && !isTakingPhoto && !isSettingPassword) {
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
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.buttonDisabled]} 
            onPress={handleDriverLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Verificando..." : "Continuar"}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={styles.buttonIcon} />}
          </TouchableOpacity>
        </>
      );
    }
    
    // Step 2: Inserir senha (se motorista já tem senha)
    if (isEnteringPassword) {
      return (
        <>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Olá, {currentDriver?.name}!</Text>
            <Text style={styles.welcomeSubtext}>Digite sua senha para continuar</Text>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} />
              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor={COLORS.gray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={COLORS.gray} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.buttonDisabled]} 
            onPress={handlePasswordLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Verificando..." : "Entrar"}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={styles.buttonIcon} />}
          </TouchableOpacity>
        </>
      );
    }
    
    // Step 3: Foto
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
              <Ionicons name="images" size={24} color={COLORS.primary[500]} />
              <Text style={[styles.photoButtonText, { color: COLORS.primary[500] }]}>Galeria</Text>
            </TouchableOpacity>
          </View>

          {/* Continue Button */}
          {driverPhoto && (
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.buttonDisabled]} 
              onPress={currentDriver?.password_hash ? handleFinishLogin : handleContinueToPassword}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Entrando..." : (currentDriver?.password_hash ? "Entrar" : "Definir Senha")}
              </Text>
              {!loading && <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={styles.buttonIcon} />}
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
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.buttonDisabled]} 
            onPress={handleSetNewPassword}
            disabled={loading}>
            <Text style={styles.loginButtonText}>
              {loading ? "Definindo senha..." : "Definir Senha e Entrar"}
            </Text>
            {!loading && <Ionicons name="checkmark-circle" size={20} color={COLORS.white} style={styles.buttonIcon} />}
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backToEmailButton} 
            onPress={() => {
              setIsSettingPassword(false);
              setIsTakingPhoto(true);
            }}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.primary[500]} />
            <Text style={styles.backToEmailText}>Voltar</Text>
          </TouchableOpacity>
        </>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary[500]} />
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
    backgroundColor: COLORS.primary[500],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.padding.large,
    paddingTop: 20, // Add proper top padding
  },
  header: {
    paddingTop: 40, // Ensure back button is accessible
    marginBottom: SIZES.padding.xlarge,
    alignItems: 'center',
    minHeight: 140, // Ensure enough space for the header
  },
  backButton: {
    position: 'absolute',
    top: 40, // Move down to be accessible
    left: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    zIndex: 999, // Ensure it's above other elements
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
    borderRadius: 24,
    padding: SIZES.padding.xlarge,
    marginBottom: SIZES.padding.xlarge,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
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
    borderRadius: 16,
    paddingHorizontal: SIZES.padding.large,
    height: SIZES.inputHeight,
    backgroundColor: COLORS.input.background,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: SIZES.padding.medium,
    ...FONTS.body1,
    color: COLORS.text.primary,
  },
  loginButton: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 16,
    paddingVertical: SIZES.padding.large,
    alignItems: 'center',
    marginTop: SIZES.padding.large,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56, // Ensure button is touchable
  },
  buttonDisabled: {
    backgroundColor: COLORS.text.disabled,
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
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
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    minHeight: 48, // Ensure button is touchable
  },
  backToEmailText: {
    ...FONTS.body1,
    color: COLORS.primary[500],
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
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: SIZES.padding.medium,
    paddingVertical: SIZES.padding.medium,
    borderRadius: SIZES.radiusMedium,
    minHeight: 44, // Ensure button is touchable
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  retakeButtonText: {
    ...FONTS.body2,
    color: COLORS.white,
    marginLeft: SIZES.padding.small,
    fontWeight: '600',
    fontSize: 13,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding.large,
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[500],
    paddingVertical: SIZES.padding.large,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56, // Ensure button is touchable
  },
  galleryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary[500],
    shadowColor: COLORS.primary[500],
  },
  photoButtonText: {
    ...FONTS.body1,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: SIZES.padding.small,
    fontSize: 14,
  },
  
  // Welcome styles for password step
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding.xlarge,
    paddingVertical: SIZES.padding.medium,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    borderRadius: 16,
    marginHorizontal: 4,
  },
  welcomeText: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SIZES.padding.small,
    fontSize: 20,
    fontWeight: '700',
  },
  welcomeSubtext: {
    ...FONTS.body1,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontSize: 14,
  },
});