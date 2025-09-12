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

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.body1,
    color: COLORS.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding.xl,
    paddingVertical: SIZES.padding.large,
    backgroundColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h4,
    color: COLORS.white,
    textAlign: 'center',
  },
  editButton: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.padding.xl,
    marginTop: SIZES.padding.xl,
    marginBottom: SIZES.padding.xxl,
    borderRadius: SIZES.radius.xl,
    padding: SIZES.padding.xxl,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SIZES.padding.large,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: SIZES.radius.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: SIZES.radius.full,
    ...SHADOWS.medium,
  },
  avatarText: {
    fontSize: SIZES.fontSize.xxxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: SIZES.radius.full,
    borderWidth: 4,
    borderColor: COLORS.white,
    ...SHADOWS.medium,
  },
  online: {
    backgroundColor: COLORS.online,
  },
  offline: {
    backgroundColor: COLORS.offline,
  },
  profileInfo: {
    alignItems: 'center',
  },
  driverName: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.xs,
  },
  driverStatus: {
    ...FONTS.body1,
    color: COLORS.text.secondary,
    marginBottom: SIZES.padding.large,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SIZES.padding.medium,
    gap: SIZES.spacing.medium,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: SIZES.padding.medium,
    paddingHorizontal: SIZES.padding.large,
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radius.medium,
    minWidth: 90,
    ...SHADOWS.small,
  },
  statValue: {
    ...FONTS.h5,
    color: COLORS.text.primary,
    marginTop: SIZES.padding.xs,
  },
  statLabel: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.xs,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: SIZES.padding.xl,
    marginBottom: SIZES.padding.xxl,
  },
  sectionTitle: {
    ...FONTS.h5,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.large,
    marginLeft: SIZES.padding.xs,
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.large,
    padding: SIZES.padding.xl,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  actionIcon: {
    marginRight: SIZES.padding.large,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...FONTS.body1,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  actionSubtitle: {
    ...FONTS.body2,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.xs,
  },
  vehicleCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.large,
    padding: SIZES.padding.xl,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  vehicleIcon: {
    marginRight: SIZES.padding.large,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleModel: {
    ...FONTS.h5,
    color: COLORS.text.primary,
  },
  vehicleDetails: {
    ...FONTS.body2,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.xs,
  },
  vehicleYear: {
    ...FONTS.body2,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.xs,
  },
  settingCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.large,
    padding: SIZES.padding.xl,
    ...SHADOWS.medium,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.padding.medium,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: SIZES.padding.large,
    flex: 1,
  },
  settingTitle: {
    ...FONTS.body1,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  settingSubtitle: {
    ...FONTS.body2,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.xs,
  },
  settingDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SIZES.padding.medium,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.large,
    padding: SIZES.padding.xl,
    ...SHADOWS.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding.medium,
  },
  infoText: {
    ...FONTS.body1,
    color: COLORS.text.primary,
    marginLeft: SIZES.padding.medium,
  },
  actionButton: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.large,
    padding: SIZES.padding.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.medium,
    ...SHADOWS.medium,
  },
  actionButtonText: {
    flex: 1,
    ...FONTS.body1,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginLeft: SIZES.padding.large,
  },
  logoutButton: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.large,
    padding: SIZES.padding.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.errorLight,
  },
  logoutText: {
    ...FONTS.body1,
    fontWeight: '600',
    color: COLORS.error,
    marginLeft: SIZES.padding.small,
  },
  bottomSpacer: {
    height: SIZES.padding.xxxl,
  },
});