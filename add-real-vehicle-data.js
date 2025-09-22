/**
 * Script para adicionar dados REAIS do veículo ao motorista Celesónio
 * Execute no console do navegador com o app aberto
 */

// Dados REAIS do veículo do Celesónio
const realVehicleData = {
  make: 'Honda',
  model: 'Civic',  
  year: 2018,
  color: 'Prata',
  plate: 'LD-43-18-MH'
};

// Função para adicionar veículo ao perfil atual
async function addRealVehicleData() {
  try {
    console.log('🚗 ========== ADICIONANDO VEÍCULO REAL AO MOTORISTA ==========');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    // Buscar dados do motorista no AsyncStorage
    const driverData = await AsyncStorage.getItem('driver_auth_data');
    
    if (!driverData) {
      console.error('❌ Nenhum motorista encontrado no AsyncStorage!');
      return false;
    }
    
    const currentDriver = JSON.parse(driverData);
    console.log('✅ Motorista encontrado:', currentDriver.name);
    
    // Criar perfil atualizado com TODOS os formatos possíveis de dados do veículo
    const updatedProfile = {
      ...currentDriver,
      // Array vehicles (formato principal)
      vehicles: [{
        id: 1,
        make: realVehicleData.make,
        model: realVehicleData.model,
        year: realVehicleData.year,
        color: realVehicleData.color,
        license_plate: realVehicleData.plate,
        plate: realVehicleData.plate,
        // Campos em português para compatibilidade
        marca: realVehicleData.make,
        modelo: realVehicleData.model,
        ano: realVehicleData.year,
        cor: realVehicleData.color,
        placa: realVehicleData.plate,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }],
      // Objeto vehicle (compatibilidade)
      vehicle: {
        make: realVehicleData.make,
        model: realVehicleData.model,
        year: realVehicleData.year,
        color: realVehicleData.color,
        license_plate: realVehicleData.plate,
        plate: realVehicleData.plate,
        // Campos em português
        marca: realVehicleData.make,
        modelo: realVehicleData.model,
        ano: realVehicleData.year,
        cor: realVehicleData.color,
        placa: realVehicleData.plate
      },
      // Objeto vehicleInfo (compatibilidade)
      vehicleInfo: {
        make: realVehicleData.make,
        model: realVehicleData.model,
        year: realVehicleData.year,
        color: realVehicleData.color,
        plate: realVehicleData.plate
      },
      // Campos individuais (compatibilidade)
      vehicle_make: realVehicleData.make,
      vehicle_model: realVehicleData.model,
      vehicle_year: realVehicleData.year,
      vehicle_color: realVehicleData.color,
      vehicle_plate: realVehicleData.plate,
      license_plate: realVehicleData.plate,
      // Campos em português (compatibilidade)
      marca: realVehicleData.make,
      modelo: realVehicleData.model,
      ano: realVehicleData.year,
      cor: realVehicleData.color,
      placa: realVehicleData.plate,
      // Metadados
      updatedAt: new Date().toISOString(),
      vehicleLastUpdate: new Date().toISOString()
    };
    
    console.log('📊 Salvando dados do veículo em múltiplos formatos...');
    console.log('🚙 Veículo adicionado:', realVehicleData);
    
    // Salvar em TODAS as chaves possíveis
    await AsyncStorage.setItem('driver_auth_data', JSON.stringify(updatedProfile));
    await AsyncStorage.setItem('driverProfile', JSON.stringify(updatedProfile));
    await AsyncStorage.setItem('driver_profile', JSON.stringify(updatedProfile));
    
    console.log('✅ Dados salvos em AsyncStorage!');
    
    // Verificar se foi salvo corretamente
    const verifyData = JSON.parse(await AsyncStorage.getItem('driver_auth_data'));
    
    if (verifyData.vehicles && verifyData.vehicles.length > 0) {
      console.log('🎉 SUCESSO! Veículo adicionado com sucesso!');
      console.log('📊 Dados verificados:');
      console.log('  - Array vehicles:', verifyData.vehicles[0]);
      console.log('  - Objeto vehicle:', verifyData.vehicle);
      console.log('  - Objeto vehicleInfo:', verifyData.vehicleInfo);
      console.log('  - Campos individuais:', {
        make: verifyData.vehicle_make,
        model: verifyData.vehicle_model,
        year: verifyData.vehicle_year,
        color: verifyData.vehicle_color,
        plate: verifyData.vehicle_plate
      });
      
      console.log('');
      console.log('🔄 PRÓXIMOS PASSOS:');
      console.log('1. Feche e abra o app novamente');
      console.log('2. Teste aceitar uma corrida');
      console.log('3. Verifique se os dados do veículo chegam corretamente no passageiro');
      console.log('');
      console.log('✅ Configuração concluída!');
      
      return true;
    } else {
      console.error('❌ Erro: Dados não foram salvos corretamente');
      return false;
    }
    
  } catch (error) {
    console.error('❌ ERRO ao adicionar veículo:', error);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Se estiver no console do navegador, executar automaticamente
if (typeof AsyncStorage !== 'undefined') {
  addRealVehicleData().then(result => {
    if (result) {
      console.log('🎯 Processo concluído com sucesso!');
    } else {
      console.error('💥 Processo falhou!');
    }
  });
} else {
  console.log('⚠️ Este script deve ser executado no console do navegador com o app React Native rodando');
  console.log('');
  console.log('📋 INSTRUÇÕES:');
  console.log('1. Abra o app do motorista no navegador');
  console.log('2. Faça login como motorista');
  console.log('3. Abra as ferramentas de desenvolvedor (F12)');
  console.log('4. Vá para a aba Console');
  console.log('5. Cole e execute este script completo');
}

export default addRealVehicleData;