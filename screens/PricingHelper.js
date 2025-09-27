// Helper para precificação competitiva - integração com HomeScreen
class PricingHelper {
  
  // Configurações de desconto competitivo
  static config = {
    // Desconto base para ser mais competitivo que Yango
    baseDiscount: 0.15, // 15% de desconto base
    
    // Descontos por faixa de preço (AOA) - ajustados para preços mais altos
    discountByRange: {
      short: { min: 0, max: 15000, discount: 0.10 },    // Até 15k: 10%
      medium: { min: 15000, max: 35000, discount: 0.15 }, // 15k-35k: 15% 
      long: { min: 35000, max: 70000, discount: 0.18 },   // 35k-70k: 18%
      verylong: { min: 70000, max: Infinity, discount: 0.20 } // >70k: 20%
    },
    
    // Multiplicadores por tipo de veículo para competitividade
    vehicleCompetitiveMultipliers: {
      'moto': 0.85,    // 15% mais barato
      'standard': 0.88, // 12% mais barato  
      'privado': 0.85,  // 15% mais barato (como no exemplo)
      'premium': 0.90,  // 10% mais barato
      'xl': 0.92       // 8% mais barato
    }
  };

  /**
   * Aplicar precificação competitiva ao preço original
   * @param {number} originalPrice - Preço calculado originalmente (21200)
   * @param {number} yangoPrice - Preço da Yango se conhecido (17900) 
   * @param {string} vehicleType - Tipo de veículo
   * @param {number} distance - Distância em km
   * @returns {object} Preço competitivo e detalhes
   */
  static calculateCompetitivePrice(originalPrice, yangoPrice = null, vehicleType = 'standard', distance = 0) {
    console.log('💰 [PRICING] Calculando preço competitivo...');
    console.log(`💰 [PRICING] Preço original: ${originalPrice} AOA`);
    console.log(`💰 [PRICING] Preço Yango: ${yangoPrice || 'não informado'} AOA`);
    console.log(`💰 [PRICING] Veículo: ${vehicleType}`);
    console.log(`💰 [PRICING] Distância: ${distance} km`);

    let finalPrice = originalPrice;
    let discountApplied = 0;
    let discountReason = '';
    let savings = 0;

    if (yangoPrice && yangoPrice > 0) {
      // Se temos preço da Yango, garantir que somos 10-15% mais baratos
      const targetDiscount = 0.12; // 12% mais barato que Yango
      finalPrice = Math.round(yangoPrice * (1 - targetDiscount));
      savings = yangoPrice - finalPrice;
      discountReason = `Preço competitivo vs Yango (${targetDiscount * 100}% mais barato)`;
      
      console.log(`💰 [PRICING] Aplicando desconto vs Yango: ${targetDiscount * 100}%`);
    } else {
      // Se não temos preço da Yango, usar nossa lógica de desconto
      
      // 1. Desconto por faixa de preço
      const range = this.getPriceRange(originalPrice);
      let discount = range.discount;
      
      // 2. Multiplicador por tipo de veículo
      const vehicleMultiplier = this.config.vehicleCompetitiveMultipliers[vehicleType] || 0.88;
      
      // 3. Aplicar desconto combinado
      finalPrice = Math.round(originalPrice * vehicleMultiplier);
      savings = originalPrice - finalPrice;
      discountApplied = 1 - (finalPrice / originalPrice);
      discountReason = `Preço competitivo (${(discountApplied * 100).toFixed(1)}% desconto)`;
      
      console.log(`💰 [PRICING] Faixa: ${range.name}, Desconto: ${range.discount * 100}%`);
      console.log(`💰 [PRICING] Multiplicador veículo: ${vehicleMultiplier}`);
    }

    const result = {
      originalPrice,
      finalPrice,
      savings,
      discountPercentage: ((savings / originalPrice) * 100).toFixed(1),
      yangoPrice,
      yangoComparison: yangoPrice ? {
        yangoPrice,
        ourPrice: finalPrice,
        savings: yangoPrice - finalPrice,
        percentage: (((yangoPrice - finalPrice) / yangoPrice) * 100).toFixed(1)
      } : null,
      vehicleType,
      distance,
      discountReason,
      isCompetitive: yangoPrice ? finalPrice < yangoPrice : savings > 0
    };

    console.log(`💰 [PRICING] Preço final: ${finalPrice} AOA`);
    console.log(`💰 [PRICING] Economia: ${savings} AOA (${result.discountPercentage}%)`);
    
    if (yangoPrice) {
      console.log(`💰 [PRICING] vs Yango: ${result.yangoComparison.savings} AOA mais barato (${result.yangoComparison.percentage}%)`);
    }

    return result;
  }

