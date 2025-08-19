import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const PrivacyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1737e8', '#1e4fd8', '#2a5fd8']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidade</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Como Protegemos Seus Dados</Text>
          <Text style={styles.sectionText}>
            Sua privacidade é fundamental para nós. Esta política descreve como coletamos, 
            usamos e protegemos suas informações pessoais.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações que Coletamos</Text>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.listText}>Dados de perfil (nome, email, telefone)</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.listText}>Localização durante o uso do app</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.listText}>Histórico de viagens e pagamentos</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.listText}>Dados de dispositivo e uso</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Como Usamos Suas Informações</Text>
          <Text style={styles.sectionText}>
            Utilizamos suas informações para:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="arrow-forward" size={16} color="#6B7280" />
            <Text style={styles.listText}>Fornecer serviços de transporte</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="arrow-forward" size={16} color="#6B7280" />
            <Text style={styles.listText}>Processar pagamentos</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="arrow-forward" size={16} color="#6B7280" />
            <Text style={styles.listText}>Melhorar nossos serviços</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="arrow-forward" size={16} color="#6B7280" />
            <Text style={styles.listText}>Enviar notificações importantes</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proteção de Dados</Text>
          <Text style={styles.sectionText}>
            Implementamos medidas de segurança rigorosas para proteger suas informações:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Criptografia de dados em trânsito</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Acesso restrito a funcionários autorizados</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Monitoramento contínuo de segurança</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compartilhamento de Dados</Text>
          <Text style={styles.sectionText}>
            Não vendemos, alugamos ou compartilhamos suas informações pessoais com 
            terceiros, exceto quando necessário para fornecer nossos serviços ou 
            quando exigido por lei.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seus Direitos</Text>
          <Text style={styles.sectionText}>
            Você tem o direito de:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="person" size={20} color="#8B5CF6" />
            <Text style={styles.listText}>Acessar suas informações pessoais</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="person" size={20} color="#8B5CF6" />
            <Text style={styles.listText}>Corrigir dados incorretos</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="person" size={20} color="#8B5CF6" />
            <Text style={styles.listText}>Solicitar exclusão de dados</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="person" size={20} color="#8B5CF6" />
            <Text style={styles.listText}>Revogar consentimento</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contato</Text>
          <Text style={styles.sectionText}>
            Se você tiver dúvidas sobre esta política de privacidade ou sobre como 
            tratamos seus dados, entre em contato conosco:
          </Text>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <Text style={styles.contactText}>privacy@threeapp.com</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <Text style={styles.contactText}>+244 123 456 789</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atualizações</Text>
          <Text style={styles.sectionText}>
            Esta política pode ser atualizada periodicamente. Notificaremos sobre 
            mudanças significativas através do app ou por email.
          </Text>
          <Text style={styles.lastUpdated}>
            Última atualização: Janeiro 2024
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listText: {
    fontSize: 15,
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#4B5563',
    marginLeft: 12,
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default PrivacyScreen;

