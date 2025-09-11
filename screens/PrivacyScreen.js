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

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
            <Text style={styles.listText}>Localização em tempo real para funcionamento do serviço</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.listText}>Histórico de viagens e pagamentos</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.listText}>Dados de dispositivo e uso do aplicativo</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.listText}>Fotos e arquivos (para foto de perfil e documentos)</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.listText}>Informações de pagamento (processadas de forma segura)</Text>
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
          <Text style={styles.sectionTitle}>Permissões do Aplicativo</Text>
          <Text style={styles.sectionText}>
            Para fornecer nossos serviços, solicitamos as seguintes permissões:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="location" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Localização: necessária para encontrar motoristas e mostrar sua posição no mapa</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="camera" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Câmera e Fotos: para foto de perfil e envio de documentos</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="notifications" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Notificações: para atualizações de viagem e mensagens importantes</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="phone-portrait" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Estado do dispositivo: para otimização do serviço</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proteção de Dados</Text>
          <Text style={styles.sectionText}>
            Implementamos medidas de segurança rigorosas para proteger suas informações:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Criptografia de dados em trânsito e armazenamento</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Acesso restrito a funcionários autorizados</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Monitoramento contínuo de segurança</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Backups regulares e proteção contra perdas</Text>
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
            <Text style={styles.contactText}>threecompanyofangola@gmail.com</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <Text style={styles.contactText}>+244 975651828</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Retenção de Dados</Text>
          <Text style={styles.sectionText}>
            Mantemos seus dados apenas pelo tempo necessário para:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="time" size={20} color="#6B7280" />
            <Text style={styles.listText}>Cumprir obrigações legais e regulatórias</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="time" size={20} color="#6B7280" />
            <Text style={styles.listText}>Resolver disputas e prevenir fraudes</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="time" size={20} color="#6B7280" />
            <Text style={styles.listText}>Manter registros de transações conforme exigido por lei</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidade de Crianças</Text>
          <Text style={styles.sectionText}>
            Nossos serviços não são direcionados a menores de 18 anos. Não coletamos 
            intencionalmente informações pessoais de crianças. Se você acredita que 
            coletamos dados de um menor, entre em contato conosco imediatamente.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços de Terceiros</Text>
          <Text style={styles.sectionText}>
            Utilizamos serviços de terceiros confiáveis para:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="link" size={20} color="#8B5CF6" />
            <Text style={styles.listText}>Processamento seguro de pagamentos</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="link" size={20} color="#8B5CF6" />
            <Text style={styles.listText}>Serviços de mapas e localização</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="link" size={20} color="#8B5CF6" />
            <Text style={styles.listText}>Análise de uso do aplicativo</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transferências Internacionais</Text>
          <Text style={styles.sectionText}>
            Seus dados podem ser processados em servidores localizados fora do seu país. 
            Garantimos que essas transferências sejam realizadas com medidas de segurança 
            adequadas e em conformidade com as leis de proteção de dados aplicáveis.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atualizações</Text>
          <Text style={styles.sectionText}>
            Esta política pode ser atualizada periodicamente. Notificaremos sobre 
            mudanças significativas através do app ou por email. Ao continuar usando 
            nossos serviços após as alterações, você concorda com a política atualizada.
          </Text>
          <Text style={styles.lastUpdated}>
            Última atualização: Setembro 2025
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
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

