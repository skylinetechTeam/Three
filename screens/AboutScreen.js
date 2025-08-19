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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';

const AboutScreen = ({ navigation }) => {
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
        
        <Text style={styles.headerTitle}>Sobre o App</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Three</Text>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
          
          <Text style={styles.descriptionText}>
            O Three é uma plataforma inovadora de transporte que 
            conecta passageiros e motoristas de forma segura, rápida e eficiente.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recursos Principais</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="car" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Reservas de táxi em tempo real</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="heart" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Locais favoritos para acesso rápido</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="map" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Navegação integrada com mapas</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Sistema de segurança avançado</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contato</Text>
          
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={20} color={COLORS.text.secondary} />
            <Text style={styles.contactText}>suporte@three.ao</Text>
          </View>
          
          <View style={styles.contactItem}>
            <Ionicons name="call" size={20} color={COLORS.text.secondary} />
            <Text style={styles.contactText}>+244 123 456 789</Text>
          </View>
          
          <View style={styles.contactItem}>
            <Ionicons name="location" size={20} color={COLORS.text.secondary} />
            <Text style={styles.contactText}>Luanda, Angola</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Three. Todos os direitos reservados.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
