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

export default function SetPasswordScreen({ navigation, route = {} }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleContinue = () => {
    if (!password || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Por favor, preencha todos os campos.",
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "As senhas não coincidem.",
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    // Simular criação de conta e envio de código SMS
    Toast.show({
      type: "success",
      text1: "Código enviado!",
      text2: "Verifique seu telefone para o código de verificação.",
    });

    // Navegar para a tela de verificação de telefone
    navigation.navigate("PhoneVerification", {
      userData: route?.params?.userData || {},
      password: password
    });
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
          <Text style={styles.title}>Definir senha</Text>
          <Text style={styles.subtitle}>Defina a sua senha</Text>
          
          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Password */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Digite sua senha"
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

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Confirme sua senha"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
              Deve conter 6 caracteres com pelo menos uma letra maiúscula
            </Text>

            {/* Continue Button */}
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continuar</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
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
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
