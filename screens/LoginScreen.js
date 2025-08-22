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
import apiService from "../services/apiService";
import { COLORS, SIZES, FONTS, SHADOWS, COMMON_STYLES } from "../config/theme";

export default function LoginScreen({ navigation }) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Login usando dados salvos no dispositivo
  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
       Toast.show({
          type: "error",
          text1: "Erro ao iniciar sessão",
          text2: "Por favor, preencha todos os campos.",
        });
      return;
    }

    try {
      const input = (emailOrPhone || '').trim();
      const typedPassword = (password || '').trim();

      const storedProfile = await LocalDatabase.getUserProfile();

      if (!storedProfile) {
        Toast.show({
          type: "error",
          text1: "Conta não encontrada",
          text2: "Crie uma conta primeiro.",
        });
        return;
      }

      const emailMatch = (storedProfile.email || '').toLowerCase() === input.toLowerCase();
      const phoneMatch = (storedProfile.telefone || storedProfile.phone || '') === input;
      const passwordMatch = (storedProfile.password || '') === typedPassword;

      if (!passwordMatch || !(emailMatch || phoneMatch)) {
        Toast.show({
          type: "error",
          text1: "Erro ao iniciar sessão",
          text2: "Email/telefone ou senha incorretos.",
        });
        return;
      }

      await LocalDatabase.updateUserProfile({
        isLoggedIn: true,
        lastLogin: new Date().toISOString(),
      });
      
      // Get or create passenger profile and connect to API
      let passengerProfile = await LocalDatabase.getPassengerProfile();
      
      if (!passengerProfile) {
        passengerProfile = {
          name: storedProfile.nome,
          phone: storedProfile.telefone,
          email: storedProfile.email,
          preferredPaymentMethod: 'cash',
          password: storedProfile.password,
          isLoggedIn: true,
          apiRegistered: false,
        };
        await LocalDatabase.savePassengerProfile(passengerProfile);
      }
      
      // Connect to API socket if registered
      if (passengerProfile.apiPassengerId) {
        try {
          apiService.connectSocket('passenger', passengerProfile.apiPassengerId);
        } catch (socketError) {
          console.warn('Socket connection failed:', socketError);
        }
      }

      Toast.show({
        type: "success",
        text1: "Bem-vindo!",
        text2: `Olá, ${storedProfile.nome || storedProfile.fullName || storedProfile.email}!`,
      });

      navigation.reset({ index: 0, routes: [{ name: "HomeTabs" }] });
    } catch (error) {
      console.error('Login error:', error);
      Toast.show({
        type: "error",
        text1: "Erro ao iniciar sessão",
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

            {/* Driver Access */}
            <View style={styles.driverContainer}>
              <TouchableOpacity 
                style={styles.driverButton}
                onPress={() => navigation.navigate("DriverLogin")}
              >
                <Ionicons name="car-outline" size={20} color="#2563EB" />
                <Text style={styles.driverButtonText}>Sou motorista</Text>
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
  driverContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  driverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  driverButtonText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
    marginLeft: 8,
  },
});
