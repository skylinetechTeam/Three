/**
 * Serviço de Atualização OTA Silenciosa
 * Gerencia atualizações automáticas sem interromper a experiência do usuário
 */

import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';

class UpdateService {
  constructor() {
    this.UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // Verifica a cada 5 minutos
    this.LAST_UPDATE_KEY = '@three_last_update_check';
    this.UPDATE_POSTPONE_KEY = '@three_update_postponed';
    this.checkInterval = null;
    this.isUpdating = false;
    this.updateAvailable = false;
    this.silentMode = true; // Modo silencioso ativado por padrão
  }

  /**
   * Inicializa o serviço de atualizações
   * Deve ser chamado quando o app iniciar
   */
  async initialize() {
    console.log('🔄 [UpdateService] Inicializando serviço de atualizações OTA...');
    
    // Verifica se atualizações estão habilitadas
    if (!Updates.isEnabled) {
      console.log('⚠️ [UpdateService] Atualizações OTA desabilitadas em desenvolvimento');
      return;
    }

    // Verificar atualização imediatamente ao iniciar
    await this.checkForUpdateSilently();
    
    // Configurar verificação periódica
    this.startPeriodicCheck();
    
    // Listener para quando o app volta do background
    this.setupAppStateListener();
  }

  /**
   * Verifica atualizações silenciosamente
   */
  async checkForUpdateSilently() {
    try {
      if (this.isUpdating) {
        console.log('🔄 [UpdateService] Já verificando atualizações...');
        return;
      }

      this.isUpdating = true;
      
      // Salvar timestamp da última verificação
      await AsyncStorage.setItem(this.LAST_UPDATE_KEY, new Date().toISOString());
      
      console.log('🔍 [UpdateService] Verificando atualizações silenciosamente...');
      
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('✅ [UpdateService] Nova atualização disponível!');
        this.updateAvailable = true;
        
        // Baixar a atualização em background
        await this.downloadUpdateSilently();
      } else {
        console.log('ℹ️ [UpdateService] Nenhuma atualização disponível');
        this.updateAvailable = false;
      }
      
    } catch (error) {
      console.error('❌ [UpdateService] Erro ao verificar atualizações:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Baixa a atualização silenciosamente
   */
  async downloadUpdateSilently() {
    try {
      console.log('📥 [UpdateService] Baixando atualização em background...');
      
      const download = await Updates.fetchUpdateAsync();
      
      if (download.isNew) {
        console.log('✅ [UpdateService] Atualização baixada com sucesso!');
        
        if (this.silentMode) {
          // Em modo silencioso, agenda a instalação para quando o app for reiniciado
          await this.scheduleUpdateInstallation();
        } else {
          // Modo não silencioso - pergunta ao usuário
          await this.promptUserForUpdate();
        }
      }
    } catch (error) {
      console.error('❌ [UpdateService] Erro ao baixar atualização:', error);
    }
  }

  /**
   * Agenda a instalação da atualização
   * A atualização será aplicada na próxima vez que o app for aberto
   */
  async scheduleUpdateInstallation() {
    try {
      console.log('📅 [UpdateService] Agendando instalação silenciosa da atualização...');
      
      // Salvar flag indicando que há atualização pendente
      await AsyncStorage.setItem('@three_update_pending', 'true');
      
      // A atualização será aplicada automaticamente quando o usuário
      // fechar e abrir o app novamente (ou após 24 horas)
      
      // Configurar timer para aplicar após período de inatividade
      setTimeout(async () => {
        await this.applyUpdateIfInactive();
      }, 24 * 60 * 60 * 1000); // 24 horas
      
    } catch (error) {
      console.error('❌ [UpdateService] Erro ao agendar atualização:', error);
    }
  }

  /**
   * Aplica a atualização se o app estiver inativo
   */
  async applyUpdateIfInactive() {
    try {
      const lastActivity = await AsyncStorage.getItem('@three_last_activity');
      const now = new Date();
      const lastActivityTime = lastActivity ? new Date(lastActivity) : now;
      const inactiveMinutes = (now - lastActivityTime) / (1000 * 60);
      
      // Se inativo por mais de 30 minutos, aplicar atualização
      if (inactiveMinutes > 30) {
        console.log('🔄 [UpdateService] Aplicando atualização (app inativo)...');
        await Updates.reloadAsync();
      } else {
        // Tentar novamente em 30 minutos
        setTimeout(() => this.applyUpdateIfInactive(), 30 * 60 * 1000);
      }
    } catch (error) {
      console.error('❌ [UpdateService] Erro ao aplicar atualização:', error);
    }
  }

  /**
   * Configura verificação periódica de atualizações
   */
  startPeriodicCheck() {
    // Limpar intervalo anterior se existir
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Configurar nova verificação periódica
    this.checkInterval = setInterval(() => {
      this.checkForUpdateSilently();
    }, this.UPDATE_CHECK_INTERVAL);
    
    console.log('⏰ [UpdateService] Verificação periódica configurada (a cada 5 minutos)');
  }

  /**
   * Configura listener para estado do app
   */
  setupAppStateListener() {
    // Importar AppState dinamicamente
    const { AppState } = require('react-native');
    
    AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // App voltou para foreground
        console.log('📱 [UpdateService] App ativo - verificando atualizações...');
        
        // Verificar se há atualização pendente
        const updatePending = await AsyncStorage.getItem('@three_update_pending');
        
        if (updatePending === 'true') {
          // Aplicar atualização silenciosamente
          console.log('🔄 [UpdateService] Aplicando atualização pendente...');
          await AsyncStorage.removeItem('@three_update_pending');
          await Updates.reloadAsync();
        } else {
          // Verificar novas atualizações
          await this.checkForUpdateSilently();
        }
        
        // Atualizar timestamp de última atividade
        await AsyncStorage.setItem('@three_last_activity', new Date().toISOString());
      }
    });
  }

  /**
   * Para o serviço de atualizações
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('🛑 [UpdateService] Serviço de atualizações parado');
  }

  /**
   * Força uma verificação manual de atualizações
   */
  async forceCheck() {
    console.log('🔄 [UpdateService] Verificação manual solicitada...');
    this.silentMode = false; // Desativa modo silencioso temporariamente
    await this.checkForUpdateSilently();
    this.silentMode = true; // Reativa modo silencioso
  }

  /**
   * Obtém informações sobre a última atualização
   */
  async getUpdateInfo() {
    try {
      const lastCheck = await AsyncStorage.getItem(this.LAST_UPDATE_KEY);
      const updatePending = await AsyncStorage.getItem('@three_update_pending');
      
      return {
        lastCheck: lastCheck || null,
        updateAvailable: this.updateAvailable,
        updatePending: updatePending === 'true',
        currentVersion: Updates.manifest?.version || 'Unknown',
        channel: Updates.channel || 'default'
      };
    } catch (error) {
      console.error('❌ [UpdateService] Erro ao obter informações:', error);
      return null;
    }
  }

  /**
   * Modo de atualização não silenciosa (opcional)
   * Mostra uma notificação discreta ao usuário
   */
  async promptUserForUpdate() {
    // Esta função pode ser usada se quiser dar a opção ao usuário
    // Por padrão, as atualizações são silenciosas
    console.log('💬 [UpdateService] Modo não silencioso - usuário seria notificado');
    
    // Em produção, você poderia mostrar um toast ou modal sutil
    // Por enquanto, apenas aplica a atualização silenciosamente
    await this.scheduleUpdateInstallation();
  }

  /**
   * Ativa ou desativa o modo silencioso
   */
  setSilentMode(enabled) {
    this.silentMode = enabled;
    console.log(`🔇 [UpdateService] Modo silencioso: ${enabled ? 'ATIVADO' : 'DESATIVADO'}`);
  }
}

// Exportar instância única do serviço
const updateService = new UpdateService();
export default updateService;