import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import LocalDatabase from '../services/localDatabase';
import Toast from 'react-native-toast-message';

export default function DriverProfileScreen({ navigation }) {
  const [driverProfile, setDriverProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(false);

  useEffect(() => {
    loadDriverProfile();
    loadSettings();
  }, []);

  const loadDriverProfile = async () => {
    try {
      const profile = await LocalDatabase.getDriverProfile();
      const onlineStatus = await LocalDatabase.getDriverOnlineStatus();
      
      if (profile) {
        setDriverProfile(profile);
        setIsOnline(onlineStatus);
      } else {
        // Create a default driver profile for demo
        const defaultProfile = {
          nome: 'João Silva',
          email: 'joao.motorista@email.com',
          telefone: '+244 900 000 000',
          veiculo: {
            modelo: 'Toyota Corolla',
            placa: 'LD-12-34-AB',
            cor: 'Branco',
            ano: 2020,
          },
          rating: 4.8,
          totalTrips: 142,
          joinDate: '2023-01-15',
          isLoggedIn: true,
        };
        await LocalDatabase.saveDriverProfile(defaultProfile);
        setDriverProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Error loading driver profile:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await LocalDatabase.getAppSettings();
      setNotificationsEnabled(settings.notifications || true);
      setAutoAcceptEnabled(settings.autoAccept || false);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      await LocalDatabase.setDriverOnlineStatus(newStatus);
      setIsOnline(newStatus);

      Toast.show({
        type: "success",
        text1: newStatus ? "Online" : "Offline",
        text2: newStatus ? "Você está disponível para corridas" : "Você não receberá solicitações",
      });
    } catch (error) {
      console.error('Error toggling online status:', error);
    }
  };

  const toggleNotifications = async (value) => {
    try {
      setNotificationsEnabled(value);
      await LocalDatabase.saveAppSettings({ notifications: value });
      
      Toast.show({
        type: "info",
        text1: "Notificações",
        text2: value ? "Ativadas" : "Desativadas",
      });
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const toggleAutoAccept = async (value) => {
    try {
      setAutoAcceptEnabled(value);
      await LocalDatabase.saveAppSettings({ autoAccept: value });
      
      Toast.show({
        type: "info",
        text1: "Aceitar automaticamente",
        text2: value ? "Ativado" : "Desativado",
      });
    } catch (error) {
      console.error('Error toggling auto accept:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await LocalDatabase.updateDriverProfile({ 
                isLoggedIn: false,
                isOnline: false 
              });
              
              Toast.show({
                type: "success",
                text1: "Logout realizado",
                text2: "Até logo!",
              });

              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!driverProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        
        <Text style={styles.headerTitle}>Perfil do Motorista</Text>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            Toast.show({
              type: "info",
              text1: "Em desenvolvimento",
              text2: "Função de editar perfil em breve",
            });
          }}
        >
          <Ionicons name="create-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {driverProfile.nome?.charAt(0).toUpperCase() || 'M'}
              </Text>
            </View>
            <View style={[styles.statusIndicator, isOnline ? styles.online : styles.offline]} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.driverName}>{driverProfile.nome}</Text>
            <Text style={styles.driverStatus}>
              {isOnline ? 'Online - Disponível' : 'Offline'}
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialIcons name="star" size={16} color="#FFA500" />
                <Text style={styles.statText}>{driverProfile.rating || '4.8'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="local-taxi" size={16} color="#2563EB" />
                <Text style={styles.statText}>{driverProfile.totalTrips || '142'} corridas</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={toggleOnlineStatus}>
            <View style={styles.actionIcon}>
              <MaterialIcons 
                name={isOnline ? "radio-button-checked" : "radio-button-unchecked"} 
                size={24} 
                color={isOnline ? "#10B981" : "#EF4444"} 
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>
                {isOnline ? 'Ficar Offline' : 'Ficar Online'}
              </Text>
              <Text style={styles.actionSubtitle}>
                {isOnline 
                  ? 'Parar de receber solicitações' 
                  : 'Começar a receber solicitações'
                }
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Vehicle Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veículo</Text>
          
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleIcon}>
              <MaterialIcons name="directions-car" size={32} color="#2563EB" />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleModel}>
                {driverProfile.veiculo?.modelo || 'Toyota Corolla'}
              </Text>
              <Text style={styles.vehicleDetails}>
                {driverProfile.veiculo?.placa || 'LD-12-34-AB'} • {driverProfile.veiculo?.cor || 'Branco'}
              </Text>
              <Text style={styles.vehicleYear}>
                Ano: {driverProfile.veiculo?.ano || '2020'}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="notifications" size={24} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Notificações</Text>
                  <Text style={styles.settingSubtitle}>Receber alertas de novas corridas</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                thumbColor={notificationsEnabled ? '#ffffff' : '#ffffff'}
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="auto-awesome" size={24} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Aceitar Automaticamente</Text>
                  <Text style={styles.settingSubtitle}>Aceitar corridas próximas automaticamente</Text>
                </View>
              </View>
              <Switch
                value={autoAcceptEnabled}
                onValueChange={toggleAutoAccept}
                trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                thumbColor={autoAcceptEnabled ? '#ffffff' : '#ffffff'}
              />
            </View>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{driverProfile.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{driverProfile.telefone}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="calendar-today" size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                Motorista desde {formatDate(driverProfile.joinDate || '2023-01-15')}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              Toast.show({
                type: "info",
                text1: "Em desenvolvimento",
                text2: "Histórico de corridas em breve",
              });
            }}
          >
            <MaterialIcons name="history" size={24} color="#2563EB" />
            <Text style={styles.actionButtonText}>Histórico de Corridas</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              Toast.show({
                type: "info",
                text1: "Em desenvolvimento",
                text2: "Ganhos em breve",
              });
            }}
          >
            <MaterialIcons name="account-balance-wallet" size={24} color="#2563EB" />
            <Text style={styles.actionButtonText}>Meus Ganhos</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              Toast.show({
                type: "info",
                text1: "Em desenvolvimento",
                text2: "Suporte em breve",
              });
            }}
          >
            <MaterialIcons name="help" size={24} color="#2563EB" />
            <Text style={styles.actionButtonText}>Ajuda e Suporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#EF4444" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  online: {
    backgroundColor: '#10B981',
  },
  offline: {
    backgroundColor: '#EF4444',
  },
  profileInfo: {
    alignItems: 'center',
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  driverStatus: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 16,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  actionIcon: {
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  vehicleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  vehicleIcon: {
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  vehicleYear: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
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
  settingDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 16,
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});