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
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import LocalDatabase from '../services/localDatabase';
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Configurações</Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* Auto Accept Section */}
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

        {/* Display Section */}
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

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          
          <View style={styles.settingCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                Toast.show({
                  type: "info",
                  text1: "Em desenvolvimento",
                  text2: "Alterar senha em breve",
                });
              }}
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
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                Toast.show({
                  type: "info",
                  text1: "Em desenvolvimento",
                  text2: "Editar dados do veículo em breve",
                });
              }}
            >
              <View style={styles.settingContent}>
                <MaterialIcons name="directions-car" size={24} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Dados do Veículo</Text>
                  <Text style={styles.settingSubtitle}>Alterar informações do seu carro</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ajuda</Text>
          
          <View style={styles.settingCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                Toast.show({
                  type: "info",
                  text1: "Em desenvolvimento",
                  text2: "Central de ajuda em breve",
                });
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
                Toast.show({
                  type: "info",
                  text1: "Em desenvolvimento",
                  text2: "Contato em breve",
                });
              }}
            >
              <View style={styles.settingContent}>
                <MaterialIcons name="contact-support" size={24} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Contato</Text>
                  <Text style={styles.settingSubtitle}>Fale conosco</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados</Text>
          
          <View style={styles.settingCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={clearAppData}
            >
              <View style={styles.settingContent}>
                <MaterialIcons name="delete-sweep" size={24} color="#EF4444" />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: '#EF4444' }]}>
                    Limpar Dados do App
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    Remove todos os dados salvos no dispositivo
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

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2563EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    marginHorizontal: 16,
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