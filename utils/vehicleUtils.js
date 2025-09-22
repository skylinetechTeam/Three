/**
 * Utilitário para extrair dados do veículo de diferentes estruturas de dados
 * Resolve o problema de dados do veículo vindo em formatos diferentes
 */

/**
 * Extrai informações do veículo de diferentes estruturas de dados do motorista
 * @param {Object} driverProfile - Perfil do motorista com dados do veículo
 * @returns {Object} Dados padronizados do veículo
 */
export const extractVehicleInfo = (driverProfile) => {
  if (!driverProfile) {
    console.warn('⚠️ [extractVehicleInfo] driverProfile é null/undefined');
    return getDefaultVehicleInfo();
  }

  console.log('🔍 [extractVehicleInfo] Analisando perfil:', {
    hasVehicles: !!driverProfile.vehicles,
    vehiclesLength: driverProfile.vehicles?.length,
    hasVehicle: !!driverProfile.vehicle,
    hasVehicleInfo: !!driverProfile.vehicleInfo,
    hasIndividualFields: !!(driverProfile.vehicle_make || driverProfile.marca)
  });
  
  // Log detalhado da estrutura recebida
  console.log('📊 [extractVehicleInfo] Estrutura detalhada do perfil:');
  console.log('  - vehicles:', JSON.stringify(driverProfile.vehicles, null, 2));
  console.log('  - vehicle:', JSON.stringify(driverProfile.vehicle, null, 2));
  console.log('  - vehicleInfo:', JSON.stringify(driverProfile.vehicleInfo, null, 2));

  // Prioridade na extração dos dados:
  // 1. vehicles[0] (array de veículos)
  // 2. vehicle (objeto veículo)
  // 3. vehicleInfo (objeto info do veículo)
  // 4. campos individuais (vehicle_make, etc.)
  // 5. campos alternativos (marca, modelo, etc.)
  // 6. valores padrão

  const vehicle = driverProfile.vehicles?.[0]; // Primeiro veículo do array

  const vehicleInfo = {
    make: vehicle?.make || 
          driverProfile.vehicle?.make || 
          driverProfile.vehicleInfo?.make || 
          driverProfile.vehicle_make || 
          driverProfile.marca ||
          'Honda',
    
    model: vehicle?.model || 
           driverProfile.vehicle?.model || 
           driverProfile.vehicleInfo?.model || 
           driverProfile.vehicle_model || 
           driverProfile.modelo ||
           'Civic',
    
    year: vehicle?.year || 
          driverProfile.vehicle?.year || 
          driverProfile.vehicleInfo?.year || 
          driverProfile.vehicle_year || 
          driverProfile.ano ||
          2018,
    
    color: vehicle?.color || 
           driverProfile.vehicle?.color || 
           driverProfile.vehicleInfo?.color || 
           driverProfile.vehicle_color || 
           driverProfile.cor ||
           'Prata',
    
    plate: vehicle?.license_plate || 
           vehicle?.plate || 
           driverProfile.vehicle?.license_plate || 
           driverProfile.vehicle?.plate || 
           driverProfile.vehicleInfo?.plate || 
           driverProfile.vehicle_plate || 
           driverProfile.license_plate || 
           driverProfile.placa ||
           'LD-43-18-MH'
  };

  console.log('✅ [extractVehicleInfo] Veículo extraído:', vehicleInfo);

  // Validar se os dados extraídos são válidos
  if (!isValidVehicleInfo(vehicleInfo)) {
    console.warn('⚠️ [extractVehicleInfo] Dados inválidos, usando padrão');
    return getDefaultVehicleInfo();
  }

  return vehicleInfo;
};

/**
 * Valida se as informações do veículo são válidas
 * @param {Object} vehicleInfo - Informações do veículo
 * @returns {boolean} True se válido
 */
const isValidVehicleInfo = (vehicleInfo) => {
  return vehicleInfo && 
         typeof vehicleInfo.make === 'string' && 
         typeof vehicleInfo.model === 'string' && 
         typeof vehicleInfo.plate === 'string' &&
         vehicleInfo.make.length > 0 &&
         vehicleInfo.model.length > 0 &&
         vehicleInfo.plate.length > 0;
};

/**
 * Retorna informações padrão do veículo
 * @returns {Object} Dados padrão do veículo
 */
const getDefaultVehicleInfo = () => {
  return {
    make: 'Honda',
    model: 'Civic',
    year: 2018,
    color: 'Prata',
    plate: 'LD-43-18-MH'
  };
};

/**
 * Formata as informações do veículo para exibição
 * @param {Object} vehicleInfo - Informações do veículo
 * @returns {Object} Dados formatados para exibição
 */
export const formatVehicleForDisplay = (vehicleInfo) => {
  const vehicle = vehicleInfo || getDefaultVehicleInfo();
  
  return {
    fullName: `${vehicle.make} ${vehicle.model}`,
    details: `${vehicle.plate} • ${vehicle.color}`,
    year: `Ano: ${vehicle.year}`,
    make: vehicle.make,
    model: vehicle.model,
    color: vehicle.color,
    plate: vehicle.plate,
    year: vehicle.year
  };
};

/**
 * Debug: Imprime todas as possíveis fontes de dados do veículo
 * @param {Object} driverProfile - Perfil do motorista
 */
export const debugVehicleData = (driverProfile) => {
  if (!driverProfile) {
    console.log('❌ [debugVehicleData] driverProfile é null');
    return;
  }

  console.log('🔍 [DEBUG] Análise completa dos dados do veículo:');
  console.log('📊 [DEBUG] Estrutura geral:', {
    hasVehicles: !!driverProfile.vehicles,
    hasVehicle: !!driverProfile.vehicle,
    hasVehicleInfo: !!driverProfile.vehicleInfo
  });

  // vehicles[0]
  if (driverProfile.vehicles?.[0]) {
    console.log('🚗 [DEBUG] vehicles[0]:', driverProfile.vehicles[0]);
  } else {
    console.log('❌ [DEBUG] vehicles[0]: não encontrado');
  }

  // vehicle
  if (driverProfile.vehicle) {
    console.log('🚗 [DEBUG] vehicle:', driverProfile.vehicle);
  } else {
    console.log('❌ [DEBUG] vehicle: não encontrado');
  }

  // vehicleInfo
  if (driverProfile.vehicleInfo) {
    console.log('🚗 [DEBUG] vehicleInfo:', driverProfile.vehicleInfo);
  } else {
    console.log('❌ [DEBUG] vehicleInfo: não encontrado');
  }

  // Campos individuais
  const individualFields = {
    vehicle_make: driverProfile.vehicle_make,
    vehicle_model: driverProfile.vehicle_model,
    vehicle_year: driverProfile.vehicle_year,
    vehicle_color: driverProfile.vehicle_color,
    vehicle_plate: driverProfile.vehicle_plate,
    license_plate: driverProfile.license_plate
  };
  
  console.log('🔧 [DEBUG] Campos individuais:', individualFields);

  // Campos alternativos
  const alternativeFields = {
    marca: driverProfile.marca,
    modelo: driverProfile.modelo,
    ano: driverProfile.ano,
    cor: driverProfile.cor,
    placa: driverProfile.placa
  };
  
  console.log('🌐 [DEBUG] Campos alternativos:', alternativeFields);

  // Resultado final
  const finalResult = extractVehicleInfo(driverProfile);
  console.log('✅ [DEBUG] Resultado final:', finalResult);
};

export default {
  extractVehicleInfo,
  formatVehicleForDisplay,
  debugVehicleData
};