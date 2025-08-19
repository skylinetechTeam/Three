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

const TermsScreen = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Termos de Uso</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aceitação dos Termos</Text>
          <Text style={styles.sectionText}>
            Ao usar o aplicativo Three, você concorda em cumprir e estar vinculado a estes 
            Termos de Uso. Se você não concordar com qualquer parte destes termos, 
            não deve usar nossos serviços.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição do Serviço</Text>
          <Text style={styles.sectionText}>
            O Three é uma plataforma de transporte que conecta passageiros a motoristas 
            de táxi e transportadores coletivos. Nossos serviços incluem:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="car-outline" size={20} color="#10B981" />
            <Text style={styles.listText}>Solicitação de viagens</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="car-outline" size={20} color="#10B981" />
            <Text style={styles.listText}>Rastreamento em tempo real</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="car-outline" size={20} color="#10B981" />
            <Text style={styles.listText}>Histórico de viagens</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="car-outline" size={20} color="#10B981" />
            <Text style={styles.listText}>Sistema de pagamento</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Elegibilidade</Text>
          <Text style={styles.sectionText}>
            Para usar nossos serviços, você deve:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Ter pelo menos 18 anos de idade</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Possuir capacidade legal para contratar</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Fornecer informações verdadeiras e precisas</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
            <Text style={styles.listText}>Cumprir todas as leis aplicáveis</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsabilidades do Usuário</Text>
          <Text style={styles.sectionText}>
            Como usuário, você é responsável por:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="alert-circle" size={20} color="#F59E0B" />
            <Text style={styles.listText}>Manter suas credenciais de login seguras</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="alert-circle" size={20} color="#F59E0B" />
            <Text style={styles.listText}>Fornecer informações precisas sobre localização</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="alert-circle" size={20} color="#F59E0B" />
            <Text style={styles.listText}>Respeitar motoristas e outros usuários</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="alert-circle" size={20} color="#F59E0B" />
            <Text style={styles.listText}>Pagar pelos serviços utilizados</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proibições</Text>
          <Text style={styles.sectionText}>
            É proibido usar nossos serviços para:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.listText}>Atividades ilegais ou fraudulentas</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.listText}>Assédio ou comportamento inadequado</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.listText}>Danificar propriedades ou veículos</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.listText}>Violar direitos de terceiros</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pagamentos e Taxas</Text>
          <Text style={styles.sectionText}>
            Os preços dos serviços são calculados com base na distância, tempo e 
            tipo de veículo. Todas as taxas são claramente exibidas antes da 
            confirmação da viagem.
          </Text>
          <Text style={styles.sectionText}>
            O pagamento é feito diretamente ao motorista em dinheiro (Kz) conforme 
            o valor acordado.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limitação de Responsabilidade</Text>
          <Text style={styles.sectionText}>
            O Three atua como intermediário entre passageiros e motoristas. Não somos 
            responsáveis por:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text style={styles.listText}>Conduta de motoristas terceiros</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text style={styles.listText}>Acidentes ou incidentes durante a viagem</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text style={styles.listText}>Perda ou dano a pertences pessoais</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rescisão</Text>
          <Text style={styles.sectionText}>
            Podemos suspender ou encerrar sua conta a qualquer momento por violação 
            destes termos ou por qualquer outro motivo a nosso critério.
          </Text>
          <Text style={styles.sectionText}>
            Você pode encerrar sua conta a qualquer momento através das configurações 
            do aplicativo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modificações</Text>
          <Text style={styles.sectionText}>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. 
            As mudanças entrarão em vigor imediatamente após a publicação.
          </Text>
          <Text style={styles.sectionText}>
            É sua responsabilidade revisar periodicamente os termos para estar 
            ciente de quaisquer alterações.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lei Aplicável</Text>
          <Text style={styles.sectionText}>
            Estes termos são regidos pelas leis de Angola. Qualquer disputa será 
            resolvida nos tribunais competentes de Luanda.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contato</Text>
          <Text style={styles.sectionText}>
            Para dúvidas sobre estes termos, entre em contato:
          </Text>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <Text style={styles.contactText}>terms@threeapp.com</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <Text style={styles.contactText}>+244 123 456 789</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aceitação</Text>
          <Text style={styles.sectionText}>
            Ao continuar usando o aplicativo, você confirma que leu, entendeu e 
            concorda com estes Termos de Uso.
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

export default TermsScreen;

