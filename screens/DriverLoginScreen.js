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
      // Salvar foto localmente
      await driverAuthService.saveDriverPhoto(driverPhoto);
      
      // Salvar dados do motorista localmente
      await driverAuthService.saveDriverLocally(currentDriver, driverPhoto);
      
      // Registrar motorista na API para WebSocket (se necessário)
      try {
        const driverData = {
          name: currentDriver.name,
          phone: currentDriver.phone,
          email: currentDriver.email,
          licenseNumber: currentDriver.license_number || 'CNH123456789',
          vehicleInfo: {
            make: currentDriver.vehicles?.[0]?.make || 'Toyota',
            model: currentDriver.vehicles?.[0]?.model || 'Corolla',
            year: currentDriver.vehicles?.[0]?.year || 2020,
            color: currentDriver.vehicles?.[0]?.color || 'Branco',
            plate: currentDriver.vehicles?.[0]?.license_plate || 'ABC-1234'
          }
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
      
      // Salvar foto localmente
      if (driverPhoto) {
        await driverAuthService.saveDriverPhoto(driverPhoto);
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
          vehicleInfo: {
            make: currentDriver.vehicles?.[0]?.make || 'Toyota',
            model: currentDriver.vehicles?.[0]?.model || 'Corolla',
            year: currentDriver.vehicles?.[0]?.year || 2020,
            color: currentDriver.vehicles?.[0]?.color || 'Branco',
            plate: currentDriver.vehicles?.[0]?.license_plate || 'ABC-1234'
          }
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
              <Ionicons name="images" size={24} color={COLORS.primary} />
              <Text style={[styles.photoButtonText, { color: COLORS.primary }]}>Galeria</Text>
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
    paddingHorizontal: SIZES.padding.xl,
  },
  header: {
    paddingTop: SIZES.padding.xl,
    marginBottom: SIZES.padding.xxxl,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 48,
    height: 48,
    borderRadius: SIZES.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  logoContainer: {
    marginTop: SIZES.padding.xl,
  },
  logoBackground: {
    width: 96,
    height: 96,
    borderRadius: SIZES.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  mainContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.xxl,
    padding: SIZES.padding.xxxl,
    marginBottom: SIZES.padding.xxxl,
    marginHorizontal: SIZES.spacing.xs,
    ...SHADOWS.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding.xxxl,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SIZES.padding.medium,
  },
  subtitle: {
    ...FONTS.body1,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: SIZES.lineHeight.medium,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: SIZES.padding.xl,
  },
  inputLabel: {
    ...FONTS.label,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.small,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.input.border,
    borderRadius: SIZES.radius.large,
    paddingHorizontal: SIZES.padding.xl,
    height: SIZES.height.input,
    backgroundColor: COLORS.input.background,
    ...SHADOWS.small,
  },
  input: {
    flex: 1,
    marginLeft: SIZES.padding.medium,
    ...FONTS.body1,
    color: COLORS.text.primary,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.large,
    paddingVertical: SIZES.padding.xl,
    alignItems: 'center',
    marginTop: SIZES.padding.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.primary,
  },
  buttonDisabled: {
    backgroundColor: COLORS.text.light,
    ...SHADOWS.small,
  },
  loginButtonText: {
    ...FONTS.button,
    color: COLORS.white,
  },
  buttonIcon: {
    marginLeft: SIZES.padding.small,
  },
  backToEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.padding.xl,
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
    paddingVertical: SIZES.padding.xl,
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
  // Estilos para foto
  photoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding.xl,
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: SIZES.radius.full,
    backgroundColor: COLORS.input.background,
    borderWidth: 3,
    borderColor: COLORS.input.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding.xl,
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
    marginBottom: SIZES.padding.xl,
  },
  photoImage: {
    width: 200,
    height: 200,
    borderRadius: SIZES.radius.full,
    marginBottom: SIZES.padding.medium,
    ...SHADOWS.medium,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding.medium,
    paddingVertical: SIZES.padding.small,
    borderRadius: SIZES.radius.medium,
    ...SHADOWS.small,
  },
  retakeButtonText: {
    ...FONTS.buttonSmall,
    color: COLORS.white,
    marginLeft: SIZES.padding.small,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding.xl,
    gap: SIZES.spacing.medium,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding.xl,
    borderRadius: SIZES.radius.large,
    ...SHADOWS.primary,
  },
  galleryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.none,
  },
  photoButtonText: {
    ...FONTS.button,
    color: COLORS.white,
    marginLeft: SIZES.padding.small,
  },
  // Estilos para welcome
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding.xl,
    paddingVertical: SIZES.padding.large,
  },
  welcomeText: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.small,
  },
  welcomeSubtext: {
    ...FONTS.body2,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});