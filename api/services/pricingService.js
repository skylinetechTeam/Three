// Serviço de precificação competitiva
class PricingService {
  
  // Configurações de precificação
  static config = {
    // Desconto competitivo em relação à Yango (7,5% a 10%)
    competitiveDiscount: {
      min: 0.075, // 7,5%
      max: 0.10   // 10%
    },
    
    // Preço base por km (aumentado para privados)
    baseRatePerKm: 300, // Kwanzas por km (aumentado de 150)
    
    // Taxa base (taxa mínima da corrida - apenas para privados)
    baseFare: 2500, // Kwanzas (aumentado de 500)
    
    // Taxa por tempo (por minuto)
    timeRate: 50, // Kwanzas por minuto (aumentado de 25)
    
    // Multiplicadores por tipo de veículo
    vehicleMultipliers: {
      standard: 1.0,    // Preço normal
      premium: 1.3,     // 30% mais caro
      xl: 1.5           // 50% mais caro
    },
    
    // Multiplicadores por horário (surge pricing simplificado)
    timeMultipliers: {
      'peak_morning': 1.2,    // 07:00-09:00
      'peak_evening': 1.3,    // 17:00-19:00
      'late_night': 1.4,      // 22:00-06:00
      'weekend': 1.1,         // Fins de semana
      'normal': 1.0           // Horário normal
    }
  };

  // Calcular preço base sem desconto competitivo
  static calculateBasePrice(distance, estimatedTime, vehicleType = 'standard') {
    const config = this.config;
    
    // Preço base
    let price = config.baseFare;
    
    // Preço por distância
    price += distance * config.baseRatePerKm;
    
    // Preço por tempo
    price += estimatedTime * config.timeRate;
    
    // Multiplicador por tipo de veículo
    const vehicleMultiplier = config.vehicleMultipliers[vehicleType] || 1.0;
    price *= vehicleMultiplier;
    
    // Multiplicador por horário
    const timeMultiplier = this.getTimeMultiplier();
    price *= timeMultiplier;
    
    return Math.round(price);
  }

  // Obter multiplicador baseado no horário atual
  static getTimeMultiplier() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = domingo, 6 = sábado
    
    // Fins de semana (sexta noite, sábado e domingo)
    if (dayOfWeek === 0 || dayOfWeek === 6 || (dayOfWeek === 5 && hour >= 18)) {
      return this.config.timeMultipliers.weekend;
    }
    
    // Horários de pico
    if (hour >= 7 && hour <= 9) {
      return this.config.timeMultipliers.peak_morning;
    }
    
    if (hour >= 17 && hour <= 19) {
      return this.config.timeMultipliers.peak_evening;
    }
    
    // Madrugada
    if (hour >= 22 || hour <= 6) {
      return this.config.timeMultipliers.late_night;
    }
    
