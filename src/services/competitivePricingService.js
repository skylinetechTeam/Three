// Serviço de precificação competitiva - FRONTEND APENAS
class CompetitivePricingService {
  
  // Configurações de precificação competitiva
  static config = {
    // Desconto competitivo em relação à Yango (7,5% a 10%)
    competitiveDiscount: {
      min: 0.075, // 7,5%
      max: 0.10   // 10%
    },
    
    // Configurações para diferentes cenários - ajustados para preços mais altos
    discountByRange: {
      // Corridas curtas (até 3000 Kz)
      short: 0.075, // 7,5%
      // Corridas médias (3000-8000 Kz) 
      medium: 0.0875, // 8,75%
      // Corridas longas (acima de 8000 Kz)
      long: 0.095 // 9,5%
    }
  };

  /**
   * Calcular preço competitivo baseado no preço da Yango
   * @param {number} yangoPrice - Preço que a Yango está cobrando
   * @param {string} rangeType - 'short', 'medium', 'long' ou null para automático
   * @returns {object} Objeto com preços e economia
   */
  static calculateCompetitivePrice(yangoPrice, rangeType = null) {
    if (!yangoPrice || yangoPrice <= 0) {
      throw new Error('Preço da Yango deve ser um número positivo');
    }

    // Determinar tipo de corrida automaticamente se não especificado - ajustado para preços mais altos
    if (!rangeType) {
      if (yangoPrice <= 3000) {
        rangeType = 'short';
      } else if (yangoPrice <= 8000) {
        rangeType = 'medium';
      } else {
        rangeType = 'long';
      }
    }

    // Obter desconto baseado no tipo
    const discount = this.config.discountByRange[rangeType] || this.config.discountByRange.medium;
    
    // Calcular nosso preço
    const ourPrice = Math.round(yangoPrice * (1 - discount));
    const savings = yangoPrice - ourPrice;
    const discountPercentage = (discount * 100).toFixed(1);

    return {
      yangoPrice,
      ourPrice,
      savings,
      discountPercentage: parseFloat(discountPercentage),
      rangeType,
      isCompetitive: ourPrice < yangoPrice,
      message: `Você economiza ${savings} Kz (${discountPercentage}% mais barato que a Yango)`
    };
  }

  /**
   * Aplicar desconto competitivo a um preço original
   * @param {number} originalPrice - Preço original calculado pelo app
   * @param {number} yangoPrice - Preço de referência da Yango
   * @returns {object} Preço ajustado e detalhes
   */
  static applyCompetitiveDiscount(originalPrice, yangoPrice) {
    if (!yangoPrice) {
      // Se não temos preço da Yango, aplicar desconto padrão ao nosso preço
      const discount = (this.config.competitiveDiscount.min + this.config.competitiveDiscount.max) / 2;
      const discountedPrice = Math.round(originalPrice * (1 - discount));
      
      return {
        originalPrice,
        finalPrice: discountedPrice,
        savings: originalPrice - discountedPrice,
        discountPercentage: (discount * 100).toFixed(1),
        competitive: null,
        message: `Preço competitivo aplicado (${(discount * 100).toFixed(1)}% de desconto)`
      };
    }

    // Calcular preço competitivo baseado na Yango
    const competitive = this.calculateCompetitivePrice(yangoPrice);
    
    // Usar o menor entre nosso preço original e o preço competitivo
    const finalPrice = Math.min(originalPrice, competitive.ourPrice);
    
    return {
      originalPrice,
      finalPrice,
      savings: Math.max(originalPrice - finalPrice, competitive.savings),
      discountPercentage: competitive.discountPercentage,
      competitive,
      yangoComparison: {
        yangoPrice,
        ourPrice: competitive.ourPrice,
        savings: competitive.savings
      },
      message: competitive.message
    };
  }

  /**
   * Formatar preço para exibição
   * @param {number} price - Preço em Kwanzas
   * @returns {string} Preço formatado
   */
  static formatPrice(price) {
    return `${price.toLocaleString()} Kz`;
  }

  /**
   * Gerar comparação visual para mostrar na interface
   * @param {number} originalPrice - Nosso preço original
   * @param {number} yangoPrice - Preço da Yango
   * @returns {object} Dados para interface
   */
  static getPriceComparison(originalPrice, yangoPrice) {
    const result = this.applyCompetitiveDiscount(originalPrice, yangoPrice);
    
    return {
      prices: {
        original: {
          value: originalPrice,
          formatted: this.formatPrice(originalPrice),
          label: 'Preço Original'
        },
        yango: {
          value: yangoPrice,
          formatted: this.formatPrice(yangoPrice),
          label: 'Preço Yango'
        },
        final: {
          value: result.finalPrice,
          formatted: this.formatPrice(result.finalPrice),
          label: 'Nosso Preço Final'
        }
      },
      savings: {
        amount: result.savings,
        formatted: this.formatPrice(result.savings),
        percentage: result.discountPercentage + '%'
      },
      competitive: result.competitive,
      message: result.message,
      showComparison: !!yangoPrice,
      isCompetitive: yangoPrice ? result.finalPrice < yangoPrice : false
    };
  }

  /**
   * Validar se nosso preço está competitivo
   * @param {number} ourPrice - Nosso preço
   * @param {number} yangoPrice - Preço da Yango
   * @returns {object} Status competitivo
   */
  static validateCompetitive(ourPrice, yangoPrice) {
    if (!yangoPrice) {
      return {
        isValid: true,
        message: 'Preço padrão aplicado',
        recommendation: null
      };
    }

    const savings = yangoPrice - ourPrice;
    const discountPercentage = (savings / yangoPrice) * 100;

    if (ourPrice >= yangoPrice) {
      return {
        isValid: false,
        message: 'Preço não está competitivo',
        recommendation: 'Aplicar desconto maior',
        suggestedPrice: this.calculateCompetitivePrice(yangoPrice).ourPrice
      };
    }

    if (discountPercentage < 5) {
      return {
        isValid: true,
        message: 'Preço competitivo mas pode melhorar',
        recommendation: 'Considerar desconto maior',
        suggestedPrice: this.calculateCompetitivePrice(yangoPrice).ourPrice
      };
    }

    return {
      isValid: true,
      message: 'Preço altamente competitivo',
      recommendation: null
    };
  }

  /**
   * Simular diferentes cenários de preços
   * @param {array} yangoPrices - Array de preços da Yango para testar
   * @returns {array} Resultados da simulação
   */
  static simulate(yangoPrices = [3000, 4000, 5000, 6000]) {
    return yangoPrices.map(yangoPrice => ({
      scenario: `Yango: ${yangoPrice} Kz`,
      ...this.calculateCompetitivePrice(yangoPrice)
    }));
  }

  /**
   * Obter configuração atual
   */
  static getConfig() {
    return { ...this.config };
  }

  /**
   * Atualizar configurações
   * @param {object} newConfig - Novas configurações
   */
  static updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

export default CompetitivePricingService;