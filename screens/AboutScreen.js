import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';

const AboutScreen = ({ navigation }) => {
  // Obter dimensões da tela para responsividade
  const { width, height } = useWindowDimensions();
  // Obter estilos responsivos baseados na largura atual da tela
  const responsiveStyles = getResponsiveStyles(width);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
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
        
        <Text style={[styles.headerTitle, {fontSize: responsiveStyles.fontSize.title}]}>Sobre o App</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.scrollContent, {maxWidth: responsiveStyles.layout.maxWidth}]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, {padding: responsiveStyles.padding.section, maxWidth: responsiveStyles.layout.maxWidth}]}>
          <Text style={[styles.sectionTitle, {fontSize: responsiveStyles.fontSize.section}]}>Three</Text>
          <Text style={[styles.versionText, {fontSize: responsiveStyles.fontSize.small}]}>Versão 1.0.0</Text>
          
          <Text style={[styles.sectionTitle, {fontSize: responsiveStyles.fontSize.section}]}>Sobre Nós</Text>
          <Text style={[styles.descriptionText, {fontSize: responsiveStyles.fontSize.body}]}>
            A THREE COMPANY é muito mais do que apenas um serviço de transporte, somos uma empresa que respira inovação, tecnologia e paixão por oferecer a melhor experiência de mobilidade urbana. Nosso foco está em conectar pessoas e lugares de forma eficiente, segura e acessível.
          </Text>
          <Text style={[styles.descriptionText, {fontSize: responsiveStyles.fontSize.body}]}>
            Para isso investimos em uma equipe de especialistas em logística e tecnologia, que trabalham incansavelmente para aperfeiçoar cada detalhe, desde a gestão de frotas até a experiência do usuário. Nossa plataforma conta com recursos de GPS, rastreamento e gerenciamento de pedidos, garantindo um serviço ágil e confiável, que se adapta às necessidades do cliente.
          </Text>
        </View>

        <View style={[styles.section, {padding: responsiveStyles.padding.section, maxWidth: responsiveStyles.layout.maxWidth}]}>
          <Text style={[styles.sectionTitle, {fontSize: responsiveStyles.fontSize.section}]}>Recursos Principais</Text>
          
          <View style={[styles.featureItem, {paddingHorizontal: responsiveStyles.padding.item}]}>
            <Ionicons name="car" size={24} color={COLORS.primary} />
            <Text style={[styles.featureText, {fontSize: responsiveStyles.fontSize.body}]}>Reservas de táxi em tempo real</Text>
          </View>
          
          <View style={[styles.featureItem, {paddingHorizontal: responsiveStyles.padding.item}]}>
            <Ionicons name="heart" size={24} color={COLORS.primary} />
            <Text style={[styles.featureText, {fontSize: responsiveStyles.fontSize.body}]}>Locais favoritos para acesso rápido</Text>
          </View>
          
          <View style={[styles.featureItem, {paddingHorizontal: responsiveStyles.padding.item}]}>
            <Ionicons name="map" size={24} color={COLORS.primary} />
            <Text style={[styles.featureText, {fontSize: responsiveStyles.fontSize.body}]}>Navegação integrada com mapas</Text>
          </View>
          
          <View style={[styles.featureItem, {paddingHorizontal: responsiveStyles.padding.item}]}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
            <Text style={[styles.featureText, {fontSize: responsiveStyles.fontSize.body}]}>Sistema de segurança avançado</Text>
          </View>
        </View>

        <View style={[styles.section, {padding: responsiveStyles.padding.section, maxWidth: responsiveStyles.layout.maxWidth}]}>
          <Text style={[styles.sectionTitle, {fontSize: responsiveStyles.fontSize.section}]}>Contato</Text>
          
          <View style={[styles.contactItem, {paddingHorizontal: responsiveStyles.padding.item}]}>
            <Ionicons name="mail" size={20} color={COLORS.text.secondary} />
            <Text style={[styles.contactText, {fontSize: responsiveStyles.fontSize.body}]}>threecompanyofangola@gmail.com</Text>
          </View>
          
          <View style={[styles.contactItem, {paddingHorizontal: responsiveStyles.padding.item}]}>
            <Ionicons name="call" size={20} color={COLORS.text.secondary} />
            <Text style={[styles.contactText, {fontSize: responsiveStyles.fontSize.body}]}>+244 975651828</Text>
          </View>
          
          <View style={[styles.contactItem, {paddingHorizontal: responsiveStyles.padding.item}]}>
            <Ionicons name="location" size={20} color={COLORS.text.secondary} />
            <Text style={[styles.contactText, {fontSize: responsiveStyles.fontSize.body}]}>Luanda, Angola</Text>
          </View>
        </View>

        <View style={[styles.footer, {maxWidth: responsiveStyles.layout.maxWidth}]}>
          <Text style={[styles.footerText, {fontSize: responsiveStyles.fontSize.small}]}>
            © 2024 Three. Todos os direitos reservados.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Função para calcular estilos responsivos baseados na largura da tela
const getResponsiveStyles = (width) => {
  // Definir breakpoints
  const isSmallDevice = width < 375;
  const isMediumDevice = width >= 375 && width < 768;
  const isLargeDevice = width >= 768;
  
  // Ajustar tamanhos baseados no dispositivo
  const fontSizeMultiplier = isSmallDevice ? 0.9 : isMediumDevice ? 1 : 1.2;
  const paddingMultiplier = isSmallDevice ? 0.8 : isMediumDevice ? 1 : 1.5;
  
  return {
    fontSize: {
      title: 24 * fontSizeMultiplier,
      section: 20 * fontSizeMultiplier,
      body: 16 * fontSizeMultiplier,
      small: 14 * fontSizeMultiplier,
    },
    padding: {
      container: 20 * paddingMultiplier,
      section: 16 * paddingMultiplier,
      item: 10 * paddingMultiplier,
    },
    layout: {
      sectionWidth: isLargeDevice ? '80%' : '100%',
      maxWidth: isLargeDevice ? 800 : '100%',
    }
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 100 : 40, // Margem extra para botões de navegação
    alignItems: 'center', // Centralizar conteúdo em telas maiores
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%', // Será ajustado dinamicamente com maxWidth
    maxWidth: 800, // Limitar largura em telas grandes
    alignSelf: 'center', // Centralizar em telas grandes
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 10,
  },
  versionText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text.primary,
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 15,
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  contactText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 15,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 5,
  },
});

export default AboutScreen;
