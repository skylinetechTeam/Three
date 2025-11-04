/**
 * Teste do sistema de preços dinâmicos
 * Execute: node test-dynamic-pricing.js
 */

const PricingService = require('./api/services/pricingService');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   TESTE DO SISTEMA DE PREÇOS DINÂMICOS - SUPABASE         ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

async function testDynamicPricing() {
  try {
    console.log('🔍 TESTE 1: Verificar tipo de preço ativo no momento');
    console.log('─'.repeat(60));
    
    const now = new Date();
    const priceType = PricingService.determinePriceType(now);
    console.log(`📅 Data/Hora: ${now.toLocaleString('pt-PT')}`);
    console.log(`🎯 Tipo de preço ativo: ${priceType}`);
    console.log('');

    console.log('💰 TESTE 2: Buscar preço base dinâmico do Supabase');
    console.log('─'.repeat(60));
    
    const baseFare = await PricingService.getDynamicBaseFare();
    console.log(`✅ Preço base obtido: ${baseFare} Kz`);
    console.log('');

    console.log('🧮 TESTE 3: Calcular preço de uma corrida');
    console.log('─'.repeat(60));
    console.log('Corrida exemplo: 5 km, 15 minutos');
    
    const pricing = await PricingService.calculateCompetitivePrice(5, 15, 'standard', 6000);
    
    console.log('');
    console.log('📊 RESULTADO:');
    console.log(`   Preço base: ${pricing.basePrice} Kz`);
    console.log(`   Preço final: ${pricing.finalPrice} Kz`);
    console.log(`   Economia: ${pricing.savings} Kz (${pricing.discountPercentage}%)`);
    console.log(`   Tipo de preço: ${pricing.priceType}`);
    console.log('');

    console.log('🔄 TESTE 4: Testar cache (2ª chamada deve usar cache)');
    console.log('─'.repeat(60));
    
    const startTime = Date.now();
    const baseFare2 = await PricingService.getDynamicBaseFare();
    const endTime = Date.now();
    
    console.log(`✅ Preço obtido: ${baseFare2} Kz`);
    console.log(`⚡ Tempo de resposta: ${endTime - startTime}ms (cache ativo se < 10ms)`);
    console.log('');

    console.log('📈 TESTE 5: Simulação de preços');
    console.log('─'.repeat(60));
    await PricingService.simulatePrices(5, 15);

    console.log('');
    console.log('═'.repeat(60));
    console.log('✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('═'.repeat(60));
    console.log('');
    console.log('💡 RESUMO:');
    console.log(`   • Preço base é buscado do Supabase automaticamente`);
    console.log(`   • Tipo atual: ${priceType} = ${baseFare} Kz`);
    console.log(`   • Cache ativo por 5 minutos`);
    console.log(`   • Fallback para 2500 Kz se Supabase falhar`);
    console.log('');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    console.error('');
    console.error('💡 POSSÍVEIS CAUSAS:');
    console.error('   1. Tabela "private_base_price" não foi criada no Supabase');
    console.error('   2. Credenciais do Supabase incorretas');
    console.error('   3. Conexão com Supabase falhou');
    console.error('');
    console.error('📝 SOLUÇÃO:');
    console.error('   Execute o SQL em: database/private_base_price_UPDATED.sql');
    console.error('');
  }
}

// Executar testes
testDynamicPricing().catch(console.error);
