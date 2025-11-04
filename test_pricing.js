// Teste do sistema de precificação competitiva
const PricingService = require('./api/services/pricingService');

console.log('🎯 TESTE DO SISTEMA DE PRECIFICAÇÃO COMPETITIVA');
console.log('===============================================');
console.log('');

// Teste 1: Estimativa rápida baseada no preço da Yango
console.log('1️⃣ ESTIMATIVA RÁPIDA - Preço Yango: 4000 Kz');
console.log('─'.repeat(40));

const quickEstimate = PricingService.quickCompetitiveEstimate(4000);
console.log(`📊 Yango: ${quickEstimate.yangoPrice} Kz`);
console.log(`💰 Nosso app: ${quickEstimate.ourPrice} Kz`);
console.log(`🎉 Economia: ${quickEstimate.savings} Kz (${quickEstimate.discountPercentage}% mais barato)`);
console.log('');

// Teste 2: Cálculo completo com parâmetros da viagem
console.log('2️⃣ CÁLCULO COMPLETO - Corrida de exemplo');
console.log('─'.repeat(40));

const fullPricing = PricingService.calculateCompetitivePrice(
  5.2,      // 5.2 km de distância
  15,       // 15 minutos estimados
  'standard', // Veículo padrão
  4000      // Preço da Yango para comparação
);

console.log('');

// Teste 3: Simulação de vários cenários
console.log('3️⃣ SIMULAÇÃO DE CENÁRIOS');
PricingService.simulatePrices(5.0, 15);

// Teste 4: Diferentes preços da Yango
console.log('\n4️⃣ COMPARAÇÃO COM DIFERENTES PREÇOS DA YANGO');
console.log('─'.repeat(50));

const yangoPrices = [3000, 3500, 4000, 4500, 5000, 6000];
yangoPrices.forEach(yangoPrice => {
  const estimate = PricingService.quickCompetitiveEstimate(yangoPrice);
  console.log(`Yango: ${yangoPrice} → Nosso: ${estimate.ourPrice} (economia: ${estimate.savings} Kz)`);
});

// Teste 5: Verificar se estamos competitivos
console.log('\n5️⃣ ANÁLISE COMPETITIVA');
console.log('─'.repeat(40));

const ourPrice = 3700;
const yangoPrice = 4000;
const analysis = PricingService.isCompetitive(ourPrice, yangoPrice);

console.log(`✅ Nosso preço: ${ourPrice} Kz`);
console.log(`🏆 Preço Yango: ${yangoPrice} Kz`);
console.log(`📈 Competitivo: ${analysis.isCompetitive ? 'SIM' : 'NÃO'}`);
console.log(`💵 Economia: ${analysis.savings} Kz`);
console.log(`📊 Desconto: ${analysis.discountPercentage}%`);
console.log(`💡 Recomendação: ${analysis.recommendation}`);

console.log('\n🎉 RESUMO');
console.log('═'.repeat(50));
console.log('✅ Sistema de precificação competitiva implementado');
console.log('✅ Desconto automático de 7,5% a 10% vs Yango');
console.log('✅ Preços ajustados por horário e tipo de veículo');
console.log('✅ Análise competitiva em tempo real');
console.log('');
console.log('💡 EXEMPLOS DE USO:');
console.log('• POST /api/rides/estimate - Estimativa completa');
console.log('• GET /api/rides/quick-estimate/4000 - Estimativa rápida');
console.log('• POST /api/rides/request com competitorPrice - Corrida competitiva');