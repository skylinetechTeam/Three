/**
 * Script de teste para verificar se os dados do veículo estão sendo enviados corretamente
 * Execute com: node test-vehicle-data.js
 */

const fetch = require('node-fetch');

// Configuração da API
const API_BASE_URL = 'http://192.168.18.8:3000/api';

// Cores para output no console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}========================================${colors.reset}`);
console.log(`${colors.cyan}🚗 TESTE DE DADOS DO VEÍCULO NA API 🚗${colors.reset}`);
console.log(`${colors.cyan}========================================${colors.reset}\n`);

// Dados de teste do motorista com veículo
const testDriverData = {
  name: 'Motorista Teste Veículo',
  phone: '+244 943 204 862',
  email: 'motorista.teste@email.com',
  licenseNumber: 'TEST-LICENSE-123',
  vehicleInfo: {
    make: 'Toyota',
    model: 'Corolla',
    year: 2022,
    color: 'Branco',
    plate: 'LD-12-34-AB'
  },
  location: {
    lat: -8.823,
    lng: 13.234
  }
};

// Função para registrar motorista de teste
async function registerTestDriver() {
  console.log(`${colors.blue}📝 Registrando motorista de teste...${colors.reset}`);
  console.log(`${colors.yellow}Dados do veículo enviados:${colors.reset}`);
  console.log(JSON.stringify(testDriverData.vehicleInfo, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/drivers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testDriverData),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✅ Motorista registrado com sucesso!${colors.reset}`);
      console.log(`${colors.green}ID do motorista: ${data.data.driverId}${colors.reset}`);
      console.log(`\n${colors.yellow}Dados do veículo retornados:${colors.reset}`);
      console.log(JSON.stringify(data.data.driver.vehicleInfo, null, 2));
      
      return data.data.driverId;
    } else {
      console.log(`${colors.red}❌ Erro ao registrar motorista: ${data.message}${colors.reset}`);
      return null;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erro na requisição:`, error, colors.reset);
    return null;
  }
}

// Função para criar uma corrida de teste
async function createTestRide() {
  console.log(`\n${colors.blue}📍 Criando corrida de teste...${colors.reset}`);
  
  const testRideData = {
    passengerId: 'passenger-test-123',
    passengerName: 'Passageiro Teste',
    passengerPhone: '+244 900 111 222',
    pickup: {
      address: 'Rua Teste, 123',
      lat: -8.823,
      lng: 13.234
    },
    destination: {
      address: 'Avenida Destino, 456',
      lat: -8.830,
      lng: 13.240
    },
    serviceType: 'standard',
    price: 500,
    status: 'pending'
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/rides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRideData),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✅ Corrida criada com sucesso!${colors.reset}`);
      console.log(`${colors.green}ID da corrida: ${data.data.rideId}${colors.reset}`);
      return data.data.rideId;
    } else {
      console.log(`${colors.red}❌ Erro ao criar corrida: ${data.message}${colors.reset}`);
      return null;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erro na requisição:`, error, colors.reset);
    return null;
  }
}

// Função para aceitar corrida com dados do veículo
async function acceptRideWithVehicle(rideId, driverId) {
  console.log(`\n${colors.blue}🚕 Aceitando corrida com dados do veículo...${colors.reset}`);
  
  const acceptData = {
    driverId: driverId,
    driverName: testDriverData.name,
    driverPhone: testDriverData.phone,
    vehicleInfo: testDriverData.vehicleInfo
  };
  
  console.log(`${colors.yellow}Dados enviados na aceitação:${colors.reset}`);
  console.log(JSON.stringify(acceptData, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/accept`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(acceptData),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✅ Corrida aceita com sucesso!${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Erro ao aceitar corrida: ${data.message}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erro na requisição:`, error, colors.reset);
    return false;
  }
}

// Função para verificar os dados da corrida
async function verifyRideData(rideId) {
  console.log(`\n${colors.blue}🔍 Verificando dados da corrida...${colors.reset}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      const ride = data.data;
      
      console.log(`\n${colors.cyan}📊 DADOS COMPLETOS DA CORRIDA:${colors.reset}`);
      console.log(`${colors.yellow}Status:${colors.reset} ${ride.status}`);
      console.log(`${colors.yellow}Motorista:${colors.reset} ${ride.driver?.name || 'N/A'}`);
      
      if (ride.driver?.vehicleInfo || ride.vehicleInfo) {
        const vehicleData = ride.driver?.vehicleInfo || ride.vehicleInfo;
        console.log(`\n${colors.green}✅ DADOS DO VEÍCULO ENCONTRADOS:${colors.reset}`);
        console.log(`  ${colors.yellow}Marca:${colors.reset} ${vehicleData.make}`);
        console.log(`  ${colors.yellow}Modelo:${colors.reset} ${vehicleData.model}`);
        console.log(`  ${colors.yellow}Ano:${colors.reset} ${vehicleData.year}`);
        console.log(`  ${colors.yellow}Cor:${colors.reset} ${vehicleData.color}`);
        console.log(`  ${colors.yellow}Placa:${colors.reset} ${vehicleData.plate}`);
        
        // Verificar se os dados correspondem ao esperado
        const isCorrect = 
          vehicleData.make === testDriverData.vehicleInfo.make &&
          vehicleData.model === testDriverData.vehicleInfo.model &&
          vehicleData.year === testDriverData.vehicleInfo.year &&
          vehicleData.color === testDriverData.vehicleInfo.color &&
          vehicleData.plate === testDriverData.vehicleInfo.plate;
        
        if (isCorrect) {
          console.log(`\n${colors.green}🎉 SUCESSO! Todos os dados do veículo estão corretos!${colors.reset}`);
        } else {
          console.log(`\n${colors.red}⚠️ ATENÇÃO! Alguns dados do veículo não correspondem ao esperado.${colors.reset}`);
        }
      } else {
        console.log(`\n${colors.red}❌ ERRO! Dados do veículo não encontrados na corrida!${colors.reset}`);
        console.log(`${colors.yellow}Estrutura da corrida:${colors.reset}`);
        console.log(JSON.stringify(ride, null, 2));
      }
      
      return ride;
    } else {
      console.log(`${colors.red}❌ Erro ao buscar corrida: ${data.message}${colors.reset}`);
      return null;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erro na requisição:`, error, colors.reset);
    return null;
  }
}

// Função principal para executar todos os testes
async function runAllTests() {
  console.log(`${colors.magenta}🚀 Iniciando testes completos...${colors.reset}\n`);
  
  // 1. Registrar motorista
  const driverId = await registerTestDriver();
  if (!driverId) {
    console.log(`${colors.red}❌ Teste abortado: falha ao registrar motorista${colors.reset}`);
    return;
  }
  
  // 2. Criar corrida
  const rideId = await createTestRide();
  if (!rideId) {
    console.log(`${colors.red}❌ Teste abortado: falha ao criar corrida${colors.reset}`);
    return;
  }
  
  // 3. Aceitar corrida com dados do veículo
  const accepted = await acceptRideWithVehicle(rideId, driverId);
  if (!accepted) {
    console.log(`${colors.red}❌ Teste abortado: falha ao aceitar corrida${colors.reset}`);
    return;
  }
  
  // 4. Verificar se os dados foram salvos corretamente
  await verifyRideData(rideId);
  
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}📊 TESTE COMPLETO FINALIZADO${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
}

// Executar testes
runAllTests().catch(console.error);