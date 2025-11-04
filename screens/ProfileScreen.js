import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import LocalDatabase from '../services/localDatabase';

export default function ProfileScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  
  // Obter dimensões da tela para responsividade
  const { width } = useWindowDimensions();
  
  // Definir estilos responsivos com base na largura da tela
  const getResponsiveStyles = () => {
    // Definir breakpoints
    const isSmallScreen = width < 360;
    const isMediumScreen = width >= 360 && width < 480;
    const isLargeScreen = width >= 480 && width < 768;
    const isExtraLargeScreen = width >= 768;
    
    // Definir multiplicadores baseados no tamanho da tela
    const fontMultiplier = isSmallScreen ? 0.85 : isMediumScreen ? 1 : isLargeScreen ? 1.15 : 1.3;
    const paddingMultiplier = isSmallScreen ? 0.85 : isMediumScreen ? 1 : isLargeScreen ? 1.2 : 1.5;
    
    return {
      fontSize: {
        header: 20 * fontMultiplier,
        userName: 24 * fontMultiplier,
        userInfo: 16 * fontMultiplier,
        button: 14 * fontMultiplier,
        stat: 24 * fontMultiplier,
        statLabel: 14 * fontMultiplier,
        section: 18 * fontMultiplier,
        menuItem: 16 * fontMultiplier,
        version: 14 * fontMultiplier,
      },
      padding: {
        container: 20 * paddingMultiplier,
        card: 24 * paddingMultiplier,
        menuItem: 16 * paddingMultiplier,
      },
      layout: {
        maxWidth: isExtraLargeScreen ? 700 : '100%',
        centerContent: isExtraLargeScreen,
        alignSelf: isExtraLargeScreen ? 'center' : 'stretch',
      }
    };
  };
  
  const responsiveStyles = getResponsiveStyles();

  useEffect(() => {
    loadUserData();
    
    // Reload profile when navigating back from EditProfile
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const profile = await LocalDatabase.getUserProfile();
      console.log('📄 Profile loaded:', profile);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: async () => {
          try {
            // Update user profile to mark as logged out
            if (userProfile) {
              await LocalDatabase.updateUserProfile({
                ...userProfile,
                isLoggedIn: false,
                lastLogout: new Date().toISOString()
              });
            }

            // Save logout notification
            await LocalDatabase.saveNotification({
              title: 'Logout realizado',
              message: 'Você saiu da sua conta com sucesso.',
              type: 'info'
            });

            Toast.show({
              type: 'success',
              text1: 'Logout realizado',
              text2: 'Você foi desconectado com sucesso',
            });

            // Navigate to login screen using reset to clear navigation stack
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (error) {
            console.error('Logout error:', error);
            Toast.show({
              type: 'error',
              text1: 'Erro',
              text2: 'Não foi possível fazer logout',
            });
          }
        }}
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleViewTrips = () => {
    navigation.navigate('Reservas');
  };

  const handleViewFavorites = () => {
    navigation.navigate('Favoritos');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleHelp = () => {
    navigation.navigate('Help');
  };

  const handleAbout = () => {
    navigation.navigate('About');
  };

  const handlePrivacy = () => {
    navigation.navigate('Privacy');
  };

  const handleTerms = () => {
    navigation.navigate('Terms');
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={responsiveStyles.layout.centerContent ? {alignItems: 'center'} : null}
      >
        {/* Header */}
        <View style={[styles.header, {width: '100%'}]}>
          <Text style={[styles.headerTitle, {fontSize: responsiveStyles.fontSize.header}]}>Meu Perfil</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, {width: '100%', maxWidth: responsiveStyles.layout.maxWidth, padding: responsiveStyles.padding.card}]}>
          <View style={styles.avatarContainer}>
            {userProfile.profileImageUrl ? (
              <Image 
                source={{ uri: userProfile.profileImageUrl }} 
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(
                    (userProfile.nome || userProfile.fullName || userProfile.email || 'U')
                      .charAt(0)
                      .toUpperCase()
                  )}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.userName, {fontSize: responsiveStyles.fontSize.userName}]}>{userProfile.nome || userProfile.fullName || 'Usuário'}</Text>
          <Text style={[styles.userEmail, {fontSize: responsiveStyles.fontSize.userInfo}]}>{userProfile.email}</Text>
          <Text style={[styles.userPhone, {fontSize: responsiveStyles.fontSize.userInfo}]}>{userProfile.telefone || userProfile.phone || ''}</Text>
          
          <TouchableOpacity onPress={handleEditProfile} style={[styles.editButton, {paddingVertical: responsiveStyles.padding.menuItem / 2}]}>
            <MaterialIcons name="edit" size={16} color="#2563EB" />
            <Text style={[styles.editButtonText, {fontSize: responsiveStyles.fontSize.button}]}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>


        {/* Menu Items */}
        <View style={[styles.menuSection, {width: '100%', maxWidth: responsiveStyles.layout.maxWidth}]}>
          <Text style={[styles.sectionTitle, {fontSize: responsiveStyles.fontSize.section}]}>Minhas Viagens</Text>
          
          <TouchableOpacity onPress={handleViewTrips} style={[styles.menuItem, {paddingVertical: responsiveStyles.padding.menuItem}]}>
            <MaterialIcons name="history" size={24} color="#2563EB" />
            <Text style={[styles.menuItemText, {fontSize: responsiveStyles.fontSize.menuItem}]}>Reservas de Viagens</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleViewFavorites} style={[styles.menuItem, {paddingVertical: responsiveStyles.padding.menuItem}]}>
            <MaterialIcons name="favorite" size={24} color="#EF4444" />
            <Text style={[styles.menuItemText, {fontSize: responsiveStyles.fontSize.menuItem}]}>Destinos Favoritos</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={[styles.menuSection, {width: '100%', maxWidth: responsiveStyles.layout.maxWidth}]}>
          <Text style={[styles.sectionTitle, {fontSize: responsiveStyles.fontSize.section}]}>Configurações</Text>
          
          <TouchableOpacity onPress={handleSettings} style={[styles.menuItem, {paddingVertical: responsiveStyles.padding.menuItem}]}>
            <MaterialIcons name="settings" size={24} color="#6B7280" />
            <Text style={[styles.menuItemText, {fontSize: responsiveStyles.fontSize.menuItem}]}>Configurações</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleHelp} style={[styles.menuItem, {paddingVertical: responsiveStyles.padding.menuItem}]}>
            <MaterialIcons name="help" size={24} color="#6B7280" />
            <Text style={[styles.menuItemText, {fontSize: responsiveStyles.fontSize.menuItem}]}>Central de Ajuda</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={[styles.menuSection, {width: '100%', maxWidth: responsiveStyles.layout.maxWidth}]}>
          <Text style={[styles.sectionTitle, {fontSize: responsiveStyles.fontSize.section}]}>Legal</Text>
          
          <TouchableOpacity onPress={handlePrivacy} style={[styles.menuItem, {paddingVertical: responsiveStyles.padding.menuItem}]}>
            <MaterialIcons name="privacy-tip" size={24} color="#6B7280" />
            <Text style={[styles.menuItemText, {fontSize: responsiveStyles.fontSize.menuItem}]}>Política de Privacidade</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleTerms} style={[styles.menuItem, {paddingVertical: responsiveStyles.padding.menuItem}]}>
            <MaterialIcons name="description" size={24} color="#6B7280" />
            <Text style={[styles.menuItemText, {fontSize: responsiveStyles.fontSize.menuItem}]}>Termos de Uso</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleAbout} style={[styles.menuItem, {paddingVertical: responsiveStyles.padding.menuItem}]}>
            <MaterialIcons name="info" size={24} color="#6B7280" />
            <Text style={[styles.menuItemText, {fontSize: responsiveStyles.fontSize.menuItem}]}>Sobre o App</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={[styles.versionContainer, {width: '100%', maxWidth: responsiveStyles.layout.maxWidth}]}>
          <Text style={[styles.versionText, {fontSize: responsiveStyles.fontSize.version}]}>Three v1.0.0</Text>
        </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  logoutButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
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
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EBF4FF',
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 4,
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
