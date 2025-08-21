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
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import LocalDatabase from "../services/localDatabase";
import { COLORS, SIZES, FONTS, SHADOWS, COMMON_STYLES } from "../config/theme";

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
          telefone: '+244 900 000 000',
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
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
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isSettingPassword ? "Definir Nova Senha" : "Área do Motorista"}
          </Text>
          <Text style={styles.subtitle}>
            {isSettingPassword 
              ? "Crie uma senha segura para acessar sua conta"
              : "Digite seu email ou telefone cadastrado"
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
                    <Ionicons name="person-outline" size={20} color={COLORS.gray} />
                    <TextInput
                      style={styles.input}
                      placeholder="Digite seu email ou telefone"
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
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} />
                    <TextInput
                      style={styles.input}
                      placeholder="Digite sua nova senha"
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.padding,
  },
  header: {
    paddingTop: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...FONTS.h1,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SIZES.base,
  },
  subtitle: {
    ...FONTS.body3,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  inputLabel: {
    ...FONTS.body3,
    color: COLORS.black,
    marginBottom: SIZES.base,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    height: 50,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  input: {
    flex: 1,
    marginLeft: SIZES.base,
    ...FONTS.body3,
    color: COLORS.black,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
    marginTop: SIZES.padding,
    ...SHADOWS.medium,
  },
  loginButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  backToEmailButton: {
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  backToEmailText: {
    ...FONTS.body3,
    color: COLORS.primary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SIZES.padding * 2,
  },
  footerText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});