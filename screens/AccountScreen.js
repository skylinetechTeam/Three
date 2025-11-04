import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LocalDatabase from '../services/localDatabase';

export default function AccountScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [tripCount, setTripCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    loadUserData();
    
    // Reload profile when navigating back
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const profile = await LocalDatabase.getUserProfile();
      console.log('📄 Account - Profile loaded:', profile);
      setUserProfile(profile);

      const trips = await LocalDatabase.getTripHistory();
      setTripCount(trips.length);

      const favorites = await LocalDatabase.getFavoriteDestinations();
      setFavoriteCount(favorites.length);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const accountOptions = [
    {
      id: 'profile',
      title: 'Meu Perfil',
      subtitle: 'Editar informações pessoais',
      icon: 'person-outline',
      color: '#3B82F6',
      screen: 'Profile',
    },
    {
      id: 'payment',
      title: 'Pagamentos',
      subtitle: 'Métodos de pagamento e histórico',
      icon: 'card-outline',
      color: '#10B981',
      screen: 'Payment',
    },
    {
      id: 'history',
      title: 'Histórico de Pagamentos',
      subtitle: 'Ver todas as transações',
      icon: 'receipt-outline',
      color: '#F59E0B',
      screen: 'PaymentHistory',
    },
    {
      id: 'favorites',
      title: 'Meus Favoritos',
      subtitle: 'Locais e rotas salvos',
      icon: 'heart-outline',
      color: '#EF4444',
      screen: 'Favoritos',
    },
    {
      id: 'reservations',
      title: 'Minhas Reservas',
      subtitle: 'Agendamentos e histórico',
      icon: 'calendar-outline',
      color: '#8B5CF6',
      screen: 'Reservas',
    },
    {
      id: 'settings',
      title: 'Configurações',
      subtitle: 'Preferências e privacidade',
      icon: 'settings-outline',
      color: '#6B7280',
      screen: 'Settings',
    },
    {
      id: 'help',
      title: 'Ajuda e Suporte',
      subtitle: 'Central de ajuda e contato',
      icon: 'help-circle-outline',
      color: '#059669',
      screen: 'Help',
    },
  ];

  const handleOptionPress = (option) => {
    if (option.screen === 'Profile') {
      // Implementar navegação para perfil
      console.log('Navegando para perfil');
    } else if (option.screen === 'Payment') {
      navigation.navigate('Payment', { amount: 2500 }); // Valor em Kz
    } else if (option.screen === 'PaymentHistory') {
      navigation.navigate('PaymentHistory');
    } else if (option.screen === 'Settings') {
      navigation.navigate('Settings');
    } else if (option.screen === 'Help') {
      navigation.navigate('Help');
    } else {
      // Para outras opções que já estão nas tabs
      console.log('Navegando para:', option.screen);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1737e8', '#1e4fd8', '#2a5fd8']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Minha Conta</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações do Usuário */}
        <View style={styles.userSection}>
          {userProfile?.profileImageUrl ? (
            <Image 
              source={{ uri: userProfile.profileImageUrl }} 
              style={styles.userAvatarImage}
            />
          ) : (
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={40} color="#1737e8" />
            </View>
          )}
          <Text style={styles.userName}>
            {userProfile?.nome || userProfile?.name || 'Usuário'}
          </Text>
          <Text style={styles.userEmail}>
            {userProfile?.email || userProfile?.telefone || userProfile?.phone || ''}
          </Text>
        </View>

        {/* Opções da Conta */}
        <View style={styles.optionsSection}>
          {accountOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={() => handleOptionPress(option)}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Estatísticas */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Estatísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tripCount}</Text>
              <Text style={styles.statLabel}>Corridas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{favoriteCount}</Text>
              <Text style={styles.statLabel}>Favoritos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {userProfile?.createdAt ? 
                  new Date(userProfile.createdAt).getFullYear() : 
                  new Date().getFullYear()
                }
              </Text>
              <Text style={styles.statLabel}>Membro desde</Text>
            </View>
          </View>
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
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
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
  userAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
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
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
  },
  optionsSection: {
    marginBottom: 32,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsSection: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1737e8',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
