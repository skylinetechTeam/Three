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
  Dimensions,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Toast from "react-native-toast-message";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import LocalDatabase from "../services/localDatabase";

const { width, height } = Dimensions.get('window');

export default function DriverLoginScreen({ navigation }) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

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

      const emailMatch = (storedDriverProfile.email || '').toLowerCase() === input.toLowerCase();
      const phoneMatch = (storedDriverProfile.telefone || storedDriverProfile.phone || '') === input;

      if (!(emailMatch || phoneMatch)) {
        Toast.show({
          type: "error",
          text1: "Motorista não encontrado",
          text2: "Email ou telefone não encontrado no sistema.",
        });
        return;
      }

      // Se o motorista existe, permitir definir nova senha
      setIsSettingPassword(true);

    } catch (error) {
      console.error('Driver login error:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Tente novamente.",
      });
    }
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
      
      // Atualizar a senha do motorista
      await LocalDatabase.updateDriverProfile({
        password: newPassword,
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

  return (
    <LinearGradient
      colors={['#1F2937', '#374151', '#4B5563']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Logo/Icon */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialIcons name="local-taxi" size={48} color="#ffffff" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {isSettingPassword ? "Definir Nova Senha" : "Área do Motorista"}
            </Text>
            <Text style={styles.subtitle}>
              {isSettingPassword 
                ? "Crie uma senha segura para acessar sua conta"
                : "Digite 912345678 ou joao.motorista@email.com"
              }
            </Text>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {!isSettingPassword ? (
              <>
                {/* Email/Phone Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email ou Telefone</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                    <TextInput
                      style={styles.input}
                      placeholder="Digite seu email ou telefone"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
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
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* New Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nova Senha</Text>
                                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                    <TextInput
                      style={styles.input}
                      placeholder="Digite sua nova senha"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="rgba(255, 255, 255, 0.7)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirmar Senha</Text>
                                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirme sua nova senha"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="rgba(255, 255, 255, 0.7)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Set Password Button */}
                <TouchableOpacity style={styles.loginButton} onPress={handleSetNewPassword}>
                  <Text style={styles.loginButtonText}>Definir Senha e Entrar</Text>
                </TouchableOpacity>

                {/* Back Button */}
                <TouchableOpacity 
                  style={styles.backToEmailButton} 
                  onPress={() => setIsSettingPassword(false)}
                >
                  <Text style={styles.backToEmailText}>Voltar</Text>
                </TouchableOpacity>
              </>
            )}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#ffffff',
    placeholderTextColor: 'rgba(255, 255, 255, 0.6)',
  },
  loginButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5.46,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  backToEmailButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  backToEmailText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  linkText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});