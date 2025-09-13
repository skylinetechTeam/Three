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
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import LocalDatabase from '../services/localDatabase';
import driverAuthService from '../services/driverAuthService';
import Toast from 'react-native-toast-message';

const { height } = Dimensions.get('window');

export default function DriverProfileScreen({ navigation }) {
  const [driverProfile, setDriverProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadDriverProfile();
    loadSettings();
    
  }, []);

  const loadDriverProfile = async () => {
    try {
      // Primeiro, tentar carregar dados locais
      const localData = await driverAuthService.getLocalDriverData();
      
      if (localData) {
        console.log(localData)
        setDriverProfile(localData);
        setIsOnline(localData.isOnline || false);
        
        // Tentar buscar dados atualizados do Supabase em background
        try {
          const updatedData = await driverAuthService.getDriverFullData(localData.id);
          if (updatedData) {
            // Mesclar dados do Supabase com dados locais (foto)
            const mergedData = {
              ...updatedData,
              photo: localData.photo, // Manter foto local
              isOnline: localData.isOnline || false,
              isLoggedIn: localData.isLoggedIn || false
            };
            
            setDriverProfile(mergedData);
            console.log(driverProfile)
            
            // Atualizar dados locais com informações mais recentes
            await driverAuthService.saveDriverLocally(updatedData, localData.photo);
          }
        } catch (supabaseError) {
          console.warn('⚠️ Não foi possível buscar dados atualizados do Supabase:', supabaseError);
          // Continuar com dados locais
        }
      } else {
        // Fallback para dados locais antigos se necessário
        const profile = await LocalDatabase.getDriverProfile();
        const onlineStatus = await LocalDatabase.getDriverOnlineStatus();
        
        if (profile) {
          setDriverProfile(profile);
          setIsOnline(onlineStatus);
        } else {
          // Se não houver perfil, redirecionar para login
          navigation.reset({
            index: 0,
            routes: [{ name: 'DriverLogin' }],
          });
        }
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
        type: "success",
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
        type: "success",
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
      'Tem certeza que deseja sair? Você precisará fazer login novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              // Usar o novo serviço de autenticação
              await driverAuthService.logoutDriver();
              
              Toast.show({
                type: "success",
                text1: "Logout realizado",
                text2: "Você foi desconectado com sucesso",
              });

              // Navegar para tela de login do motorista
              navigation.reset({
                index: 0,
                routes: [{ name: 'DriverLogin' }],
              });
            } catch (error) {
              console.error('Error logging out:', error);
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Perfil do Motorista</Text>
        </View>
        
      
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {driverProfile.photo ? (
              <Image source={{ uri: driverProfile.photo }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(driverProfile.name || driverProfile.nome)?.charAt(0).toUpperCase() || 'M'}
                </Text>
              </View>
            )}
            <View style={[styles.statusIndicator, isOnline ? styles.online : styles.offline]} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.driverName}>{driverProfile.name || driverProfile.nome}</Text>
              {/* 
            <Text style={styles.driverStatus}>
              {isOnline ? 'Online - Disponível' : 'Offline'}
            </Text>
          
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <MaterialIcons name="star" size={20} color="#FFA500" />
                <Text style={styles.statValue}>{driverProfile.rating || '4.8'}</Text>
                <Text style={styles.statLabel}>Avaliação</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialIcons name="local-taxi" size={20} color="#2563EB" />
                <Text style={styles.statValue}>{driverProfile.total_trips || driverProfile.totalTrips || '142'}</Text>
                <Text style={styles.statLabel}>Corridas</Text>
              </View>
            </View>
            */}
          </View>
        </View>

        {/* Quick Actions 
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
*/}
        {/* Vehicle Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veículo</Text>
          
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleIcon}>
              <MaterialIcons name="directions-car" size={32} color="#2563EB" />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleModel}>
                {driverProfile.vehicles[0]?.model || 'Toyota Corolla'}
              </Text>
              <Text style={styles.vehicleDetails}>
                {driverProfile.vehicles[0]?.license_plate || 'LD-12-34-AB'} • {driverProfile.vehicles[0]?.color || 'Branco'}
              </Text>
              <Text style={styles.vehicleYear}>
                Ano: {driverProfile.vehicles[0]?.year || '2020'}
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
              {/*{/*
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
                */}
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
              <Text style={styles.infoText}>{driverProfile.phone || driverProfile.telefone}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="calendar-today" size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                Motorista desde {formatDate(driverProfile.created_at || driverProfile.joinDate || '2023-01-15')}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions 
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
*/}
        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#EF4444" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2563EB',
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
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    minWidth: 80,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    marginLeft: 4,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
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
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
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
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
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
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
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
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
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
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#FEE2E2',
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