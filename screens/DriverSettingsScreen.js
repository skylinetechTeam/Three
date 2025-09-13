import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import LocalDatabase from '../services/localDatabase';
import driverAuthService from '../services/driverAuthService';
import Toast from 'react-native-toast-message';

export default function DriverSettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    notifications: true,
    autoAccept: false,
    soundAlerts: true,
    vibration: true,
    nightMode: false,
    language: 'pt',
  });
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const appSettings = await LocalDatabase.getAppSettings();
      setSettings({
        notifications: appSettings.notifications ?? true,
        autoAccept: appSettings.autoAccept ?? false,
        soundAlerts: appSettings.soundAlerts ?? true,
        vibration: appSettings.vibration ?? true,
        nightMode: appSettings.nightMode ?? false,
        language: appSettings.language ?? 'pt',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await LocalDatabase.saveAppSettings({ [key]: value });
      
      const settingNames = {
        notifications: 'Notificações',
        autoAccept: 'Aceitar automaticamente',
        soundAlerts: 'Alertas sonoros',
        vibration: 'Vibração',
        nightMode: 'Modo noturno',
      };

      Toast.show({
        type: "success",
        text1: settingNames[key],
        text2: value ? "Ativado" : "Desativado",
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível salvar a configuração",
      });
    }
  };

  const clearAppData = () => {
    Alert.alert(
      'Limpar dados do app',
      'Esta ação irá remover todos os dados salvos no dispositivo. Tem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await LocalDatabase.clearAllData();
              Toast.show({
                type: "success",
                text1: "Dados limpos",
                text2: "Todos os dados foram removidos",
              });
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error clearing data:', error);
              Toast.show({
                type: "error",
                text1: "Erro",
                text2: "Não foi possível limpar os dados",
              });
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair? Você precisará fazer login novamente.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await driverAuthService.logoutDriver();
              
              Toast.show({
                type: "success",
                text1: "Logout realizado",
                text2: "Você foi desconectado com sucesso",
              });

              // Navegar para tela de login
              navigation.reset({
                index: 0,
                routes: [{ name: "DriverLogin" }],
              });

            } catch (error) {
              console.error('Error during logout:', error);
              Toast.show({
                type: "error",
                text1: "Erro",
                text2: "Não foi possível fazer logout",
              });
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, value, onValueChange, type = 'switch' }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <MaterialIcons name={icon} size={24} color="#2563EB" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
          thumbColor={value ? '#ffffff' : '#ffffff'}
        />
      )}
      {type === 'arrow' && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Configurações</Text>
        </View>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações</Text>
          
          <View style={styles.settingCard}>
            <SettingItem
              icon="notifications"
              title="Notificações"
              subtitle="Receber alertas de novas corridas"
              value={settings.notifications}
              onValueChange={(value) => updateSetting('notifications', value)}
            />
            
            <View style={styles.divider} />
            
            <SettingItem
              icon="volume-up"
              title="Alertas Sonoros"
              subtitle="Som para novas solicitações"
              value={settings.soundAlerts}
              onValueChange={(value) => updateSetting('soundAlerts', value)}
            />
            
            <View style={styles.divider} />
            
            <SettingItem
              icon="vibration"
              title="Vibração"
              subtitle="Vibrar quando receber solicitações"
              value={settings.vibration}
              onValueChange={(value) => updateSetting('vibration', value)}
            />
          </View>
        </View>

        {/* Auto Accept Section
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Automação</Text>
          
          <View style={styles.settingCard}>
            <SettingItem
              icon="auto-awesome"
              title="Aceitar Automaticamente"
              subtitle="Aceitar corridas próximas automaticamente"
              value={settings.autoAccept}
              onValueChange={(value) => updateSetting('autoAccept', value)}
            />
          </View>
        </View>
 */}
        {/* Display Section 
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aparência</Text>
          
          <View style={styles.settingCard}>
            <SettingItem
              icon="dark-mode"
              title="Modo Noturno"
              subtitle="Interface escura para dirigir à noite"
              value={settings.nightMode}
              onValueChange={(value) => updateSetting('nightMode', value)}
            />
          </View>
        </View>
*/}
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          
          <View style={styles.settingCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate('DriverChangePassword')}
            >
              <View style={styles.settingContent}>
                <MaterialIcons name="lock" size={24} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Alterar Senha</Text>
                  <Text style={styles.settingSubtitle}>Alterar sua senha de acesso</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ajuda</Text>
          
          <View style={styles.settingCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                navigation.navigate('Help');
              }}
            >
              <View style={styles.settingContent}>
                <MaterialIcons name="help" size={24} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Central de Ajuda</Text>
                  <Text style={styles.settingSubtitle}>Perguntas frequentes e suporte</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                // Abrir WhatsApp
                const whatsappUrl = 'https://wa.me/+244928873593';
                Linking.openURL(whatsappUrl)
                  .catch(err => {
                    Toast.show({
                      type: "error",
                      text1: "Erro",
                      text2: "Não foi possível abrir o WhatsApp",
                    });
                  });
              }}
            >
              <View style={styles.settingContent}>
                <MaterialIcons name="whatsapp" size={24} color="#25D366" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Contato via WhatsApp</Text>
                  <Text style={styles.settingSubtitle}>Fale conosco diretamente</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          
          <View style={styles.settingCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleLogout}
            >
              <View style={styles.settingContent}>
                <MaterialIcons name="logout" size={24} color="#EF4444" />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: '#EF4444' }]}>
                    Sair da Conta
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    Desconectar e voltar para tela de login
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

       

        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>App Motorista v1.0.0</Text>
            <Text style={styles.appInfoText}>© 2024 Taxi App</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

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
    paddingVertical: 16,
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    marginLeft: 4,
  },
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});