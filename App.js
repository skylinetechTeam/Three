import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import SetPasswordScreen from './screens/SetPasswordScreen';
import PhoneVerificationScreen from './screens/PhoneVerificationScreen';
import HomeScreen from './screens/HomeScreen';
import AccountScreen from './screens/AccountScreen';
import ReservasScreen from './screens/ReservasScreen';
import FavoritosScreen from './screens/FavoritosScreen';
import Toast from 'react-native-toast-message';
import SplashScreen from './components/SplashScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          height: 70,
          backgroundColor: '#2563EB',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
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
        component={AccountScreen}
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

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
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
          name="PhoneVerification"
          component={PhoneVerificationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeTabs"
          component={HomeTabs}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
      <Toast />
    </NavigationContainer>
  );
}
