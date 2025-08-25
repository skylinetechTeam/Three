import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Updates from 'expo-updates';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import ReservasScreen from './screens/ReservasScreen';
import FavoritosScreen from './screens/FavoritosScreen';
import PaymentScreen from './screens/PaymentScreen';
import PaymentHistoryScreen from './screens/PaymentHistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import HelpScreen from './screens/HelpScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import TermsScreen from './screens/TermsScreen';
import AboutScreen from './screens/AboutScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SetPasswordScreen from './screens/SetPasswordScreen';

// Driver Screens
import DriverLoginScreen from './screens/DriverLoginScreen';
import DriverMapScreen from './screens/DriverMapScreen';
import DriverRequestsScreen from './screens/DriverRequestsScreen';
import DriverProfileScreen from './screens/DriverProfileScreen';
import DriverSettingsScreen from './screens/DriverSettingsScreen';
import Toast from 'react-native-toast-message';
import SplashScreen from './components/SplashScreen';
import LocalDatabase from './services/localDatabase';
import driverAuthService from './services/driverAuthService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          height: 70 + insets.bottom,
          backgroundColor: '#2563EB',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarIconStyle: {
          height: 30,
          width: 30,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#93C5FD',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reservas"
        component={ReservasScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Favoritos"
        component={FavoritosScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Conta"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function DriverTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          height: 70 + insets.bottom,
          backgroundColor: '#1F2937',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarIconStyle: {
          height: 30,
          width: 30,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
      }}
    >
      <Tab.Screen
        name="DriverMap"
        component={DriverMapScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DriverRequests"
        component={DriverRequestsScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Solicitações',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DriverSettings"
        component={DriverSettingsScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Configurações',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDriverLoggedIn, setIsDriverLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null); // 'passenger' ou 'driver'

  useEffect(() => {
    checkLoginStatus();
    checkForUpdates();
  }, []);

  const checkLoginStatus = async () => {
    try {
      console.log('🔍 Verificando status de login...');
      
      // Verificar login de passageiro
      const userProfile = await LocalDatabase.getUserProfile();
      const isPassengerLoggedIn = userProfile && userProfile.isLoggedIn;
      
      // Verificar login de motorista
      const isDriverLoggedInStatus = await driverAuthService.isDriverLoggedIn();
      
      console.log('👤 Passageiro logado:', isPassengerLoggedIn);
      console.log('🚗 Motorista logado:', isDriverLoggedInStatus);
      
      if (isDriverLoggedInStatus) {
        setIsDriverLoggedIn(true);
        setUserType('driver');
        console.log('✅ Redirecionando para área do motorista');
      } else if (isPassengerLoggedIn) {
        setIsLoggedIn(true);
        setUserType('passenger');
        console.log('✅ Redirecionando para área do passageiro');
      } else {
        console.log('❌ Nenhum usuário logado');
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar status de login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkForUpdates = async () => {
    try {
      if (__DEV__) {
        console.log('Skipping update check in development mode');
        return;
      }

      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        Alert.alert(
          'Atualização Disponível',
          'Uma nova versão do aplicativo está disponível. Deseja atualizar agora?',
          [
            {
              text: 'Depois',
              style: 'cancel',
            },
            {
              text: 'Atualizar',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  Alert.alert(
                    'Atualização Pronta',
                    'A atualização foi baixada. O aplicativo será reiniciado.',
                    [
                      {
                        text: 'Reiniciar',
                        onPress: () => Updates.reloadAsync(),
                      },
                    ]
                  );
                } catch (error) {
                  console.error('Error downloading update:', error);
                  Alert.alert('Erro', 'Falha ao baixar a atualização. Tente novamente mais tarde.');
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  // Determinar tela inicial baseada no tipo de usuário logado
  const getInitialRoute = () => {
    if (isDriverLoggedIn) return "DriverTabs";
    if (isLoggedIn) return "HomeTabs";
    return "Login";
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={getInitialRoute()}>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SetPassword"
            component={SetPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HomeTabs"
            component={HomeTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DriverLogin"
            component={DriverLoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DriverTabs"
            component={DriverTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PaymentHistory"
            component={PaymentHistoryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Help"
            component={HelpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Terms"
            component={TermsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