    // Horário normal
    return this.config.timeMultipliers.normal;
  }

  // Aplicar desconto competitivo (principal funcionalidade)
  static applyCompetitiveDiscount(basePrice, competitorPrice = null) {
    const config = this.config;
    
    if (competitorPrice) {
      // Se temos preço do concorrente, aplicar desconto específico
      const discount = Math.random() * (config.competitiveDiscount.max - config.competitiveDiscount.min) + config.competitiveDiscount.min;
      const ourPrice = Math.round(competitorPrice * (1 - discount));
      
      console.log(`💰 Preço competitivo: Yango ${competitorPrice} → Nosso ${ourPrice} (desconto: ${(discount * 100).toFixed(1)}%)`);
      
      return ourPrice;
    } else {
      // Se não temos preço do concorrente, aplicar desconto ao nosso preço base
      const discount = (config.competitiveDiscount.min + config.competitiveDiscount.max) / 2; // Média: 8.75%
      const discountedPrice = Math.round(basePrice * (1 - discount));
      
      console.log(`💰 Desconto competitivo aplicado: ${basePrice} → ${discountedPrice} (desconto: ${(discount * 100).toFixed(1)}%)`);
      
      return discountedPrice;
    }
  }

  // Função principal: calcular preço final competitivo
  static calculateCompetitivePrice(distance, estimatedTime, vehicleType = 'standard', yangoPrice = null) {
    console.log(`🧮 Calculando preço competitivo:`);
    console.log(`   📏 Distância: ${distance} km`);
    console.log(`   ⏱️  Tempo estimado: ${estimatedTime} min`);
    console.log(`   🚗 Tipo de veículo: ${vehicleType}`);
    console.log(`   🏆 Preço Yango: ${yangoPrice || 'não informado'}`);
    
    // Calcular preço base
    const basePrice = this.calculateBasePrice(distance, estimatedTime, vehicleType);
    console.log(`   💵 Preço base calculado: ${basePrice}`);
    
    // Aplicar desconto competitivo
    const finalPrice = this.applyCompetitiveDiscount(basePrice, yangoPrice);
    
    console.log(`   ✅ Preço final competitivo: ${finalPrice}`);
    
    return {
      basePrice,
      finalPrice,
      savings: yangoPrice ? (yangoPrice - finalPrice) : (basePrice - finalPrice),
      discountPercentage: yangoPrice 
        ? ((yangoPrice - finalPrice) / yangoPrice * 100).toFixed(1)
        : (((basePrice - finalPrice) / basePrice) * 100).toFixed(1),
      competitorPrice: yangoPrice,
      timeMultiplier: this.getTimeMultiplier(),
      vehicleType
    };
  }

  // Simular preços para comparação
  static simulatePrices(distance, estimatedTime) {
    console.log(`\n🎯 SIMULAÇÃO DE PREÇOS COMPETITIVOS`);
    console.log(`📊 Distância: ${distance}km | Tempo: ${estimatedTime}min`);
    console.log(`─`.repeat(50));
    
    const scenarios = [
      { yangoPrice: 4500, label: 'Corrida curta' },
      { yangoPrice: 6500, label: 'Corrida média' },
      { yangoPrice: 10000, label: 'Corrida longa' },
      { yangoPrice: 15000, label: 'Corrida premium' }
    ];
    
    scenarios.forEach(scenario => {
      const pricing = this.calculateCompetitivePrice(distance, estimatedTime, 'standard', scenario.yangoPrice);
      console.log(`\n${scenario.label}:`);
      console.log(`   Yango: ${scenario.yangoPrice} Kz`);
      console.log(`   Nosso: ${pricing.finalPrice} Kz`);
      console.log(`   Economia: ${pricing.savings} Kz (${pricing.discountPercentage}% mais barato)`);
    });
    
    console.log(`\n─`.repeat(50));
  }

  // Obter estimativa rápida baseada apenas no preço do concorrente
  static quickCompetitiveEstimate(yangoPrice) {
    const discount = (this.config.competitiveDiscount.min + this.config.competitiveDiscount.max) / 2;
    const ourPrice = Math.round(yangoPrice * (1 - discount));
    const savings = yangoPrice - ourPrice;
    
    return {
      yangoPrice,
      ourPrice,
      savings,
      discountPercentage: ((savings / yangoPrice) * 100).toFixed(1)
    };
  }

  // Configurar descontos personalizados
  static updateCompetitiveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ Configuração de preços atualizada:', this.config);
  }

  // Verificar se nosso preço está competitivo
  static isCompetitive(ourPrice, competitorPrice) {
    const savings = competitorPrice - ourPrice;
    const discountPercentage = (savings / competitorPrice) * 100;
    
    return {
      isCompetitive: ourPrice < competitorPrice,
      savings,
      discountPercentage: discountPercentage.toFixed(1),
      recommendation: discountPercentage < 5 ? 'Considerar maior desconto' : 'Preço competitivo'
    };
  }
}

module.exports = PricingService;