import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            // Aqui você implementaria a lógica de logout
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'Esta ação não pode ser desfeita. Todos os seus dados serão perdidos permanentemente.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            // Aqui você implementaria a lógica de exclusão da conta
            Alert.alert('Conta Excluída', 'Sua conta foi excluída com sucesso.');
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Conta',
      items: [
        {
          id: 'profile',
          title: 'Perfil',
          subtitle: 'Editar informações pessoais',
          icon: 'person-outline',
          action: 'navigate',
          screen: 'EditProfile',
        },

      ],
    },

    {
      title: 'Preferências',
      items: [
        {
          id: 'notifications',
          title: 'Notificações',
          subtitle: 'Alertas e lembretes',
          icon: 'notifications-outline',
          action: 'switch',
          value: notifications,
          onValueChange: setNotifications,
        },
        {
          id: 'location',
          title: 'Serviços de Localização',
          subtitle: 'GPS e rastreamento',
          icon: 'location-outline',
          action: 'switch',
          value: locationServices,
          onValueChange: setLocationServices,
        },

        {
          id: 'language',
          title: 'Idioma',
          subtitle: 'Português (Brasil)',
          icon: 'language-outline',
          action: 'navigate',
          screen: 'Language',
        },
      ],
    },
    {
      title: 'Suporte',
      items: [
        {
          id: 'help',
          title: 'Central de Ajuda',
          subtitle: 'Perguntas frequentes e tutoriais',
          icon: 'help-circle-outline',
          action: 'navigate',
          screen: 'Help',
        },
        {
          id: 'contact',
          title: 'Fale Conosco',
          subtitle: 'Suporte ao cliente',
          icon: 'chatbubble-outline',
          action: 'navigate',
          screen: 'Contact',
        },
        {
          id: 'feedback',
          title: 'Enviar Feedback',
          subtitle: 'Sua opinião é importante',
          icon: 'star-outline',
          action: 'navigate',
          screen: 'Feedback',
        },
      ],
    },
    {
      title: 'Sobre',
      items: [
        {
          id: 'about',
          title: 'Sobre a App',
          subtitle: 'Versão 1.0.0',
          icon: 'information-circle-outline',
          action: 'navigate',
          screen: 'About',
        },
        {
          id: 'privacy',
          title: 'Política de Privacidade',
          subtitle: 'Como protegemos seus dados',
          icon: 'lock-closed-outline',
          action: 'navigate',
          screen: 'Privacy',
        },
        {
          id: 'terms',
          title: 'Termos de Uso',
          subtitle: 'Condições do serviço',
          icon: 'document-text-outline',
          action: 'navigate',
          screen: 'Terms',
        },
      ],
    },
  ];

  const renderSettingItem = (item) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={() => {
          if (item.action === 'navigate') {
            // Navegar para a tela específica
            if (item.screen === 'EditProfile') {
              navigation.navigate('EditProfile');
            } else if (item.screen === 'Language') {
              navigation.navigate('Language');
            } else if (item.screen === 'Help') {
              navigation.navigate('Help');
            } else if (item.screen === 'Contact') {
              navigation.navigate('Contact');
            } else if (item.screen === 'Feedback') {
              navigation.navigate('Feedback');
            } else if (item.screen === 'About') {
              navigation.navigate('About');
            } else if (item.screen === 'Privacy') {
              navigation.navigate('Privacy');
            } else if (item.screen === 'Terms') {
              navigation.navigate('Terms');
            } else {
              console.log('Navegando para:', item.screen);
            }
          }
        }}
        disabled={item.action === 'switch'}
      >
        <View style={styles.settingIcon}>
          <Ionicons name={item.icon} size={24} color="#6B7280" />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
        {item.action === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: '#E5E7EB', true: '#1737e8' }}
            thumbColor={item.value ? '#ffffff' : '#ffffff'}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}
      </TouchableOpacity>
    );
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
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Botões de Ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteText}>Excluir Conta</Text>
          </TouchableOpacity>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
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
    paddingBottom: Platform.OS === 'android' ? 80 : 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    marginTop: 10,
    gap: 12,
    marginBottom: Platform.OS === 'android' ? 100 : 20,
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
});

export default SettingsScreen;
