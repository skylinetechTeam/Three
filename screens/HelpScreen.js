import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HelpScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqCategories = [
    {
      id: 'account',
      title: 'Conta e Perfil',
      icon: 'person-outline',
      color: '#3B82F6',
      faqs: [
        {
          question: 'Como criar uma conta?',
          answer: 'Para criar uma conta, toque em "Cadastrar" na tela de login e preencha suas informações pessoais. Você receberá um código de verificação por SMS para confirmar seu número de telefone.',
        },
        {
          question: 'Como alterar minha senha?',
          answer: 'Vá em Configurações > Segurança > Alterar Senha. Você precisará inserir sua senha atual e depois criar uma nova senha.',
        },
        {
          question: 'Esqueci minha senha, o que fazer?',
          answer: 'Na tela de login, toque em "Esqueci minha senha" e siga as instruções para redefinir sua senha através do SMS.',
        },
      ],
    },
    {
      id: 'payment',
      title: 'Pagamentos',
      icon: 'card-outline',
      color: '#10B981',
      faqs: [
        {
          question: 'Quais métodos de pagamento são aceitos?',
          answer: 'Aceitamos dinheiro em mão, cartões de crédito/débito, PIX e carteira digital. Todos os pagamentos são seguros e protegidos.',
        },
        {
          question: 'Como funciona o pagamento em dinheiro?',
          answer: 'Ao escolher pagamento em dinheiro, prepare o valor exato da corrida. O motorista não carrega troco, então é importante ter o valor correto.',
        },
        {
          question: 'Posso cancelar um pagamento?',
          answer: 'Pagamentos processados não podem ser cancelados. Para cancelar uma corrida antes do início, use a opção "Cancelar" na tela de acompanhamento.',
        },
      ],
    },
    {
      id: 'rides',
      title: 'Corridas e Serviços',
      icon: 'car-outline',
      color: '#F59E0B',
      faqs: [
        {
          question: 'Como solicitar uma corrida?',
          answer: 'Na tela principal, digite seu destino, escolha o tipo de serviço e toque em "Solicitar". Um motorista será encontrado automaticamente.',
        },
        {
          question: 'Posso cancelar uma corrida?',
          answer: 'Sim, você pode cancelar uma corrida gratuitamente até 2 minutos após a solicitação. Após esse período, pode haver uma taxa de cancelamento.',
        },
        {
          question: 'Como avaliar o motorista?',
          answer: 'Após a corrida, você receberá uma notificação para avaliar o serviço. Use as estrelas para dar uma nota de 1 a 5 e adicione comentários se desejar.',
        },
      ],
    },
    {
      id: 'safety',
      title: 'Segurança',
      icon: 'shield-checkmark-outline',
      color: '#EF4444',
      faqs: [
        {
          question: 'Como garantir minha segurança?',
          answer: 'Todos os motoristas são verificados e têm suas informações registradas. Compartilhe sua viagem com amigos e use o botão de emergência se necessário.',
        },
        {
          question: 'O que fazer em caso de emergência?',
          answer: 'Use o botão de emergência na tela da corrida. Ele enviará sua localização para as autoridades e para contatos de emergência configurados.',
        },
        {
          question: 'Como denunciar um problema?',
          answer: 'Vá em Configurações > Suporte > Fale Conosco ou use o chat de suporte durante a corrida para reportar problemas.',
        },
      ],
    },
  ];

  const tutorials = [
    {
      id: '1',
      title: 'Primeiros Passos',
      subtitle: 'Aprenda a usar o app em 5 minutos',
      icon: 'play-circle-outline',
      duration: '5 min',
    },
    {
      id: '2',
      title: 'Solicitando Corridas',
      subtitle: 'Como pedir transporte de forma eficiente',
      icon: 'car-sport-outline',
      duration: '3 min',
    },
    {
      id: '3',
      title: 'Configurando Pagamentos',
      subtitle: 'Adicione seus métodos de pagamento',
      icon: 'wallet-outline',
      duration: '4 min',
    },
    {
      id: '4',
      title: 'Usando Recursos de Segurança',
      subtitle: 'Proteja-se durante suas viagens',
      icon: 'shield-outline',
      duration: '6 min',
    },
  ];

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.faqs.length > 0);

  const toggleFAQ = (faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleContactSupport = () => {
    // Aqui você navegaria para a tela de contato
    console.log('Navegando para suporte');
  };

  const handleTutorial = (tutorialId) => {
    // Aqui você abriria o tutorial
    console.log('Abrindo tutorial:', tutorialId);
  };

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
        <Text style={styles.headerTitle}>Central de Ajuda</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Barra de Pesquisa */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar ajuda..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tutoriais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tutoriais em Vídeo</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tutorialsScroll}
          >
            {tutorials.map((tutorial) => (
              <TouchableOpacity
                key={tutorial.id}
                style={styles.tutorialCard}
                onPress={() => handleTutorial(tutorial.id)}
              >
                <View style={styles.tutorialIcon}>
                  <Ionicons name={tutorial.icon} size={32} color="#1737e8" />
                </View>
                <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                <Text style={styles.tutorialSubtitle}>{tutorial.subtitle}</Text>
                <View style={styles.tutorialDuration}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={styles.durationText}>{tutorial.duration}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Perguntas Frequentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
          
          {filteredFAQs.map((category) => (
            <View key={category.id} style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon} size={24} color={category.color} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </View>
              
              {category.faqs.map((faq, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.faqItem}
                  onPress={() => toggleFAQ(`${category.id}-${index}`)}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons
                      name={expandedFAQ === `${category.id}-${index}` ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#6B7280"
                    />
                  </View>
                  {expandedFAQ === `${category.id}-${index}` && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Contato de Suporte */}
        <View style={styles.supportSection}>
          <View style={styles.supportCard}>
            <View style={styles.supportIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color="#1737e8" />
            </View>
            <Text style={styles.supportTitle}>Precisa de mais ajuda?</Text>
            <Text style={styles.supportSubtitle}>
              Nossa equipe está disponível 24/7 para ajudar você
            </Text>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={handleContactSupport}
            >
              <LinearGradient
                colors={['#1737e8', '#1e4fd8']}
                style={styles.supportButtonGradient}
              >
                <Text style={styles.supportButtonText}>Falar com Suporte</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  searchContainer: {
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  tutorialsScroll: {
    paddingRight: 20,
  },
  tutorialCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    width: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tutorialIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  tutorialSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  tutorialDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginRight: 16,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 12,
    paddingRight: 20,
  },
  supportSection: {
    marginBottom: 20,
  },
  supportCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  supportIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  supportSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  supportButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  supportButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  supportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HelpScreen;

