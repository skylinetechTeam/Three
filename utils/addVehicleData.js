/**
 * Função temporária para adicionar dados do veículo ao perfil do motorista
 * TODO: Substituir por tela de cadastro de veículo
 */

import LocalDatabase from '../services/localDatabase';
import driverAuthService from '../services/driverAuthService';

export const addVehicleDataToDriver = async (vehicleData) => {
  try {
    // Obter perfil atual
    const currentProfile = await driverAuthService.getLocalDriverData() || 
                          await LocalDatabase.getDriverProfile();
    
    if (!currentProfile) {
      console.error('Nenhum perfil de motorista encontrado');
      return false;
    }

    // Adicionar dados do veículo
    const updatedProfile = {
      ...currentProfile,
      vehicleInfo: vehicleData || {
        make: 'Honda',
        model: 'Civic',
        year: 2018,
        color: 'Prata',
        plate: 'LD-43-18-MH'
      }
    };

    // Salvar perfil atualizado
    await LocalDatabase.saveDriverProfile(updatedProfile);
    await driverAuthService.saveLocalDriverData(updatedProfile);

    console.log('✅ Dados do veículo adicionados ao perfil:', updatedProfile.vehicleInfo);
    return true;
  } catch (error) {
    console.error('❌ Erro ao adicionar dados do veículo:', error);
    return false;
  }
};

// Exemplo de uso:
// import { addVehicleDataToDriver } from '../utils/addVehicleData';
// 
// addVehicleDataToDriver({
//   make: 'Toyota',
//   model: 'Corolla',
//   year: 2020,
//   color: 'Branco',
//   plate: 'LD-12-34-AB'
// });