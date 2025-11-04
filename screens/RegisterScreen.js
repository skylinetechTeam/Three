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
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS, SIZES, FONTS, COMMON_STYLES } from "../config/theme";
import authService from "../services/authService";
import apiService from "../services/apiService";
import { supabase } from '../supabaseClient';

export default function RegisterScreen({ navigation }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [countryCode, setCountryCode] = useState("+244");
  const [isLoading, setIsLoading] = useState(false);

  // Função para registrar um novo usuário e seguir para definir senha
  const handleRegister = async () => {
    if (isLoading) return;

    if (!nome || !telefone) {
      Toast.show({
        type: "error",
        text1: "Erro ao registrar",
        text2: "Nome e telefone são obrigatórios.",
      });
      return;
    }

    if (!acceptTerms) {
      Toast.show({
        type: "error",
        text1: "Erro ao registrar",
        text2: "Você deve aceitar os termos de serviço.",
      });
      return;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Toast.show({
          type: "error",
          text1: "Erro ao registrar",
          text2: "Por favor, insira um email válido.",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Verifica se já existe usuário com este email ou telefone
      const completePhone = countryCode + telefone;
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${email},telefone.eq.${completePhone}`)
        .single();

      if (existingUser) {
        Toast.show({
          type: "error",
          text1: "Erro ao registrar",
          text2: "Email ou telefone já cadastrado.",
        });
        return;
      }

      // vai para a tela de definir senha com os dados preenchidos
      navigation.navigate("SetPassword", {
        userData: {
          nome,
          email,
          telefone: completePhone,
        },
      });
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      Toast.show({
        type: "error",
        text1: "Erro ao registrar",
        text2: "Ocorreu um erro. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
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
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>voltar</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Criar conta</Text>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Nome */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Nome"
                placeholderTextColor="#9CA3AF"
                value={nome}
                onChangeText={setNome}
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Telefone com código do país melhorado */}
            <View style={styles.phoneContainer}>
              <TouchableOpacity style={styles.countrySelector}>
                <Text style={styles.flag}>🇦🇴</Text>
                <Text style={styles.countryCode}>{countryCode}</Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Teu número de telefone"
                  placeholderTextColor="#9CA3AF"
                  value={telefone}
                  onChangeText={setTelefone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Terms Checkbox */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  Aceito os termos e condições e{" "}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                  <Text style={styles.termsLink}>Termos de serviço</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> e </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
                  <Text style={styles.termsLink}>Política de Privacidade</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Create Account Button */}
            <TouchableOpacity 
              style={[styles.createButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Criar conta</Text>
              )}
            </TouchableOpacity>


            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Entrar</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    color: '#000',
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
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    minWidth: 100,
  },
  flag: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 16,
    color: '#000',
    marginRight: 6,
    fontWeight: '500',
  },
  phoneInputContainer: {
    flex: 1,
    marginLeft: 8,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#000',
  },

  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkboxContainer: {
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  termsLink: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  createButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
    opacity: 0.7,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
