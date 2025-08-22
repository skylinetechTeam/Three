#!/usr/bin/env node

// Test script para verificar integração da API
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

async function testApiIntegration() {
  console.log('🧪 Iniciando testes de integração da API...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testando health check...');
    const healthResponse = await fetch('http://localhost:3000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check OK:', healthData.status);
    
    // Test 2: Register driver
    console.log('\n2️⃣ Testando registro de motorista...');
    const driverData = {
      name: 'João Silva Teste',
      phone: '+244912345678',
      email: 'joao.teste@email.com',
      licenseNumber: 'CNH123456789',
      vehicleInfo: {
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        color: 'Branco',
        plate: 'LD-12-34-AB'
      },
      location: {
        lat: -8.8390,
        lng: 13.2894
      }
    };
    
    const driverResponse = await fetch(`${API_BASE_URL}/drivers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driverData)
    });
    
    const driverResult = await driverResponse.json();
    if (driverResponse.ok) {
      console.log('✅ Motorista registrado:', driverResult.data.driverId);
    } else {
      console.log('⚠️ Motorista já existe ou erro:', driverResult.message);
    }
    
    // Test 3: Register passenger
    console.log('\n3️⃣ Testando registro de passageiro...');
    const passengerData = {
      name: 'Maria Santos Teste',
      phone: '+244923456789',
      email: 'maria.teste@email.com',
      preferredPaymentMethod: 'cash'
    };
    
    const passengerResponse = await fetch(`${API_BASE_URL}/passengers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passengerData)
    });
    
    const passengerResult = await passengerResponse.json();
    if (passengerResponse.ok) {
      console.log('✅ Passageiro registrado:', passengerResult.data.passengerId);
    } else {
      console.log('⚠️ Passageiro já existe ou erro:', passengerResult.message);
    }
    
    // Test 4: Create ride request
    console.log('\n4️⃣ Testando solicitação de corrida...');
    const rideData = {
      passengerId: passengerResult.data?.passengerId || 'test-passenger-id',
      passengerName: 'Maria Santos Teste',
      passengerPhone: '+244923456789',
      pickup: {
        address: 'Rua de Teste, 123',
        lat: -8.8390,
        lng: 13.2894
      },
      destination: {
        address: 'Destino de Teste, 456',
        lat: -8.8500,
        lng: 13.3000
      },
      estimatedFare: 500,
      estimatedDistance: 5.2,
      estimatedTime: 15,
      paymentMethod: 'cash',
      vehicleType: 'standard'
    };
    
    const rideResponse = await fetch(`${API_BASE_URL}/rides/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rideData)
    });
    
    const rideResult = await rideResponse.json();
    if (rideResponse.ok) {
      console.log('✅ Corrida solicitada:', rideResult.data.rideId);
    } else {
      console.log('❌ Erro ao solicitar corrida:', rideResult.message);
    }
    
    // Test 5: Get nearby drivers
    console.log('\n5️⃣ Testando busca de motoristas próximos...');
    const nearbyResponse = await fetch(`${API_BASE_URL}/drivers/nearby?lat=-8.8390&lng=13.2894&radius=10`);
    const nearbyResult = await nearbyResponse.json();
    
    if (nearbyResponse.ok) {
      console.log('✅ Motoristas encontrados:', nearbyResult.count);
    } else {
      console.log('❌ Erro ao buscar motoristas:', nearbyResult.message);
    }
    
    console.log('\n🎉 Testes concluídos!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testApiIntegration();
}

module.exports = { testApiIntegration };