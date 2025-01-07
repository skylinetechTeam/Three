import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import Toast from "react-native-toast-message"; // Importação correta do Toast
import { supabase } from "../supabaseClient";

export default function RegisterScreen({ navigation }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");

  // Função para registrar um novo usuário
  const handleRegister = async () => {
    if (!nome || !telefone || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
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
    <View style={styles.container}>
      {/* Toast para mensagens */}
      <Toast />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Crie sua Conta</Text>
      </View>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nome Completo</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Digite seu nome"
          placeholderTextColor="#ccc"
          value={nome}
          onChangeText={setNome}
        />
        <Text style={styles.label}>Telefone</Text>
        <TextInput
          style={styles.textInput}
          keyboardType="phone-pad"
          placeholder="Digite seu telefone"
          placeholderTextColor="#ccc"
          value={telefone}
          onChangeText={setTelefone}
        />
        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.textInput}
          secureTextEntry
          placeholder="Digite sua senha"
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>Criar Conta</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footerText}>
        Ao registrar-te, estás a aceitar os nossos termos & condições, a
        reconhecer a nossa Política de Privacidade e a confirmar que tens mais
        de 18 anos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  header: {
    width: "200%",
    backgroundColor: "#003580",
    alignItems: "center",
    paddingVertical: 60,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  inputContainer: {
    width: "100%",
    marginTop: 30,
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
    marginBottom: 20,
    color: "#333",
  },
  registerButton: {
    backgroundColor: "#1368f0",
    borderRadius: 20,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 30,
  },
});
