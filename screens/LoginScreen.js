import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import Toast from "react-native-toast-message";
import { supabase } from "../supabaseClient";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, FONTS, SHADOWS, COMMON_STYLES } from "../config/theme";

export default function LoginScreen({ navigation }) {
  const [telefone, settelefone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Função para verificar se o usuário existe
  const handleLogin = async () => {
    if (!telefone || !password) {
       Toast.show({
          type: "error",
          text1: "Erro ao iniciar sessão",
          text2: "Por favor, preencha todos os campos.",
        });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("nome")
        .eq("telefone", telefone)
        .eq("senha", password) 
       

      if (error || data.length === 0) {
        Toast.show({
          type: "error",
          text1: "Erro ao iniciar sessão",
          text2: "Usuário não encontrado. Por favor, registre-se.",
        });
      } else {
        console.log(data);
        Toast.show({
          type: "success",
          text1: "Bem-vindo!",
          text2: `Olá, ${data[0].nome}!`,
        });

        navigation.navigate("HomeTabs");
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
        {/* Header com gradiente azul */}
        <View style={COMMON_STYLES.header}>
          <Text style={styles.welcomeText}>Bem-vindo ao</Text>
          <Text style={styles.headerText}>Travel</Text>
        </View>

        {/* Card de login */}
        <View style={COMMON_STYLES.card}>
          <View style={COMMON_STYLES.inputContainer}>
            <Text style={COMMON_STYLES.label}>Telefone</Text>
            <View style={COMMON_STYLES.inputWrapper}>
              <FontAwesome name="phone" size={SIZES.iconMedium} color={COLORS.primary} style={COMMON_STYLES.inputIcon} />
              <TextInput
                style={COMMON_STYLES.textInput}
                keyboardType="phone-pad"
                placeholder="Digite seu telefone"
                placeholderTextColor={COLORS.input.placeholder}
                value={telefone}
                onChangeText={settelefone}
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

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={COMMON_STYLES.primaryButton} onPress={handleLogin}>
              <Text style={COMMON_STYLES.primaryButtonText}>Iniciar sessão</Text>
            </TouchableOpacity>
            
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.divider} />
            </View>
            
            <TouchableOpacity 
              style={COMMON_STYLES.secondaryButton} 
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={COMMON_STYLES.secondaryButtonText}>Criar Conta</Text>
            </TouchableOpacity>
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
  eyeIcon: {
    padding: SIZES.padding.small,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: COLORS.text.link,
    fontSize: SIZES.font,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.text.tertiary,
    paddingHorizontal: 10,
    fontSize: SIZES.font,
  },
});
