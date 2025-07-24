import React, { useState, useRef, useEffect } from "react";
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

export default function PhoneVerificationScreen({ navigation, route = {} }) {
  const [code, setCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Timer para reenvio do código
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleCodeChange = (value, index) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus no próximo input
    if (value && index < 3) {
      inputRefs.current[index + 1].focus();
    }

    // Auto-verificar quando todos os campos estiverem preenchidos
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 4) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    // Voltar para o input anterior ao pressionar backspace
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = (verificationCode = null) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 4) {
      Toast.show({
        type: "error",
        text1: "Código incompleto",
        text2: "Por favor, digite o código de 4 dígitos.",
      });
      return;
    }

    // Simular verificação (código mocado: 1234)
    if (codeToVerify === '1234') {
      Toast.show({
        type: "success",
        text1: "Telefone verificado!",
        text2: "Sua conta foi criada com sucesso.",
      });
      
      // Navegar para a tela principal
      navigation.navigate("HomeTabs");
    } else {
      Toast.show({
        type: "error",
        text1: "Código incorreto",
        text2: "O código digitado está incorreto. Tente novamente.",
      });
      
      // Limpar os campos
      setCode(['', '', '', '']);
      inputRefs.current[0].focus();
    }
  };

  const handleResendCode = () => {
    if (canResend) {
      // Simular reenvio do código
      Toast.show({
        type: "success",
        text1: "Código reenviado",
        text2: "Um novo código foi enviado para seu telefone.",
      });
      
      // Resetar timer
      setTimer(60);
      setCanResend(false);
      setCode(['', '', '', '']);
      inputRefs.current[0].focus();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <Text style={styles.title}>Verificação de telefone</Text>
          <Text style={styles.subtitle}>Digite seu código OTP</Text>
          
          {/* Code Input Container */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          {/* Resend Section */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Não recebeu o código? </Text>
            <TouchableOpacity 
              onPress={handleResendCode}
              disabled={!canResend}
            >
              <Text style={[
                styles.resendLink,
                !canResend && styles.resendLinkDisabled
              ]}>
                {canResend ? 'Reenviar novamente' : `Reenviar em ${formatTime(timer)}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            style={[
              styles.continueButton,
              code.every(digit => digit !== '') ? styles.continueButtonActive : styles.continueButtonInactive
            ]} 
            onPress={() => handleVerify()}
            disabled={!code.every(digit => digit !== '')}
          >
            <Text style={[
              styles.continueButtonText,
              code.every(digit => digit !== '') ? styles.continueButtonTextActive : styles.continueButtonTextInactive
            ]}>
              Continuar
            </Text>
          </TouchableOpacity>
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
    marginBottom: 48,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  codeInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: '#ffffff',
  },
  codeInputFilled: {
    borderColor: '#2563EB',
    backgroundColor: '#F3F4F6',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: '#9CA3AF',
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
  continueButtonActive: {
    backgroundColor: '#2563EB',
  },
  continueButtonInactive: {
    backgroundColor: '#E5E7EB',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextActive: {
    color: '#ffffff',
  },
  continueButtonTextInactive: {
    color: '#9CA3AF',
  },
});
