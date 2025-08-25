import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import driverAuthService from '../services/driverAuthService';
import { COLORS, FONTS, SIZES } from '../config/theme';

const DriverAuthChecker = ({ navigation, onAuthChecked }) => {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Verificando status de autenticação do motorista...');
      
      // Verificar se motorista está logado
      const isLoggedIn = await driverAuthService.isDriverLoggedIn();
      
      if (isLoggedIn) {
        console.log('✅ Motorista já está logado');
        const localData = await driverAuthService.getLocalDriverData();
        
        if (localData) {
          console.log('👤 Dados do motorista encontrados:', localData.name || localData.email);
          
          // Tentar buscar dados atualizados do Supabase
          try {
            const updatedData = await driverAuthService.getDriverFullData(localData.id);
            if (updatedData) {
              // Atualizar dados locais com informações mais recentes
              await driverAuthService.saveDriverLocally(updatedData, localData.photo);
            }
          } catch (error) {
            console.warn('⚠️ Não foi possível atualizar dados do Supabase, usando dados locais:', error);
          }
          
          // Navegar direto para área do motorista
          navigation.reset({ 
            index: 0, 
            routes: [{ name: "DriverTabs" }] 
          });
          return;
        }
      }
      
      console.log('❌ Motorista não está logado ou dados não encontrados');
      
      // Callback para indicar que a verificação foi concluída
      if (onAuthChecked) {
        onAuthChecked(false);
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      
      // Em caso de erro, continuar para tela de login
      if (onAuthChecked) {
        onAuthChecked(false);
      }
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Verificando login...</Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...FONTS.body2,
    color: COLORS.gray,
    marginTop: SIZES.padding.medium,
  },
});

export default DriverAuthChecker;