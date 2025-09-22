// COPIE E COLE ESTE CÓDIGO NO CONSOLE DO NAVEGADOR COM O APP ABERTO

(async () => {
  console.log('🚗 ADICIONANDO VEÍCULO AO MOTORISTA CELESÓNIO');
  
  // Dados corretos do veículo
  const vehicleData = {
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    color: 'Branco',
    plate: 'LD-46-11-HE'
  };
  
  try {
    // Buscar perfil atual
    const currentProfile = JSON.parse(await window.AsyncStorage.getItem('driver_auth_data'));
    
    if (!currentProfile) {
      console.error('❌ Nenhum motorista logado!');
      return;
    }
    
    console.log('👤 Atualizando motorista:', currentProfile.name);
    
    // Atualizar perfil com dados do veículo em TODOS os formatos possíveis
    const updatedProfile = {
      ...currentProfile,
      // Array vehicles (formato principal)
      vehicles: [{
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        color: vehicleData.color,
        license_plate: vehicleData.plate,
        plate: vehicleData.plate,
        // Campos em português também
        marca: vehicleData.make,
        modelo: vehicleData.model,
        ano: vehicleData.year,
        cor: vehicleData.color,
        placa: vehicleData.plate
      }],
      // Array vehicle 
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
      // Objeto vehicleInfo
      vehicleInfo: {
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        color: vehicleData.color,
        plate: vehicleData.plate
      },
      // Campos individuais em inglês
      vehicle_make: vehicleData.make,
      vehicle_model: vehicleData.model,
      vehicle_year: vehicleData.year,
      vehicle_color: vehicleData.color,
      vehicle_plate: vehicleData.plate,
      license_plate: vehicleData.plate,
      // Campos em português
      marca: vehicleData.make,
      modelo: vehicleData.model,
      ano: vehicleData.year,
      cor: vehicleData.color,
      placa: vehicleData.plate
    };
    
    // Salvar em TODOS os lugares possíveis
    await window.AsyncStorage.setItem('driver_auth_data', JSON.stringify(updatedProfile));
    await window.AsyncStorage.setItem('driverProfile', JSON.stringify(updatedProfile));
    await window.AsyncStorage.setItem('driver_session', JSON.stringify({
      ...updatedProfile,
      isActive: true,
      lastUpdate: new Date().toISOString()
    }));
    
    console.log('✅ Veículo adicionado com sucesso!');
    console.log('🚗 Veículo: Toyota Corolla 2020');
    console.log('🎨 Cor: Branco');
    console.log('📋 Placa: LD-46-11-HE');
    console.log('\n⚠️ IMPORTANTE: RECARREGUE A PÁGINA (F5) PARA VER AS MUDANÇAS!');
    
    // Verificar se foi salvo
    const verify = JSON.parse(await window.AsyncStorage.getItem('driver_auth_data'));
    if (verify.vehicles && verify.vehicles.length > 0) {
      console.log('\n✅ Verificação: Dados salvos corretamente!');
      console.log('Veículo no perfil:', verify.vehicles[0]);
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error);
  }
})();