  /**
   * Determinar faixa de preço
   */
  static getPriceRange(price) {
    const ranges = this.config.discountByRange;
    
    if (price <= ranges.short.max) {
      return { name: 'short', ...ranges.short };
    } else if (price <= ranges.medium.max) {
      return { name: 'medium', ...ranges.medium };
    } else if (price <= ranges.long.max) {
      return { name: 'long', ...ranges.long };
    } else {
      return { name: 'verylong', ...ranges.verylong };
    }
  }

  /**
   * Formatar preço para exibição
   */
  static formatPrice(price) {
    return `${Math.round(price).toLocaleString()} AOA`;
  }

  /**
   * Gerar dados para interface comparativa
   */
  static getDisplayData(originalPrice, yangoPrice, vehicleType, distance) {
    const pricing = this.calculateCompetitivePrice(originalPrice, yangoPrice, vehicleType, distance);
    
    return {
      original: {
        price: pricing.originalPrice,
        formatted: this.formatPrice(pricing.originalPrice),
        label: 'Preço Original'
      },
      final: {
        price: pricing.finalPrice,
        formatted: this.formatPrice(pricing.finalPrice),
        label: 'Nosso Preço'
      },
      yango: yangoPrice ? {
        price: yangoPrice,
        formatted: this.formatPrice(yangoPrice),
        label: 'Preço Yango'
      } : null,
      savings: {
        amount: pricing.savings,
        formatted: this.formatPrice(pricing.savings),
        percentage: pricing.discountPercentage + '%'
      },
      comparison: pricing.yangoComparison,
      message: pricing.discountReason,
      isCompetitive: pricing.isCompetitive,
      showYangoComparison: !!yangoPrice
    };
  }

  /**
   * Exemplo de uso para o caso específico mencionado
   */
  static exampleUsage() {
    console.log('\n🎯 EXEMPLO REAL:');
    console.log('Distância: 100km, Seu app: 21.200 AOA, Yango: 17.900 AOA');
    console.log('─'.repeat(60));
    
    const result = this.calculateCompetitivePrice(21200, 17900, 'privado', 100);
    const display = this.getDisplayData(21200, 17900, 'privado', 100);
    
    console.log('📊 RESULTADO:');
    console.log(`• ${display.original.label}: ${display.original.formatted}`);
    console.log(`• ${display.yango.label}: ${display.yango.formatted}`);
    console.log(`• ${display.final.label}: ${display.final.formatted} ✅`);
    console.log(`• Economia vs Yango: ${display.comparison.savings} AOA (${display.comparison.percentage}% mais barato)`);
    console.log(`• ${display.message}`);
    
    return result;
  }
}

// Teste com valores reais
if (require.main === module) {
  console.log('🧪 TESTE COM VALORES REAIS DO SEU APP');
  console.log('====================================');
  console.log('Distância: 100km');
  console.log('Seu app (original): 21.200 AOA');  
  console.log('Yango: 17.900 AOA');
  console.log('');

  // Teste sem informar preço da Yango (desconto automático)
  console.log('1️⃣ SEM PREÇO DA YANGO (desconto automático):');
  const auto = PricingHelper.calculateCompetitivePrice(21200, null, 'privado', 100);
  console.log('Resultado:', auto.finalPrice, 'AOA');
  console.log('Economia:', auto.savings, 'AOA');
  console.log('');

  // Teste informando preço da Yango
  console.log('2️⃣ COM PREÇO DA YANGO (17.900 AOA):');
  const competitive = PricingHelper.calculateCompetitivePrice(21200, 17900, 'privado', 100);
  console.log('Resultado:', competitive.finalPrice, 'AOA');
  console.log('Economia vs original:', competitive.savings, 'AOA');
  console.log('Economia vs Yango:', competitive.yangoComparison.savings, 'AOA');
  console.log('% mais barato que Yango:', competitive.yangoComparison.percentage + '%');
  console.log('');

  console.log('✅ RESULTADO:');
  console.log(`• Preço original: 21.200 AOA`);
  console.log(`• Preço Yango: 17.900 AOA`);
  console.log(`• Nosso preço: ${competitive.finalPrice.toLocaleString()} AOA`);
  console.log(`• Economia: ${competitive.yangoComparison.savings.toLocaleString()} AOA (${competitive.yangoComparison.percentage}% mais barato)`);
}

module.exports = PricingHelper;
