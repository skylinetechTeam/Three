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
  Image,
  Alert,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import supabaseDriverService from '../services/supabaseDriverService';
import { COLORS, SIZES, FONTS, SHADOWS } from "../config/theme";

export default function DriverLoginScreenSupabase({ navigation }) {
  const [emailOrPhone, setEmailOrPhone] = useState("912345678");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [driverPhoto, setDriverPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados do fluxo
  const [currentStep, setCurrentStep] = useState('ENTER_EMAIL'); // ENTER_EMAIL, TAKE_PHOTO, SET_PASSWORD, ENTER_PASSWORD
  const [driverData, setDriverData] = useState(null);

  // Passo 1: Verificar se motorista existe e determinar próximo passo
  const handleCheckDriver = async () => {
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
      const result = await supabaseDriverService.checkDriverLoginStatus(emailOrPhone.trim());
      
      if (!result.success) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: result.error,
        });
        return;
      }

      const status = result.data;

      if (!status.exists) {
        Toast.show({
          type: "error",
          text1: "Motorista não encontrado",
          text2: "Email ou telefone não encontrado no sistema.",
        });
        return;
      }

      // Salvar dados do motorista
      setDriverData(status);

      // Determinar próximo passo baseado no retorno da função SQL
      switch (status.next_step) {
        case 'TAKE_PHOTO':
          setCurrentStep('TAKE_PHOTO');
          Toast.show({
            type: "info",
            text1: `Olá, ${status.name}!`,
            text2: "Primeiro, vamos tirar sua foto.",
          });
          break;
        
        case 'SET_PASSWORD':
          setCurrentStep('SET_PASSWORD');
          Toast.show({
            type: "info",
            text1: `Bem-vindo, ${status.name}!`,
            text2: "Agora defina sua senha de acesso.",
          });
          break;
        
        case 'ENTER_PASSWORD':
          setCurrentStep('ENTER_PASSWORD');
          Toast.show({
            type: "info",
            text1: `Olá, ${status.name}!`,
            text2: "Digite sua senha para continuar.",
          });
          break;
        
        default:
          Toast.show({
            type: "error",
            text1: "Erro",
            text2: "Status desconhecido do motorista.",
          });
      }

    } catch (error) {
      console.error('Erro ao verificar motorista:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Erro ao verificar motorista. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: Tirar foto do motorista
  const takePhoto = async () => {
    try {
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
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos da permissão da galeria para selecionar sua foto.'
        );
        return;
      }

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

  // Salvar foto e avançar
  const handleSavePhoto = async () => {
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
      const result = await supabaseDriverService.saveDriverPhoto(emailOrPhone, driverPhoto);
      
      if (!result.success) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: result.error,
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Foto salva!",
        text2: "Agora vamos definir sua senha.",
      });

      // Avançar para definir senha
      setCurrentStep('SET_PASSWORD');

    } catch (error) {
      console.error('Erro ao salvar foto:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Erro ao salvar foto. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Passo 3: Definir nova senha
  const handleSetPassword = async () => {
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
      const result = await supabaseDriverService.setDriverPassword(emailOrPhone, newPassword);
      
      if (!result.success) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: result.error,
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Senha definida!",
        text2: "Fazendo login automaticamente...",
      });

      // Fazer login automaticamente com a nova senha
      await handleLogin(newPassword);

    } catch (error) {
      console.error('Erro ao definir senha:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Erro ao definir senha. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Passo 4: Login com senha
  const handleLogin = async (passwordToUse = password) => {
    if (!passwordToUse) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Por favor, digite sua senha.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await supabaseDriverService.authenticateDriver(emailOrPhone, passwordToUse);
      
      if (!result.success) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: result.data?.message || result.error,
        });
        return;
      }

      const authData = result.data;
      
      if (!authData.success) {
        Toast.show({
          type: "error",
          text1: "Erro de Login",
          text2: authData.message,
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Bem-vindo!",
        text2: `Olá, ${authData.driver.name}!`,
      });

      // Navegar para a área do motorista
      navigation.reset({ index: 0, routes: [{ name: "DriverTabs" }] });

    } catch (error) {
      console.error('Erro ao fazer login:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Erro ao fazer login. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Voltar ao passo anterior
  const goBack = () => {
    switch (currentStep) {
      case 'TAKE_PHOTO':
        setCurrentStep('ENTER_EMAIL');
        break;
      case 'SET_PASSWORD':
        if (driverData?.has_photo) {
          setCurrentStep('ENTER_EMAIL');
        } else {
          setCurrentStep('TAKE_PHOTO');
        }
        break;
      case 'ENTER_PASSWORD':
        setCurrentStep('ENTER_EMAIL');
        break;
      default:
        navigation.goBack();
    }
  };

  // Renderizar step atual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'ENTER_EMAIL':
        return renderEmailStep();
      case 'TAKE_PHOTO':
        return renderPhotoStep();
      case 'SET_PASSWORD':
        return renderSetPasswordStep();
      case 'ENTER_PASSWORD':
        return renderLoginStep();
      default:
        return renderEmailStep();
    }
  };

  const renderEmailStep = () => (
    <>
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
            editable={!loading}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.loginButton, loading && styles.disabledButton]} 
        onPress={handleCheckDriver}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>
          {loading ? "Verificando..." : "Continuar"}
        </Text>
        <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={styles.buttonIcon} />
      </TouchableOpacity>
    </>
  );

  const renderPhotoStep = () => (
    <>
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

      {driverPhoto && (
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.disabledButton]} 
          onPress={handleSavePhoto}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? "Salvando..." : "Continuar"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={styles.buttonIcon} />
        </TouchableOpacity>
      )}
    </>
  );

  const renderSetPasswordStep = () => (
    <>
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
            secureTextEntry={!showNewPassword}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
            <Ionicons
              name={showNewPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.gray}
            />
          </TouchableOpacity>
        </View>
      </View>

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
            editable={!loading}
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

      <TouchableOpacity 
        style={[styles.loginButton, loading && styles.disabledButton]} 
        onPress={handleSetPassword}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>
          {loading ? "Definindo..." : "Definir Senha e Entrar"}
        </Text>
        <Ionicons name="checkmark-circle" size={20} color={COLORS.white} style={styles.buttonIcon} />
      </TouchableOpacity>
    </>
  );

  const renderLoginStep = () => (
    <>
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
            editable={!loading}
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

      <TouchableOpacity 
        style={[styles.loginButton, loading && styles.disabledButton]} 
        onPress={() => handleLogin()}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>
          {loading ? "Entrando..." : "Entrar"}
        </Text>
        <Ionicons name="log-in" size={20} color={COLORS.white} style={styles.buttonIcon} />
      </TouchableOpacity>
    </>
  );

  const getTitle = () => {
    switch (currentStep) {
      case 'ENTER_EMAIL': return "Área do Motorista";
      case 'TAKE_PHOTO': return "Tirar Foto";
      case 'SET_PASSWORD': return "Definir Senha";
      case 'ENTER_PASSWORD': return "Digite sua Senha";
      default: return "Área do Motorista";
    }
  };

  const getSubtitle = () => {
    switch (currentStep) {
      case 'ENTER_EMAIL': return "Digite seu email ou telefone cadastrado";
      case 'TAKE_PHOTO': return "Tire uma foto para seu perfil de motorista";
      case 'SET_PASSWORD': return "Crie uma senha segura para acessar sua conta";
      case 'ENTER_PASSWORD': return "Digite sua senha para continuar";
      default: return "";
    }
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Ionicons name="car-sport" size={40} color={COLORS.white} />
              </View>
            </View>
          </View>

          {/* Container principal */}
          <View style={styles.mainContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>{getSubtitle()}</Text>
            </View>

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
    borderRadius: 24,
    padding: SIZES.padding.xlarge,
    marginBottom: SIZES.padding.xlarge,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
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
    backgroundColor: COLORS.input?.background || '#f8f9fa',
  },
  input: {
    flex: 1,
    marginLeft: SIZES.padding.medium,
    ...FONTS.body1,
    color: COLORS.text.primary,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: SIZES.padding.large,
    alignItems: 'center',
    marginTop: SIZES.padding.large,
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
    opacity: 0.7,
  },
  loginButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
    fontWeight: '600',
  },
  buttonIcon: {
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
  // Estilos para foto
  photoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding.large,
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f8f9fa',
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
    borderRadius: 12,
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
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding.large,
    borderRadius: 16,
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
});