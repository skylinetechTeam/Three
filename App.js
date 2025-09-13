import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, Alert, Keyboard } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Updates from 'expo-updates';
import { UIProvider, useUI } from './contexts/UIContext';
import { RESPONSIVE, SIZES } from './config/theme';
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
import DriverChangePasswordScreen from './screens/DriverChangePasswordScreen';
import Toast from 'react-native-toast-message';
import SplashScreen from './components/SplashScreen';
import LocalDatabase from './services/localDatabase';
import driverAuthService from './services/driverAuthService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  const insets = useSafeAreaInsets();
  const { actions } = useUI();
  
  // Update keyboard state for responsive UI
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      actions.setKeyboardState(true, e.endCoordinates.height);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      actions.setKeyboardState(false, 0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [actions]);
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          height: RESPONSIVE.getDynamicSize({ small: 65, standard: 70, large: 75, tablet: 80 }) + insets.bottom,
          backgroundColor: '#2563EB',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: insets.bottom,
          paddingTop: SIZES.spacing.sm,
        },
        tabBarIconStyle: {
          height: RESPONSIVE.getIconSize('large'),
          width: RESPONSIVE.getIconSize('large'),
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#93C5FD',
        tabBarLabelStyle: {
          fontSize: RESPONSIVE.getDynamicSize({ small: 10, standard: 12, large: 14, tablet: 16 }),
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
            <Ionicons name="home-outline" size={RESPONSIVE.getIconSize('medium')} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reservas"
        component={ReservasScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={RESPONSIVE.getIconSize('medium')} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Favoritos"
        component={FavoritosScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={RESPONSIVE.getIconSize('medium')} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Conta"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={RESPONSIVE.getIconSize('medium')} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function DriverTabs() {
  const insets = useSafeAreaInsets();
  const { actions } = useUI();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          height: RESPONSIVE.getDynamicSize({ small: 65, standard: 70, large: 75, tablet: 80 }) + insets.bottom,
          backgroundColor: '#1F2937',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: insets.bottom,
          paddingTop: SIZES.spacing.sm,
        },
        tabBarIconStyle: {
          height: RESPONSIVE.getIconSize('large'),
          width: RESPONSIVE.getIconSize('large'),
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: RESPONSIVE.getDynamicSize({ small: 10, standard: 12, large: 14, tablet: 16 }),
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
            <Ionicons name="map-outline" size={RESPONSIVE.getIconSize('medium')} color={color} />
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
            <Ionicons name="list-outline" size={RESPONSIVE.getIconSize('medium')} color={color} />
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
            <Ionicons name="person-outline" size={RESPONSIVE.getIconSize('medium')} color={color} />
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
            <Ionicons name="settings-outline" size={RESPONSIVE.getIconSize('medium')} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Component with UI Context
function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDriverLoggedIn, setIsDriverLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null); // 'passenger' ou 'driver'
  const { actions } = useUI();

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
          <Stack.Screen
            name="DriverChangePassword"
            component={DriverChangePasswordScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Main App wrapper with UI Provider
export default function App() {
  return (
    <UIProvider>
      <AppContent />
    </UIProvider>
  );
}
