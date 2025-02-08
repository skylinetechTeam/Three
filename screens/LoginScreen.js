import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import Toast from "react-native-toast-message";
import { supabase } from "../supabaseClient";

export default function LoginScreen({ navigation }) {
  const [telefone, settelefone] = useState("");
  const [password, setPassword] = useState("");

  // Função para verificar se o usuário existe
  // const handleLogin = async () => {
  //   if (!telefone || !password) {
  //      Toast.show({
  //         type: "error",
  //         text1: "Erro ao iniciar sessão",
  //         text2: "Por favor, preencha todos os campos.",
  //       });
  //     return;
  //   }

  //   try {
  //     const { data, error } = await supabase
  //       .from("usuarios")
  //       .select("nome")
  //       .eq("telefone", telefone)
  //       .eq("senha", password) 
       

  //     if (error || data.length === 0) {
  //       Toast.show({
  //         type: "error",
  //         text1: "Erro ao iniciar sessão",
  //         text2: "Usuário não encontrado. Por favor, registre-se.",
  //       });
  //     } else {
  //       console.log(data);
  //       Toast.show({
  //         type: "success",
  //         text1: "Bem-vindo!",
  //         text2: `Olá, ${data[0].nome}!`,
  //       });

  //       navigation.navigate("HomeTabs");

       
        
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     Toast.show({
  //       type: "error",
  //       text1: "Erro",
  //       text2: "Algo deu errado. Tente novamente.",
  //     });
  //   }
  // };

  //Fixed User
  const handleLogin = async () => {
    const userFixo = {
      telefone: "934551088",
      senha: "12345678",
      nome: "Fixed One"
    };
  
    if (telefone === userFixo.telefone && password === userFixo.senha) {
      Toast.show({
        type: "success",
        text1: "Bem-vindo!",
        text2: `Olá, ${userFixo.nome}!`,
      });
  
      navigation.navigate("HomeTabs");
      return;
    }
  
    Toast.show({
      type: "error",
      text1: "Erro ao iniciar sessão",
      text2: "Credenciais inválidas.",
    });
  };

  return (
    <View style={styles.container}>
      {/* Toast para mensagens */}
     

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Bem vindo ao Travel</Text>
      </View>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Escreva o teu telefone</Text>
        <TextInput
          style={styles.textInput}
          keyboardType="phone-pad"
          placeholder="Digite seu telefone"
          placeholderTextColor="#ccc"
          value={telefone}
          onChangeText={settelefone}
        />
        <Text style={styles.label}>Escreva a tua senha</Text>
        <TextInput
          style={styles.textInput}
          secureTextEntry
          placeholder="Digite sua senha"
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Iniciar sessão</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate("Register")}>
          
          <Text style={styles.loginButtonText}>Criar Conta</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footerText}>
        Ao registrar-te, estás a aceitar os nossos termos & condições, a
        reconhecer a nossa Política de Privacidade e a confirmar que tens mais
        de 18 anos. Podes cancelar a subscrição a qualquer altura nas
        "Preferências de comunicação" no teu perfil da app.
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
  loginButton: {
    backgroundColor: "#1368f0",
    borderRadius: 20,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
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
