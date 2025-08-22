// Script para testar e corrigir o registro do motorista
const API_BASE_URL = 'https://cc4618078e8a.ngrok-free.app/api';

async function testAndFixDriverRegistration() {
  console.log('🔧 === TESTANDO E CORRIGINDO REGISTRO DO MOTORISTA ===');
  
  try {
    // 1. Primeiro, vamos verificar se o motorista já está registrado
    console.log('📱 Verificando se o motorista já está registrado...');
    
    const searchResponse = await fetch(`${API_BASE_URL}/drivers/search?phone=+244963258841`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const searchData = await searchResponse.json();
    console.log('📋 Status da busca:', searchResponse.status);
    console.log('📦 Dados da busca:', searchData);

    let driverId;

    if (searchResponse.ok && searchData.data) {
      console.log('✅ Motorista já registrado!');
      driverId = searchData.data.driverId;
      console.log('🆔 Driver ID encontrado:', driverId);
    } else {
      console.log('🔄 Motorista não encontrado, registrando...');
      
      // 2. Registrar o motorista
      const driverData = {
        name: 'Alexandre Landa',
        phone: '+244963258841',
        email: 'alexandre@test.com',
        licenseNumber: 'CNH987654321',
        vehicleInfo: {
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          color: 'Preto',
          plate: 'LD-98-76-AB'
        }
      };

      console.log('📦 Dados para registro:', driverData);
      
      const registerResponse = await fetch(`${API_BASE_URL}/drivers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverData),
      });

      const registerData = await registerResponse.json();
      console.log('📋 Status do registro:', registerResponse.status);
      console.log('📦 Dados do registro:', registerData);

      if (registerResponse.ok && registerData.data) {
        console.log('✅ Motorista registrado com sucesso!');
        driverId = registerData.data.driverId;
        console.log('🆔 Novo Driver ID:', driverId);
      } else {
        console.error('❌ Erro no registro:', registerData);
        throw new Error(registerData.message || 'Falha no registro');
      }
    }

    // 3. Testar se o motorista pode receber solicitações
    console.log('🧪 Testando busca de solicitações...');
    
    const pendingResponse = await fetch(`${API_BASE_URL}/rides/pending?driverLocation=${JSON.stringify({latitude: -8.8070183, longitude: 13.3010267})}&radius=10`);
    const pendingData = await pendingResponse.json();
    
    console.log('📋 Status da busca de solicitações:', pendingResponse.status);
    console.log('📦 Solicitações encontradas:', pendingData.data?.length || 0);
    
    if (pendingData.data && pendingData.data.length > 0) {
      console.log('🎉 SUCCESS! Motorista pode receber solicitações!');
      console.log('📋 Solicitações disponíveis:', pendingData.data.length);
    } else {
      console.log('⚠️ Nenhuma solicitação encontrada (pode ser normal se não há solicitações pendentes)');
    }

    // 4. Atualizar o perfil local do motorista
    console.log('💾 Atualizando perfil local...');
    
    // Aqui você precisaria atualizar o AsyncStorage do app
    // Por enquanto, vamos mostrar as informações que devem ser salvas
    const profileUpdate = {
      apiRegistered: true,
      apiDriverId: driverId,
      lastStatusChange: new Date().toISOString(),
    };
    
    console.log('📦 Dados para atualizar no perfil local:', profileUpdate);
    console.log('💡 Copie estes dados e atualize o perfil local do motorista no app');
    
    return driverId;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    throw error;
  }
}

// Executar teste e correção
testAndFixDriverRegistration()
  .then(driverId => {
    console.log('🎉 Processo concluído!');
    console.log('🆔 Driver ID final:', driverId);
    console.log('💡 Agora atualize o perfil local do motorista com este ID');
  })
  .catch(error => {
    console.error('💥 Falha no processo:', error);
  });
