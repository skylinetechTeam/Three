import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import authService from "../services/authService";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Toast.show({ type: "error", text1: "Erro", text2: "Informe o email cadastrado." });
      return;
    }

    setIsLoading(true);
    try {
      const { sent, code, viaEmail } = await authService.requestPasswordReset(email.trim());

      if (sent && viaEmail) {
        Toast.show({ type: "success", text1: "Código enviado", text2: "Verifique o seu email." });
        // Navega sem o código quando o email foi enviado com sucesso
        navigation.navigate("ResetPassword", { email: email.trim() });
      } else if (sent && !viaEmail) {
        // Envio de email não configurado/falhou: mostramos código para testes e pré-preenchemos
        Toast.show({ type: "info", text1: "Falha no envio de email", text2: `Use este código: ${code}` });
        navigation.navigate("ResetPassword", { email: email.trim(), code });
      }
    } catch (error) {
      console.error("Erro ao solicitar código:", error);
      Toast.show({ type: "error", text1: "Erro", text2: error.message || "Não foi possível enviar o código." });
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

          <Text style={styles.title}>Recuperar senha</Text>
          <Text style={styles.subtitle}>Digite o email cadastrado para enviarmos um código de verificação</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Seu email cadastrado"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={[styles.primaryButton, isLoading && styles.buttonDisabled]} onPress={handleSendCode} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Enviar código</Text>}
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
  primaryButton: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  buttonDisabled: { backgroundColor: "#93C5FD", opacity: 0.7 },
});