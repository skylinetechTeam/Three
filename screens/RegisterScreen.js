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
} from "react-native";
import Toast from "react-native-toast-message";
import { supabase } from "../supabaseClient";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, FONTS, COMMON_STYLES } from "../config/theme";

export default function RegisterScreen({ navigation }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Função para registrar um novo usuário
  const handleRegister = async () => {
    if (!nome || !telefone || !password) {
      Toast.show({
        type: "error",
        text1: "Erro ao registrar",
        text2: "Por favor, preencha todos os campos.",
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Erro ao registrar",
        text2: "As senhas não coincidem.",
      });
      return;
    }

    try {
      // Inserir dados diretamente na tabela 'usuarios'
      const { data, error } = await supabase
        .from("usuarios")
        .insert([
          {
            nome: nome,
            telefone: telefone,
            senha: password, // Armazenando a senha diretamente, lembre-se de usar criptografia em produção
          },
        ]);

      if (error) {
        Toast.show({
          type: "error",
          text1: "Erro ao registrar",
          text2: "Não foi possível criar sua conta. Tente novamente.",
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Conta criada com sucesso!",
          text2: `Bem-vindo, ${nome}!`,
        });
        navigation.navigate("Login"); // Navega para a tela de login
      }
    } catch (err) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Algo deu errado. Tente novamente.",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={COMMON_STYLES.container}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView 
        contentContainerStyle={COMMON_STYLES.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={COMMON_STYLES.header}>
          <Text style={styles.welcomeText}>Junte-se ao</Text>
          <Text style={styles.headerText}>Travel</Text>
        </View>

        {/* Card de registro */}
        <View style={COMMON_STYLES.card}>
          <View style={COMMON_STYLES.inputContainer}>
            <Text style={styles.title}>Criar nova conta</Text>
            
            <Text style={COMMON_STYLES.label}>Nome Completo</Text>
            <View style={COMMON_STYLES.inputWrapper}>
              <FontAwesome name="user" size={SIZES.iconMedium} color={COLORS.primary} style={COMMON_STYLES.inputIcon} />
              <TextInput
                style={COMMON_STYLES.textInput}
                placeholder="Digite seu nome completo"
                placeholderTextColor={COLORS.input.placeholder}
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <Text style={COMMON_STYLES.label}>Telefone</Text>
            <View style={COMMON_STYLES.inputWrapper}>
              <FontAwesome name="phone" size={SIZES.iconMedium} color={COLORS.primary} style={COMMON_STYLES.inputIcon} />
              <TextInput
                style={COMMON_STYLES.textInput}
                keyboardType="phone-pad"
                placeholder="Digite seu telefone"
                placeholderTextColor={COLORS.input.placeholder}
                value={telefone}
                onChangeText={setTelefone}
              />
            </View>

            <Text style={COMMON_STYLES.label}>Senha</Text>
            <View style={COMMON_STYLES.inputWrapper}>
              <FontAwesome name="lock" size={SIZES.iconMedium} color={COLORS.primary} style={COMMON_STYLES.inputIcon} />
              <TextInput
                style={[COMMON_STYLES.textInput, { flex: 1 }]}
                secureTextEntry={!showPassword}
                placeholder="Digite sua senha"
                placeholderTextColor={COLORS.input.placeholder}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={SIZES.iconMedium} 
                  color={COLORS.primary} 
                />
              </TouchableOpacity>
            </View>

            <Text style={COMMON_STYLES.label}>Confirmar Senha</Text>
            <View style={COMMON_STYLES.inputWrapper}>
              <FontAwesome name="lock" size={SIZES.iconMedium} color={COLORS.primary} style={COMMON_STYLES.inputIcon} />
              <TextInput
                style={[COMMON_STYLES.textInput, { flex: 1 }]}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirme sua senha"
                placeholderTextColor={COLORS.input.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={SIZES.iconMedium}
                  color={COLORS.primary} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={COMMON_STYLES.primaryButton} onPress={handleRegister}>
              <Text style={COMMON_STYLES.primaryButtonText}>Criar Conta</Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Já tem uma conta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}> Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={COMMON_STYLES.footerText}>
          Ao registrar-te, estás a aceitar os nossos termos & condições, a
          reconhecer a nossa Política de Privacidade e a confirmar que tens mais
          de 18 anos.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  welcomeText: {
    fontSize: SIZES.large,
    color: COLORS.primaryLight,
    marginBottom: 5,
  },
  headerText: {
    fontSize: SIZES.xxlarge,
    ...FONTS.bold,
    color: COLORS.white,
  },
  title: {
    fontSize: SIZES.xlarge,
    ...FONTS.bold,
    color: COLORS.text.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  eyeIcon: {
    padding: SIZES.padding.small,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    fontSize: SIZES.medium,
    color: COLORS.text.secondary,
  },
  loginLink: {
    fontSize: SIZES.medium,
    color: COLORS.text.link,
    ...FONTS.bold,
  },
});
