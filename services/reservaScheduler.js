import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

const CHECK_INTERVAL = 60000; // Verificar a cada 1 minuto

class ReservaScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.onReservaActivated = null; // Callback para quando uma reserva for ativada
  }

  /**
   * Inicia o scheduler
   * @param {Function} onReservaActivated - Callback executado quando uma reserva é ativada
   */
  async start(onReservaActivated = null) {
    if (this.isRunning) {
      console.log('📅 [SCHEDULER] Já está executando');
      return;
    }

    console.log('🚀 [SCHEDULER] Iniciando scheduler de reservas...');
    this.onReservaActivated = onReservaActivated;
    this.isRunning = true;

    // Iniciar verificação periódica (apenas quando app estiver em uso)
    this.intervalId = setInterval(async () => {
      await this.checkReservas();
    }, CHECK_INTERVAL);

    // Verificação inicial
    await this.checkReservas();
    console.log('✅ [SCHEDULER] Scheduler iniciado com sucesso');
  }

  /**
   * Para o scheduler
   */
  stop() {
    if (!this.isRunning) return;

    console.log('🛑 [SCHEDULER] Parando scheduler...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('✅ [SCHEDULER] Scheduler parado');
  }



  /**
   * Verifica se existem reservas para serem executadas
   */
  async checkReservas() {
    try {
      console.log('🔍 [SCHEDULER] Verificando reservas agendadas...');
      
      const reservasData = await AsyncStorage.getItem('ride_requests');
      if (!reservasData) {
        console.log('📝 [SCHEDULER] Nenhuma reserva encontrada');
        return;
      }

      const reservas = JSON.parse(reservasData);
      const reservasPendentes = reservas.filter(reserva => 
        reserva.status === 'Pendente' || reserva.status === 'Confirmada'
      );

      if (reservasPendentes.length === 0) {
        console.log('📝 [SCHEDULER] Nenhuma reserva pendente/confirmada encontrada');
        return;
      }

      console.log(`📅 [SCHEDULER] Encontradas ${reservasPendentes.length} reservas para verificar`);

      const now = new Date();
      let reservasAtivadas = 0;

      for (const reserva of reservasPendentes) {
        const shouldActivate = await this.shouldActivateReserva(reserva, now);
        if (shouldActivate) {
          await this.activateReserva(reserva);
          reservasAtivadas++;
        }
      }

      if (reservasAtivadas > 0) {
        console.log(`✅ [SCHEDULER] ${reservasAtivadas} reserva(s) ativada(s)`);
      }

    } catch (error) {
      console.error('❌ [SCHEDULER] Erro ao verificar reservas:', error);
    }
  }

  /**
   * Verifica se uma reserva deve ser ativada
   * @param {Object} reserva - Dados da reserva
   * @param {Date} now - Data atual
   * @returns {boolean} - true se deve ser ativada
   */
  async shouldActivateReserva(reserva, now) {
    try {
      // Construir a data/hora da reserva
      const [day, month, year] = reserva.data.split('/');
      const [hour, minute] = reserva.hora.split(':');
      
      const reservaDateTime = new Date(
        parseInt(year),
        parseInt(month) - 1, // Mês é 0-indexado
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        0
      );

      // Calcular diferença em minutos
      const diffMinutes = (reservaDateTime.getTime() - now.getTime()) / (1000 * 60);

      // Log detalhado para debug
      console.log(`🕐 [SCHEDULER] Reserva ${reserva.id}:`);
      console.log(`   Agendada para: ${reservaDateTime.toLocaleString('pt-BR')}`);
      console.log(`   Agora é: ${now.toLocaleString('pt-BR')}`);
      console.log(`   Diferença: ${diffMinutes.toFixed(1)} minutos`);

      // Ativar se estiver dentro da janela de execução (-2 a +5 minutos)
      const shouldActivate = diffMinutes >= -2 && diffMinutes <= 5;
      
      if (shouldActivate) {
        console.log(`⏰ [SCHEDULER] Reserva ${reserva.id} deve ser ativada agora!`);
      }

      return shouldActivate;

    } catch (error) {
      console.error(`❌ [SCHEDULER] Erro ao processar reserva ${reserva.id}:`, error);
      return false;
    }
  }

  /**
   * Ativa uma reserva (envia request para motoristas)
   * @param {Object} reserva - Dados da reserva
   */
  async activateReserva(reserva) {
    try {
      console.log(`🚗 [SCHEDULER] Ativando reserva ${reserva.id}...`);

      // 1. Atualizar status da reserva para "Em Andamento"
      await this.updateReservaStatus(reserva.id, 'Em Andamento');

      // 2. Mostrar alerta para o usuário
      this.showReservaAlert(reserva);

      // 3. Simular envio de request para motorista (sem mexer na API)
      await this.simulateDriverRequest(reserva);

      // 4. Chamar callback se fornecido
      if (this.onReservaActivated) {
        this.onReservaActivated(reserva);
      }

      console.log(`✅ [SCHEDULER] Reserva ${reserva.id} ativada com sucesso`);

    } catch (error) {
      console.error(`❌ [SCHEDULER] Erro ao ativar reserva ${reserva.id}:`, error);
    }
  }

  /**
   * Atualiza o status de uma reserva no AsyncStorage
   * @param {string} reservaId - ID da reserva
   * @param {string} newStatus - Novo status
   */
  async updateReservaStatus(reservaId, newStatus) {
    try {
      const reservasData = await AsyncStorage.getItem('ride_requests');
      if (!reservasData) return;

      const reservas = JSON.parse(reservasData);
      const updatedReservas = reservas.map(reserva => 
        reserva.id === reservaId 
          ? { ...reserva, status: newStatus, activatedAt: new Date().toISOString() }
          : reserva
      );

      await AsyncStorage.setItem('ride_requests', JSON.stringify(updatedReservas));
      console.log(`📝 [SCHEDULER] Status da reserva ${reservaId} atualizado para: ${newStatus}`);

    } catch (error) {
      console.error(`❌ [SCHEDULER] Erro ao atualizar status da reserva ${reservaId}:`, error);
    }
  }

  /**
   * Mostra alerta nativo para o usuário
   * @param {Object} reserva - Dados da reserva
   */
  showReservaAlert(reserva) {
    try {
      Alert.alert(
        '🚕 Sua reserva foi ativada!',
        `Um motorista está sendo solicitado para sua corrida de ${reserva.origem} para ${reserva.destino}`,
        [
          { text: 'OK', style: 'default' }
        ],
        { cancelable: true }
      );

      console.log(`📱 [SCHEDULER] Alerta mostrado para reserva ${reserva.id}`);
    } catch (error) {
      console.error(`❌ [SCHEDULER] Erro ao mostrar alerta para reserva ${reserva.id}:`, error);
    }
  }

  /**
   * Simula o envio de request para um motorista
   * @param {Object} reserva - Dados da reserva
   */
  async simulateDriverRequest(reserva) {
    try {
      // Simular dados de request para motorista (formato similar ao da API)
      const driverRequest = {
        rideId: `scheduled_${reserva.id}`,
        passengerId: `passenger_${Date.now()}`,
        passengerName: 'Usuário da Reserva',
        pickup: {
          address: reserva.origem,
          lat: reserva.origemLat || -8.8390,
          lng: reserva.origemLng || 13.2894
        },
        destination: {
          address: reserva.destino,
          lat: reserva.destinoLat || -8.8450,
          lng: reserva.destinoLng || 13.2950
        },
        estimatedFare: reserva.preco || 1000,
        estimatedDistance: 5.0,
        estimatedTime: 15,
        rideType: reserva.tipoTaxi,
        scheduledTime: reserva.data + ' ' + reserva.hora,
        isScheduled: true,
        originalReservaId: reserva.id,
        observacoes: reserva.observacoes || ''
      };

      // Log do request simulado
      console.log('📤 [SCHEDULER] Request simulado para motorista:');
      console.log('   Origem:', driverRequest.pickup.address);
      console.log('   Destino:', driverRequest.destination.address);
      console.log('   Preço estimado:', `${driverRequest.estimatedFare} Kz`);
      console.log('   Tipo:', driverRequest.rideType);
      console.log('   Horário original:', driverRequest.scheduledTime);

      // Aqui você poderia integrar com um sistema de notificações push
      // para motoristas ou com qualquer outro sistema externo
      // Por exemplo: Firebase Cloud Messaging, OneSignal, etc.

      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log de sucesso
      console.log(`🎯 [SCHEDULER] Request enviado com sucesso para motoristas (reserva ${reserva.id})`);

      return driverRequest;

    } catch (error) {
      console.error(`❌ [SCHEDULER] Erro ao simular driver request para reserva ${reserva.id}:`, error);
    }
  }

  /**
   * Obtém estatísticas do scheduler
   * @returns {Object} - Estatísticas
   */
  async getStats() {
    try {
      const reservasData = await AsyncStorage.getItem('ride_requests');
      if (!reservasData) {
        return {
          total: 0,
          pendentes: 0,
          confirmadas: 0,
          emAndamento: 0,
          concluidas: 0
        };
      }

      const reservas = JSON.parse(reservasData);
      
      return {
        total: reservas.length,
        pendentes: reservas.filter(r => r.status === 'Pendente').length,
        confirmadas: reservas.filter(r => r.status === 'Confirmada').length,
        emAndamento: reservas.filter(r => r.status === 'Em Andamento').length,
        concluidas: reservas.filter(r => r.status === 'Concluída').length,
        canceladas: reservas.filter(r => r.status === 'Cancelada').length
      };

    } catch (error) {
      console.error('❌ [SCHEDULER] Erro ao obter estatísticas:', error);
      return { total: 0, pendentes: 0, confirmadas: 0, emAndamento: 0, concluidas: 0 };
    }
  }

  /**
   * Limpa o scheduler ao ser destruído
   */
  async cleanup() {
    try {
      this.stop();
      console.log('🧹 [SCHEDULER] Cleanup concluído');
    } catch (error) {
      console.error('❌ [SCHEDULER] Erro no cleanup:', error);
    }
  }
}

// Singleton instance
const reservaScheduler = new ReservaScheduler();

export default reservaScheduler;