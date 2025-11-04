/**
 * Script de teste para verificar se o preço está sendo buscado corretamente do Supabase
 * Execute com: node test_supabase_pricing.js
 */

const apiService = require('./services/apiService');

async function testSupabasePricing() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTE: Integração de Preços com Supabase');
  console.log('🧪 ========================================\n');

  try {
    // Teste 1: Verificar cálculo de preço para corrida privada
    console.log('📝 Teste 1: Corrida Privada de 10km em 20 minutos');
    console.log('─'.repeat(50));
    
    const fare1 = await apiService.default.calculateEstimatedFareAsync(10, 20, 'privado');
    console.log(`✅ Resultado: ${fare1} AOA\n`);

    // Teste 2: Verificar cálculo de preço para corrida privada longa
    console.log('📝 Teste 2: Corrida Privada de 50km em 60 minutos');
    console.log('─'.repeat(50));
    
    const fare2 = await apiService.default.calculateEstimatedFareAsync(50, 60, 'privado');
    console.log(`✅ Resultado: ${fare2} AOA\n`);

    // Teste 3: Verificar cálculo de preço para coletivo
    console.log('📝 Teste 3: Corrida Coletiva');
    console.log('─'.repeat(50));
    
    const fare3 = await apiService.default.calculateEstimatedFareAsync(10, 20, 'coletivo');
    console.log(`✅ Resultado: ${fare3} AOA\n`);

    // Teste 4: Buscar preço base diretamente do Supabase
    console.log('📝 Teste 4: Preço Base Atual do Supabase');
    console.log('─'.repeat(50));
    
    const privateBasePriceService = require('./services/privateBasePriceService').default;
    const priceInfo = await privateBasePriceService.getCurrentPriceInfo();
    
    console.log('📊 Informações do Preço Atual:');
    console.log(`  • Data/Hora: ${priceInfo.currentDateTime}`);
    console.log(`  • Tipo: ${priceInfo.priceType}`);
    console.log(`  • Descrição: ${priceInfo.description}`);
    console.log(`  • Preço Base: ${priceInfo.basePrice} AOA\n`);

    // Teste 5: Comparar método antigo vs novo
    console.log('📝 Teste 5: Comparação Método Antigo vs Novo');
    console.log('─'.repeat(50));
    
    const oldFare = apiService.default.calculateEstimatedFare(10, 20, 'privado');
    const newFare = await apiService.default.calculateEstimatedFareAsync(10, 20, 'privado');
    
    console.log(`  • Método Antigo (fixo): ${oldFare} AOA`);
    console.log(`  • Método Novo (Supabase): ${newFare} AOA`);
    console.log(`  • Diferença: ${newFare - oldFare} AOA\n`);

    console.log('🎉 ========================================');
    console.log('🎉 TODOS OS TESTES CONCLUÍDOS!');
    console.log('🎉 ========================================');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar testes
testSupabasePricing();
