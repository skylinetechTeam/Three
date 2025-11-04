import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import authService from "../services/authService";

export default function ResetPasswordScreen({ navigation, route = {} }) {
  const [email, setEmail] = useState(route?.params?.email || "");
  const [code, setCode] = useState(route?.params?.code || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim() || !code.trim() || !password || !confirmPassword) {
      Toast.show({ type: "error", text1: "Erro", text2: "Preencha todos os campos." });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: "error", text1: "Erro", text2: "As senhas não coincidem." });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: "error", text1: "Erro", text2: "A senha deve ter pelo menos 6 caracteres." });
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPasswordWithCode(email.trim(), code.trim(), password);
      Toast.show({ type: "success", text1: "Senha atualizada", text2: "Você já pode entrar com a nova senha." });
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      Toast.show({ type: "error", text1: "Erro", text2: error.message || "Não foi possível redefinir a senha." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>voltar</Text>
          </View>

          <Text style={styles.title}>Definir nova senha</Text>
          <Text style={styles.subtitle}>Digite o código recebido por email e a nova senha</Text>

          <View style={styles.formContainer}>
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

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Código de verificação"
                placeholderTextColor="#9CA3AF"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Nova senha"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Confirmar nova senha"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.primaryButton, isLoading && styles.buttonDisabled]} onPress={handleReset} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Redefinir senha</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20 },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 10, paddingBottom: 10 },
  backButton: { marginRight: 8 },
  headerTitle: { fontSize: 16, color: "#000" },
  title: { fontSize: 28, fontWeight: "bold", color: "#000", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#6B7280", marginBottom: 24 },
  formContainer: { flex: 1 },
  inputContainer: { marginBottom: 16, position: "relative" },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#000",
  },
  eyeButton: { position: "absolute", right: 16, top: 16 },
  primaryButton: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  buttonDisabled: { backgroundColor: "#93C5FD", opacity: 0.7 },
});