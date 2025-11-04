import { supabase } from '../supabaseClient';

/**
 * Serviço para gerenciar preços base do táxi privado
 * Busca os preços dinâmicos do Supabase baseado na data/hora
 */
const privateBasePriceService = {
  
  /**
   * Busca o preço base correto baseado na data/hora atual
   * @returns {Promise<number>} Preço base em Kz
   */
  async getCurrentBasePrice() {
    const now = new Date();
    const priceType = this.determinePriceType(now);
    
    try {
      const { data, error } = await supabase
        .from('private_base_price')
        .select('base_price')
        .eq('price_type', priceType)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching base price:', error);
        return this.getFallbackPrice();
      }

      return data.base_price;
    } catch (err) {
      console.error('Error in getCurrentBasePrice:', err);
      return this.getFallbackPrice();
    }
  },

  /**
   * Determina o tipo de preço baseado na data/hora
   * @param {Date} date Data para verificar
   * @returns {string} Tipo de preço
   */
  determinePriceType(date) {
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
  },

  /**
   * Busca todos os preços cadastrados
   * @returns {Promise<Array>} Lista de todos os preços
   */
  async getAllPrices() {
    try {
      const { data, error } = await supabase
        .from('private_base_price')
        .select('*')
        .order('price_type');

      if (error) {
        console.error('Error fetching all prices:', error);
        return [];
      }

      return data;
    } catch (err) {
      console.error('Error in getAllPrices:', err);
      return [];
    }
  },

  /**
   * Atualiza um preço específico
   * @param {string} priceType Tipo de preço a atualizar
   * @param {number} newPrice Novo preço base
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async updatePrice(priceType, newPrice) {
    try {
      const { error } = await supabase
        .from('private_base_price')
        .update({ base_price: newPrice })
        .eq('price_type', priceType);

      if (error) {
        console.error('Error updating price:', error);
        return false;
      }

      console.log(`✅ Price updated: ${priceType} = ${newPrice} Kz`);
      return true;
    } catch (err) {
      console.error('Error in updatePrice:', err);
      return false;
    }
  },

  /**
   * Busca um preço específico por tipo
   * @param {string} priceType Tipo de preço
   * @returns {Promise<number|null>} Preço base ou null se não encontrado
   */
  async getPriceByType(priceType) {
    try {
      const { data, error } = await supabase
        .from('private_base_price')
        .select('base_price')
        .eq('price_type', priceType)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error(`Error fetching price for ${priceType}:`, error);
        return null;
      }

      return data.base_price;
    } catch (err) {
      console.error('Error in getPriceByType:', err);
      return null;
    }
  },

  /**
   * Preço de fallback caso haja erro ao buscar do Supabase
   * @returns {number} Preço padrão
   */
  getFallbackPrice() {
    console.warn('⚠️ Using fallback price');
    return 500.00; // Preço padrão caso haja erro
  },

  /**
   * Verifica qual preço está ativo no momento (útil para debug)
   * @returns {Promise<Object>} Informações do preço atual
   */
  async getCurrentPriceInfo() {
    const now = new Date();
    const priceType = this.determinePriceType(now);
    const basePrice = await this.getCurrentBasePrice();

    return {
      currentDateTime: now.toISOString(),
      priceType,
      basePrice,
      description: this.getPriceTypeDescription(priceType)
    };
  },

  /**
   * Retorna descrição legível do tipo de preço
   * @param {string} priceType Tipo de preço
   * @returns {string} Descrição
   */
  getPriceTypeDescription(priceType) {
    const descriptions = {
      'normal': 'Preço normal',
      'peak_hours': 'Horário de pico',
      'end_of_month': 'Fim do mês',
      'end_of_year': 'Fim de ano',
      'weekend': 'Fim de semana',
      'night': 'Período noturno'
    };

    return descriptions[priceType] || 'Desconhecido';
  }
};

export default privateBasePriceService;
