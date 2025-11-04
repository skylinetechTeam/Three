// Serviço de precificação competitiva
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = "https://fplfizngqozlnxkzevyg.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbGZpem5ncW96bG54a3pldnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzE3NTYsImV4cCI6MjA2ODk0Nzc1Nn0.jTkKTHIrk8mmmU-gUTrs_gPkyC5D-xsZWTO363yGbfE";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

class PricingService {
  
  // Configurações de precificação (exceto baseFare que vem do Supabase)
  static config = {
    // Desconto competitivo em relação à Yango (7,5% a 10%)
    competitiveDiscount: {
      min: 0.075, // 7,5%
      max: 0.10   // 10%
    },
    
    // Preço base por km (aumentado para privados)
    baseRatePerKm: 300, // Kwanzas por km (aumentado de 150)
    
    // Taxa base (taxa mínima da corrida - AGORA DINÂMICO DO SUPABASE)
    baseFare: 2500, // Kwanzas - FALLBACK se Supabase falhar
    
    // Taxa por tempo (por minuto)
    timeRate: 50, // Kwanzas por minuto (aumentado de 25)
    
    // Multiplicadores por tipo de veículo
    vehicleMultipliers: {
      standard: 1.0,    // Preço normal
      premium: 1.3,     // 30% mais caro
      xl: 1.5           // 50% mais caro
    },
    
    // Desconto global aplicado sobre o preço total (pós-todos os cálculos)
    totalPriceDiscount: 0.10
  };

  // Cache do preço base (atualizado a cada 5 minutos)
  static baseFareCache = {
    value: 2500,
    lastUpdate: 0,
    ttl: 5 * 60 * 1000 // 5 minutos em millisegundos
  };

  // Buscar preço base dinâmico do Supabase
  static async getDynamicBaseFare() {
    const now = Date.now();
    
    // Verificar se o cache ainda é válido
    if (now - this.baseFareCache.lastUpdate < this.baseFareCache.ttl) {
      return this.baseFareCache.value;
    }

    try {
      // Determinar tipo de preço baseado na data/hora atual
      const priceType = this.determinePriceType(new Date());
      
      // Buscar do Supabase
      const { data, error } = await supabase
        .from('private_base_price')
        .select('base_price')
        .eq('price_type', priceType)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.warn('⚠️ Error fetching base price from Supabase, using fallback:', error?.message);
        return this.config.baseFare; // Fallback
      }

      // Atualizar cache
      this.baseFareCache.value = parseFloat(data.base_price);
      this.baseFareCache.lastUpdate = now;
      
      console.log(`✅ Base fare loaded from Supabase: ${this.baseFareCache.value} Kz (${priceType})`);
      return this.baseFareCache.value;
    } catch (err) {
      console.error('❌ Error in getDynamicBaseFare:', err);
      return this.config.baseFare; // Fallback
    }
  }

  // Determinar tipo de preço baseado na data/hora
  static determinePriceType(date) {
    const hour = date.getHours();
    const day = date.getDay();
    const dayOfMonth = date.getDate();
    const month = date.getMonth();
    const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate();

    // Prioridade 1: Fim de ano (todo mês de dezembro)
    if (month === 11) {
      return 'end_of_year';
    }

    // Prioridade 2: Fim de mês (últimos 5 dias)
    if (dayOfMonth > daysInMonth - 5) {
      return 'end_of_month';
    }

    // Prioridade 3: Período noturno (22h às 6h)
    if (hour >= 22 || hour < 6) {
      return 'night';
    }

    // Prioridade 4: Horas de pico (7h-9h e 17h-19h)
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) {
      return 'peak_hours';
    }

    // Prioridade 5: Fins de semana (sábado=6, domingo=0)
    if (day === 0 || day === 6) {
      return 'weekend';
    }

    // Padrão: preço normal
    return 'normal';
  }

  // Calcular preço base sem desconto competitivo
  static async calculateBasePrice(distance, estimatedTime, vehicleType = 'standard') {
    const config = this.config;
    
    // Preço base DINÂMICO do Supabase
    const baseFare = await this.getDynamicBaseFare();
    let price = baseFare;
    
    // Preço por distância
    price += distance * config.baseRatePerKm;
    
    // Preço por tempo
    price += estimatedTime * config.timeRate;
    
    // Multiplicador por tipo de veículo
    const vehicleMultiplier = config.vehicleMultipliers[vehicleType] || 1.0;
    price *= vehicleMultiplier;
    
    return Math.round(price);
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
  static async calculateCompetitivePrice(distance, estimatedTime, vehicleType = 'standard', yangoPrice = null) {
    console.log(`🧭 Calculando preço competitivo:`);
    console.log(`   📏 Distância: ${distance} km`);
    console.log(`   ⏱️  Tempo estimado: ${estimatedTime} min`);
    console.log(`   🚗 Tipo de veículo: ${vehicleType}`);
    console.log(`   🏆 Preço Yango: ${yangoPrice || 'não informado'}`);
    
    // Calcular preço base (agora é async)
    const basePrice = await this.calculateBasePrice(distance, estimatedTime, vehicleType);
    console.log(`   💵 Preço base calculado: ${basePrice}`);
    
    // Aplicar desconto competitivo
    const finalPrice = this.applyCompetitiveDiscount(basePrice, yangoPrice);

    // Aplicar desconto global de 10% sobre o preço total
    const totalDiscount = this.config.totalPriceDiscount || 0;
    const discountedFinalPrice = Math.round(finalPrice * (1 - totalDiscount));
    if (totalDiscount > 0) {
      console.log(`   🔻 Desconto total aplicado (${(totalDiscount * 100).toFixed(0)}%): ${finalPrice} → ${discountedFinalPrice}`);
    }
    
    console.log(`   ✅ Preço final competitivo: ${discountedFinalPrice}`);
    
    // Buscar tipo de preço ativo
    const priceType = this.determinePriceType(new Date());
    
    return {
      basePrice,
      finalPrice: discountedFinalPrice,
      savings: yangoPrice ? (yangoPrice - discountedFinalPrice) : (basePrice - discountedFinalPrice),
      discountPercentage: yangoPrice 
        ? ((yangoPrice - discountedFinalPrice) / yangoPrice * 100).toFixed(1)
        : (((basePrice - discountedFinalPrice) / basePrice) * 100).toFixed(1),
      competitorPrice: yangoPrice,
      priceType: priceType,
      vehicleType
    };
  }

  // Simular preços para comparação
  static async simulatePrices(distance, estimatedTime) {
    console.log(`\n🎯 SIMULAÇÃO DE PREÇOS COMPETITIVOS`);
    console.log(`📊 Distância: ${distance}km | Tempo: ${estimatedTime}min`);
    console.log(`─`.repeat(50));
    
    const scenarios = [
      { yangoPrice: 4500, label: 'Corrida curta' },
      { yangoPrice: 6500, label: 'Corrida média' },
      { yangoPrice: 10000, label: 'Corrida longa' },
      { yangoPrice: 15000, label: 'Corrida premium' }
    ];
    
    for (const scenario of scenarios) {
      const pricing = await this.calculateCompetitivePrice(distance, estimatedTime, 'standard', scenario.yangoPrice);
      console.log(`\n${scenario.label}:`);
      console.log(`   Yango: ${scenario.yangoPrice} Kz`);
      console.log(`   Nosso: ${pricing.finalPrice} Kz`);
      console.log(`   Economia: ${pricing.savings} Kz (${pricing.discountPercentage}% mais barato)`);
    }
    
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