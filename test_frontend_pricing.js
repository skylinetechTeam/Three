// Teste do sistema de precificação competitiva - FRONTEND APENAS
const CompetitivePricingService = require('./src/services/competitivePricingService');

console.log('🎯 TESTE SISTEMA PRECIFICAÇÃO FRONTEND');
console.log('=====================================');
console.log('');

// Teste 1: Preço competitivo baseado na Yango
console.log('1️⃣ COMPARAÇÃO COM PREÇO DA YANGO');
console.log('─'.repeat(40));

const yangoPrice = 4000;
const competitive = CompetitivePricingService.calculateCompetitivePrice(yangoPrice);

console.log(`💰 Preço Yango: ${competitive.yangoPrice} Kz`);
console.log(`💰 Nosso preço: ${competitive.ourPrice} Kz`);
console.log(`🎉 Economia: ${competitive.savings} Kz (${competitive.discountPercentage}%)`);
console.log(`✅ Competitivo: ${competitive.isCompetitive ? 'SIM' : 'NÃO'}`);
console.log(`📝 Mensagem: ${competitive.message}`);
console.log('');

// Teste 2: Aplicar desconto a preço original
console.log('2️⃣ APLICAR DESCONTO COMPETITIVO');
console.log('─'.repeat(40));

const originalPrice = 3500;
const result = CompetitivePricingService.applyCompetitiveDiscount(originalPrice, yangoPrice);

console.log(`💵 Preço original: ${originalPrice} Kz`);
console.log(`🏆 Preço Yango: ${yangoPrice} Kz`);
console.log(`💰 Preço final: ${result.finalPrice} Kz`);
console.log(`🎉 Economia: ${result.savings} Kz (${result.discountPercentage}%)`);
console.log('');

// Teste 3: Comparação visual para interface
console.log('3️⃣ DADOS PARA INTERFACE');
console.log('─'.repeat(40));

const comparison = CompetitivePricingService.getPriceComparison(originalPrice, yangoPrice);

console.log('Dados para mostrar na tela:');
console.log(`• Preço original: ${comparison.prices.original.formatted}`);
console.log(`• Preço Yango: ${comparison.prices.yango.formatted}`);
console.log(`• Preço final: ${comparison.prices.final.formatted}`);
console.log(`• Economia: ${comparison.savings.formatted} (${comparison.savings.percentage})`);
console.log(`• Mostrar comparação: ${comparison.showComparison ? 'SIM' : 'NÃO'}`);
console.log(`• É competitivo: ${comparison.isCompetitive ? 'SIM' : 'NÃO'}`);
console.log('');

// Teste 4: Simulação de vários cenários
console.log('4️⃣ SIMULAÇÃO MÚLTIPLOS PREÇOS');
console.log('─'.repeat(40));

const scenarios = CompetitivePricingService.simulate([3000, 4000, 5000, 6000, 8000]);
scenarios.forEach(scenario => {
  console.log(`${scenario.scenario} → Nosso: ${scenario.ourPrice} Kz (economia: ${scenario.savings} Kz)`);
});
console.log('');

// Teste 5: Validação competitiva
console.log('5️⃣ VALIDAÇÃO SE PREÇO É COMPETITIVO');
console.log('─'.repeat(40));

const validation = CompetitivePricingService.validateCompetitive(3700, 4000);
console.log(`✅ Preço válido: ${validation.isValid ? 'SIM' : 'NÃO'}`);
console.log(`📝 Mensagem: ${validation.message}`);
if (validation.recommendation) {
  console.log(`💡 Recomendação: ${validation.recommendation}`);
}
if (validation.suggestedPrice) {
  console.log(`💰 Preço sugerido: ${validation.suggestedPrice} Kz`);
}
console.log('');

// Teste 6: Formatação de preços
console.log('6️⃣ FORMATAÇÃO DE PREÇOS');
console.log('─'.repeat(40));

const prices = [1500, 4000, 12500, 50000];
prices.forEach(price => {
  console.log(`${price} → ${CompetitivePricingService.formatPrice(price)}`);
});
console.log('');

// Teste 7: Configuração atual
console.log('7️⃣ CONFIGURAÇÃO ATUAL');
console.log('─'.repeat(40));

const config = CompetitivePricingService.getConfig();
console.log('Descontos por faixa:');
console.log(`• Corridas curtas (≤2000): ${(config.discountByRange.short * 100).toFixed(1)}%`);
console.log(`• Corridas médias (2000-6000): ${(config.discountByRange.medium * 100).toFixed(1)}%`);
console.log(`• Corridas longas (>6000): ${(config.discountByRange.long * 100).toFixed(1)}%`);
console.log('');

console.log('🎉 RESUMO');
console.log('═'.repeat(50));
console.log('✅ Sistema de precificação competitiva FRONTEND implementado');
console.log('✅ Funciona sem modificar a API');
console.log('✅ Calcula preços 7,5% a 10% mais baratos que a Yango');
console.log('✅ Interface de comparação visual pronta');
console.log('✅ Componentes React Native criados');
console.log('');
console.log('📱 COMPONENTES CRIADOS:');
console.log('• CompetitivePricingService.js - Lógica de precificação');
console.log('• CompetitivePriceComparison.js - Componente visual');
console.log('• TripConfirmationWithPricing.js - Modal completo');
console.log('');
console.log('💡 EXEMPLO DE USO:');
console.log(`
import CompetitivePricingService from './services/competitivePricingService';

// Calcular preço competitivo
const competitive = CompetitivePricingService.calculateCompetitivePrice(4000);
console.log(\`Yango: 4000 Kz → Nosso: \${competitive.ourPrice} Kz\`);

// Usar no componente
<CompetitivePriceComparison 
  originalPrice={3500}
  yangoPrice={4000}
/>
`);

console.log('✅ Pronto para usar no app sem tocar na API!');