import { supabase } from '../supabaseClient';

/**
 * Serviço para autenticação e gerenciamento de motoristas no Supabase
 */
class SupabaseDriverService {

  /**
   * Verifica o status de login de um motorista
   * @param {string} emailOrPhone - Email ou telefone do motorista
   * @returns {Promise<Object>} Status do motorista e próximo passo
   */
  async checkDriverLoginStatus(emailOrPhone) {
    try {
      const { data, error } = await supabase
        .rpc('check_driver_login_status', {
          input_email_or_phone: emailOrPhone
        });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Erro ao verificar status do motorista:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Salva a foto do motorista
   * @param {string} emailOrPhone - Email ou telefone do motorista
   * @param {string} photoUri - URI local da foto
   * @returns {Promise<Object>} Resultado da operação
   */
  async saveDriverPhoto(emailOrPhone, photoUri) {
    try {
      // 1. Fazer upload da foto para o Storage do Supabase
      const photoUrl = await this.uploadPhoto(photoUri, emailOrPhone);
      
      // 2. Salvar URL da foto no banco
      const { data, error } = await supabase
        .rpc('save_driver_photo', {
          driver_email_or_phone: emailOrPhone,
          photo_url_param: photoUrl
        });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data,
        photoUrl: photoUrl
      };
    } catch (error) {
      console.error('Erro ao salvar foto do motorista:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Define a senha do motorista
   * @param {string} emailOrPhone - Email ou telefone do motorista
   * @param {string} password - Nova senha
   * @returns {Promise<Object>} Resultado da operação
   */
  async setDriverPassword(emailOrPhone, password) {
    try {
      const { data, error } = await supabase
        .rpc('set_driver_password', {
          driver_email_or_phone: emailOrPhone,
          new_password: password
        });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Erro ao definir senha do motorista:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Autentica o motorista com email/telefone e senha
   * @param {string} emailOrPhone - Email ou telefone do motorista
   * @param {string} password - Senha
   * @returns {Promise<Object>} Dados do motorista autenticado
   */
  async authenticateDriver(emailOrPhone, password) {
    try {
      const { data, error } = await supabase
        .rpc('authenticate_driver', {
          driver_email_or_phone: emailOrPhone,
          password_input: password
        });

      if (error) {
        throw new Error(error.message);
      }

      // Se autenticação bem-sucedida, salvar token localmente
      if (data.success) {
        await this.saveSessionToken(data.session_token);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Erro ao autenticar motorista:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Valida a sessão atual do motorista
   * @returns {Promise<Object>} Dados da sessão válida
   */
  async validateSession() {
    try {
      const token = await this.getSessionToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Nenhuma sessão encontrada'
        };
      }

      const { data, error } = await supabase
        .rpc('validate_driver_session', {
          token: token
        });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Erro ao validar sessão:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Faz logout do motorista
   * @returns {Promise<Object>} Resultado da operação
   */
  async logout() {
    try {
      const token = await this.getSessionToken();
      
      if (token) {
        const { data, error } = await supabase
          .rpc('logout_driver', {
            token: token
          });

        if (error) {
          throw new Error(error.message);
        }
      }

      // Limpar token local
      await this.clearSessionToken();

      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualiza a localização do motorista
   * @param {string} driverId - ID do motorista
   * @param {Object} location - {lat: number, lng: number}
   * @returns {Promise<Object>} Resultado da operação
   */
  async updateDriverLocation(driverId, location) {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .update({
          current_location: location,
          last_location_update: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualiza o status online/offline do motorista
   * @param {string} driverId - ID do motorista
   * @param {boolean} isOnline - Status online
   * @returns {Promise<Object>} Resultado da operação
   */
  async updateDriverStatus(driverId, isOnline) {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .update({
          is_online: isOnline,
          status: isOnline ? 'available' : 'offline'
        })
        .eq('id', driverId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  /**
   * Faz upload da foto para o Supabase Storage
   * @param {string} photoUri - URI local da foto
   * @param {string} driverIdentifier - Identificador do motorista para nomear o arquivo
   * @returns {Promise<string>} URL pública da foto
   */
  async uploadPhoto(photoUri, driverIdentifier) {
    try {
      // Gerar nome único para o arquivo
      const fileName = `driver_${driverIdentifier.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`;
      
      // Converter URI para blob
      const response = await fetch(photoUri);
      const blob = await response.blob();

      // Upload para o bucket 'driver-photos'
      const { data, error } = await supabase.storage
        .from('driver-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('driver-photos')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      throw error;
    }
  }

  /**
   * Salva o token de sessão localmente
   * @param {string} token - Token de sessão
   */
  async saveSessionToken(token) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('@driver_session_token', token);
    } catch (error) {
      console.error('Erro ao salvar token:', error);
    }
  }

  /**
   * Recupera o token de sessão local
   * @returns {Promise<string|null>} Token de sessão
   */
  async getSessionToken() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem('@driver_session_token');
    } catch (error) {
      console.error('Erro ao recuperar token:', error);
      return null;
    }
  }

  /**
   * Remove o token de sessão local
   */
  async clearSessionToken() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('@driver_session_token');
    } catch (error) {
      console.error('Erro ao limpar token:', error);
    }
  }

  /**
   * Verifica se há uma sessão ativa
   * @returns {Promise<boolean>} True se há sessão ativa
   */
  async hasActiveSession() {
    const sessionResult = await this.validateSession();
    return sessionResult.success && sessionResult.data?.valid;
  }
}

export default new SupabaseDriverService();