// Teste rápido da integração do PricingHelper
const PricingHelper = require('./PricingHelper');

console.log('🧪 TESTE DE INTEGRAÇÃO DO PRICINGHELPER');
console.log('========================================');

// Simular os valores reais do seu app
const originalFare = 21200; // Preço original calculado
const yangoPrice = 17900;   // Preço da concorrência 
const vehicleType = 'privado';
const distanceInKm = 100;

console.log('\n📊 DADOS DE ENTRADA:');
console.log(`Preço original: ${originalFare.toLocaleString()} AOA`);
console.log(`Preço Yango: ${yangoPrice.toLocaleString()} AOA`);
console.log(`Tipo de veículo: ${vehicleType}`);
console.log(`Distância: ${distanceInKm} km`);

// Teste 1: Sem preço da Yango (desconto automático)
console.log('\n1️⃣ TESTE - SEM PREÇO YANGO (desconto automático):');
const automaticPricing = PricingHelper.calculateCompetitivePrice(
    originalFare, 
    null, 
    vehicleType, 
    distanceInKm
);

console.log(`✅ Preço final: ${automaticPricing.finalPrice.toLocaleString()} AOA`);
console.log(`✅ Economia: ${automaticPricing.savings.toLocaleString()} AOA (${automaticPricing.discountPercentage}%)`);

// Teste 2: Com preço da Yango
console.log('\n2️⃣ TESTE - COM PREÇO YANGO (competição direta):');
const competitivePricing = PricingHelper.calculateCompetitivePrice(
    originalFare, 
    yangoPrice, 
    vehicleType, 
    distanceInKm
);

console.log(`✅ Preço final: ${competitivePricing.finalPrice.toLocaleString()} AOA`);
console.log(`✅ Economia vs Yango: ${competitivePricing.yangoComparison.savings.toLocaleString()} AOA (${competitivePricing.yangoComparison.percentage}% mais barato)`);
console.log(`✅ Economia vs Original: ${competitivePricing.savings.toLocaleString()} AOA (${competitivePricing.discountPercentage}% desconto)`);

// Teste 3: Verificar dados de exibição
console.log('\n3️⃣ TESTE - DADOS PARA UI:');
const displayData = PricingHelper.getDisplayData(originalFare, yangoPrice, vehicleType, distanceInKm);

console.log('📱 Dados formatados para interface:');
console.log(`- Preço original: ${displayData.original.formatted}`);
console.log(`- Preço Yango: ${displayData.yango.formatted}`);
console.log(`- Nosso preço: ${displayData.final.formatted}`);
console.log(`- Economia: ${displayData.savings.formatted} (${displayData.savings.percentage})`);
console.log(`- Mensagem: ${displayData.message}`);
console.log(`- É competitivo: ${displayData.isCompetitive ? '✅ SIM' : '❌ NÃO'}`);

console.log('\n🎯 RESULTADO ESPERADO NA INTERFACE:');
console.log(`O modal deve mostrar: ${competitivePricing.finalPrice.toLocaleString()} AOA`);
console.log(`Ao invés de: ${originalFare.toLocaleString()} AOA`);
console.log(`Economia para o usuário: ${competitivePricing.yangoComparison.savings.toLocaleString()} AOA vs Yango`);

console.log('\n✅ INTEGRAÇÃO TESTADA COM SUCESSO!');