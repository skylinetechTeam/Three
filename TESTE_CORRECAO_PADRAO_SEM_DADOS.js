// TESTE DA CORREÇÃO: Padrão Sem Dados no Modal do Passageiro
// Execute este script no console do React Native Debugger para testar

console.log('🧪 INICIANDO TESTE DA CORREÇÃO - Padrão Sem Dados');

// Simular função isValidDriverData (copie da HomeScreen.js)
const isValidDriverData = (driverInfo) => {
  if (!driverInfo) {
    console.log('❌ [VALIDAÇÃO] driverInfo é nulo ou undefined');
    return false;
  }
  
  // Verificar nome válido (não pode ser padrão)
  const hasValidName = driverInfo.name && 
                      driverInfo.name !== 'Motorista' && 
                      driverInfo.name.trim().length > 2;
  
  // Verificar ID válido
  const hasValidId = driverInfo.id && 
                    driverInfo.id.toString().trim().length > 0;
  
  // Verificar se tem dados do veículo válidos
  const hasValidVehicle = driverInfo.vehicleInfo && (
    (driverInfo.vehicleInfo.make && driverInfo.vehicleInfo.model) ||
    (driverInfo.vehicleInfo.plate && 
     driverInfo.vehicleInfo.plate !== 'ABC-1234' && 
     driverInfo.vehicleInfo.plate.trim().length > 0) ||
    (driverInfo.vehicleInfo.color && driverInfo.vehicleInfo.color.trim().length > 0)
  );
  
  const isValid = hasValidName && hasValidId;
  
  console.log('🔍 [VALIDAÇÃO] Resultado da validação:', {
    hasValidName: hasValidName,
    hasValidId: hasValidId,
    hasValidVehicle: hasValidVehicle,
    name: driverInfo.name,
    id: driverInfo.id,
    vehicleInfo: driverInfo.vehicleInfo,
    isValid: isValid
  });
  
  return isValid;
};

// TESTE 1: Dados válidos (deve ACEITAR)
console.log('\n📝 TESTE 1: Dados válidos do motorista');
const validDriverData = {
  id: 'driver_123',
  name: 'João Silva',
  phone: '+244 912 345 678',
  vehicleInfo: {
    make: 'Toyota',
    model: 'Corolla',
    color: 'Branco',
    plate: 'LD-456-XY'
  },
  rating: 4.8,
  estimatedArrival: '5 minutos'
};

const test1Result = isValidDriverData(validDriverData);
console.log('✅ TESTE 1 RESULTADO:', test1Result ? 'ACEITO (correto)' : 'REJEITADO (erro)');

// TESTE 2: Dados padrão (deve REJEITAR)
console.log('\n📝 TESTE 2: Dados padrão do motorista');
const defaultDriverData = {
  id: null,
  name: 'Motorista',
  phone: '',
  vehicleInfo: {},
  rating: 0,
  estimatedArrival: '5-10 minutos'
};

const test2Result = isValidDriverData(defaultDriverData);
console.log('✅ TESTE 2 RESULTADO:', test2Result ? 'ACEITO (erro)' : 'REJEITADO (correto)');

// TESTE 3: Dados parcialmente válidos (deve ACEITAR)
console.log('\n📝 TESTE 3: Dados parcialmente válidos');
const partialDriverData = {
  id: 'driver_456',
  name: 'Maria Santos',
  phone: '+244 923 456 789',
  vehicleInfo: {}, // Veículo vazio mas nome e ID válidos
  rating: 4.5,
  estimatedArrival: '8 minutos'
};

const test3Result = isValidDriverData(partialDriverData);
console.log('✅ TESTE 3 RESULTADO:', test3Result ? 'ACEITO (correto)' : 'REJEITADO (erro)');

// TESTE 4: Apenas nome padrão (deve REJEITAR)
console.log('\n📝 TESTE 4: Apenas nome padrão');
const nameOnlyDefaultData = {
  id: 'driver_789',
  name: 'Motorista', // Nome padrão
  phone: '+244 934 567 890',
  vehicleInfo: {
    make: 'Honda',
    model: 'Civic'
  },
  rating: 4.2,
  estimatedArrival: '3 minutos'
};

const test4Result = isValidDriverData(nameOnlyDefaultData);
console.log('✅ TESTE 4 RESULTADO:', test4Result ? 'ACEITO (erro)' : 'REJEITADO (correto)');

// TESTE 5: Dados nulos (deve REJEITAR)
console.log('\n📝 TESTE 5: Dados nulos');
const test5Result = isValidDriverData(null);
console.log('✅ TESTE 5 RESULTADO:', test5Result ? 'ACEITO (erro)' : 'REJEITADO (correto)');

// TESTE 6: ID vazio mas nome válido (deve REJEITAR)
console.log('\n📝 TESTE 6: ID vazio mas nome válido');
const emptyIdData = {
  id: '',
  name: 'Carlos Lima',
  phone: '+244 945 678 901',
  vehicleInfo: {
    color: 'Azul'
  },
  rating: 4.0,
  estimatedArrival: '7 minutos'
};

const test6Result = isValidDriverData(emptyIdData);
console.log('✅ TESTE 6 RESULTADO:', test6Result ? 'ACEITO (erro)' : 'REJEITADO (correto)');

// RESUMO DOS TESTES
console.log('\n📊 RESUMO DOS TESTES:');
console.log('TESTE 1 (Dados válidos):', test1Result ? '✅ PASSOU' : '❌ FALHOU');
console.log('TESTE 2 (Dados padrão):', !test2Result ? '✅ PASSOU' : '❌ FALHOU');
console.log('TESTE 3 (Parcialmente válidos):', test3Result ? '✅ PASSOU' : '❌ FALHOU');
console.log('TESTE 4 (Nome padrão):', !test4Result ? '✅ PASSOU' : '❌ FALHOU');
console.log('TESTE 5 (Dados nulos):', !test5Result ? '✅ PASSOU' : '❌ FALHOU');
console.log('TESTE 6 (ID vazio):', !test6Result ? '✅ PASSOU' : '❌ FALHOU');

const allTestsPassed = test1Result && !test2Result && test3Result && !test4Result && !test5Result && !test6Result;
console.log('\n🎯 RESULTADO FINAL:', allTestsPassed ? '✅ TODOS OS TESTES PASSARAM' : '❌ ALGUNS TESTES FALHARAM');

if (allTestsPassed) {
  console.log('🎉 CORREÇÃO ESTÁ FUNCIONANDO CORRETAMENTE!');
  console.log('✅ Modal só aparecerá com dados válidos do motorista');
  console.log('✅ Dados padrão como "Motorista" serão rejeitados');
  console.log('✅ IDs vazios ou nulos serão rejeitados');
} else {
  console.log('⚠️ CORREÇÃO PRECISA DE AJUSTES');
}

console.log('\n💡 COMO USAR ESTE TESTE:');
console.log('1. Abra o React Native Debugger');
console.log('2. Cole este código no console');
console.log('3. Execute e verifique os resultados');
console.log('4. Todos os testes devem passar para confirmar que a correção funciona');

// Função para simular dados recebidos da API/Socket
window.testDriverData = (driverInfo) => {
  console.log('\n🧪 TESTE PERSONALIZADO:');
  const result = isValidDriverData(driverInfo);
  console.log('📊 Dados testados:', driverInfo);
  console.log('📋 Resultado:', result ? 'VÁLIDO (modal aparecerá)' : 'INVÁLIDO (modal NÃO aparecerá)');
  return result;
};

console.log('\n💡 USE window.testDriverData(seusDados) para testar dados customizados');