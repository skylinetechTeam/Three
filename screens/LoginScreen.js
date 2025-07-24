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
import { COLORS, SIZES, FONTS, SHADOWS, COMMON_STYLES } from "../config/theme";

export default function LoginScreen({ navigation }) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Função para verificar se o usuário existe (usando dados mocados)
  const handleLogin = () => {
    if (!emailOrPhone || !password) {
       Toast.show({
          type: "error",
          text1: "Erro ao iniciar sessão",
          text2: "Por favor, preencha todos os campos.",
        });
      return;
    }

    // Dados mocados para teste
    const mockUsers = [
      { email: "teste@email.com", telefone: "+244123456789", senha: "123456", nome: "João Silva" },
      { email: "admin@travel.com", telefone: "+244987654321", senha: "admin123", nome: "Admin Travel" },
    ];

    // Verificar se o usuário existe nos dados mocados
    const user = mockUsers.find(u =>
      (u.email === emailOrPhone || u.telefone === emailOrPhone) && u.senha === password
    );

    if (!user) {
      Toast.show({
        type: "error",
        text1: "Erro ao iniciar sessão",
        text2: "Email/telefone ou senha incorretos.",
      });
    } else {
      console.log("Usuário logado:", user);
      Toast.show({
        type: "success",
        text1: "Bem-vindo!",
        text2: `Olá, ${user.nome}!`,
      });

      navigation.navigate("HomeTabs");
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
          {/* Title */}
          <Text style={styles.title}>Entrar</Text>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Email ou Telefone */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Email ou Número de telefone"
                placeholderTextColor="#9CA3AF"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Palavra passe"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Entrar</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>G</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-apple" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLink}>Inscrever-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 32,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#000',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#2563EB',
  },
  loginButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    backgroundColor: '#ffffff',
  },
  socialButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DB4437',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
