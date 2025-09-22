/**
 * Script para adicionar dados do veículo ao motorista
 * Execute com: node add-vehicle-to-driver.js
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { addVehicleDataToDriver } from './utils/addVehicleData';
import driverAuthService from './services/driverAuthService';
import LocalDatabase from './services/localDatabase';

// Dados do veículo a serem adicionados
const vehicleData = {
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
  color: 'Branco',
  plate: 'LD-46-11-HE'
};

// Função principal para adicionar veículo
async function addVehicleToCurrentDriver() {
  try {
    console.log('🚗 ========== ADICIONANDO VEÍCULO AO MOTORISTA ==========');
    console.log('📍 Timestamp:', new Date().toISOString());
    
    // Buscar dados atuais do motorista
    console.log('\n🔍 Buscando perfil do motorista atual...');
    const currentProfile = await driverAuthService.getLocalDriverData();
    
    if (!currentProfile) {
      console.error('❌ Nenhum perfil de motorista encontrado!');
      return false;
    }
    
    console.log('✅ Motorista encontrado:', currentProfile.name);
    console.log('🆔 ID do motorista:', currentProfile.id);
    
    // Adicionar dados do veículo ao perfil
    console.log('\n📝 Adicionando dados do veículo...');
    console.log('🚙 Veículo a ser adicionado:', JSON.stringify(vehicleData, null, 2));
    
    // Criar estrutura atualizada com múltiplos formatos para compatibilidade
    const updatedProfile = {
      ...currentProfile,
      // Array vehicles (formato preferencial)
      vehicles: [{
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        color: vehicleData.color,
        license_plate: vehicleData.plate,
        plate: vehicleData.plate,
        marca: vehicleData.make,
        modelo: vehicleData.model,
        ano: vehicleData.year,
        cor: vehicleData.color,
        placa: vehicleData.plate
      }],
      // Objeto vehicle (compatibilidade)
      vehicle: [{
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        color: vehicleData.color,
        license_plate: vehicleData.plate,
        plate: vehicleData.plate,
        marca: vehicleData.make,
        modelo: vehicleData.model,
        ano: vehicleData.year,
        cor: vehicleData.color,
        placa: vehicleData.plate
      }],
      // Objeto vehicleInfo (compatibilidade)
      vehicleInfo: {
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        color: vehicleData.color,
        plate: vehicleData.plate
      },
      // Campos individuais (compatibilidade)
      vehicle_make: vehicleData.make,
      vehicle_model: vehicleData.model,
      vehicle_year: vehicleData.year,
      vehicle_color: vehicleData.color,
      vehicle_plate: vehicleData.plate,
      license_plate: vehicleData.plate,
      // Campos em português (compatibilidade)
      marca: vehicleData.make,
      modelo: vehicleData.model,
      ano: vehicleData.year,
      cor: vehicleData.color,
      placa: vehicleData.plate
    };
    
    // Salvar perfil atualizado
    console.log('\n💾 Salvando perfil atualizado...');
    
    // Salvar via driverAuthService
    await driverAuthService.saveLocalDriverData(updatedProfile);
    console.log('✅ Salvo via driverAuthService');
    
    // Salvar também via LocalDatabase para garantir
    await LocalDatabase.saveDriverProfile(updatedProfile);
    console.log('✅ Salvo via LocalDatabase');
    
    // Verificar se foi salvo corretamente
    console.log('\n🔍 Verificando dados salvos...');
    const verifyProfile = await driverAuthService.getLocalDriverData();
    
    if (verifyProfile && verifyProfile.vehicles && verifyProfile.vehicles.length > 0) {
      console.log('✅ Veículo adicionado com sucesso!');
      console.log('🚗 Dados do veículo salvo:', JSON.stringify(verifyProfile.vehicles[0], null, 2));
      
      console.log('\n📊 === RESUMO ===');
      console.log('✅ Motorista:', verifyProfile.name);
      console.log('✅ Veículo:', `${vehicleData.make} ${vehicleData.model}`);
      console.log('✅ Placa:', vehicleData.plate);
      console.log('✅ Cor:', vehicleData.color);
      console.log('✅ Ano:', vehicleData.year);
    } else {
      console.error('❌ Erro: Veículo não foi salvo corretamente');
    }
    
    console.log('\n========== PROCESSO CONCLUÍDO ==========');
    return true;
    
  } catch (error) {
    console.error('❌ ERRO ao adicionar veículo:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Se executado diretamente (não em React Native)
if (typeof window === 'undefined') {
  console.log('⚠️ Este script deve ser executado no contexto do React Native');
  console.log('💡 Use o código abaixo no console do navegador com o app rodando:');
  console.log(`
// Cole e execute este código no console do navegador:
(async () => {
  const vehicleData = {
    make: 'Toyota',
    model: 'Corolla', 
    year: 2020,
    color: 'Branco',
    plate: 'LD-46-11-HE'
  };
  
  const currentProfile = JSON.parse(await AsyncStorage.getItem('driver_auth_data'));
  
  if (!currentProfile) {
    console.error('Nenhum motorista logado!');
    return;
  }
  
  const updatedProfile = {
    ...currentProfile,
    vehicles: [{
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      color: vehicleData.color,
      license_plate: vehicleData.plate,
      plate: vehicleData.plate
    }],
    vehicleInfo: vehicleData,
    vehicle_make: vehicleData.make,
    vehicle_model: vehicleData.model,
    vehicle_year: vehicleData.year,
    vehicle_color: vehicleData.color,
    vehicle_plate: vehicleData.plate
  };
  
  await AsyncStorage.setItem('driver_auth_data', JSON.stringify(updatedProfile));
  await AsyncStorage.setItem('driverProfile', JSON.stringify(updatedProfile));
  
  console.log('✅ Veículo adicionado com sucesso!');
  console.log('🚗 Recarregue a página para ver as mudanças');
})();
  `);
} else {
  // Se estiver no React Native, executar automaticamente
  addVehicleToCurrentDriver();
}

export default addVehicleToCurrentDriver;