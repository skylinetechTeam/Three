import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves para o AsyncStorage
const STORAGE_KEYS = {
  DRIVER_AUTH: 'driver_auth_data',
  DRIVER_PHOTO: 'driver_photo',
  DRIVER_SESSION: 'driver_session'
};

class DriverAuthService {
  constructor() {
    this.currentDriver = null;
  }

  // Verificar se motorista existe no banco por email ou telefone
  async checkDriverExists(emailOrPhone) {
    try {
      console.log('🔍 Verificando se motorista existe:', emailOrPhone);
      
      // Limpar e validar entrada
      const input = emailOrPhone.trim().toLowerCase();
      
      // Verificar se é email ou telefone
      const isEmail = input.includes('@');
      
      let query;
      if (isEmail) {
        query = supabase
          .from('drivers')
          .select('*')
          .eq('email', input)
          .single();
      } else {
        // Normalizar telefone (remover espaços, traços, etc)
        const normalizedPhone = input.replace(/\D/g, '');
        query = supabase
          .from('drivers')
          .select('*')
          .eq('phone', normalizedPhone)
          .single();
      }

      const { data, error } = await query;

      if (error && error.code !== 'PGRST116') { // PGRST116 = não encontrado
        console.error('❌ Erro ao verificar motorista:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Motorista encontrado no banco:', data.name);
        return {
          exists: true,
          driver: data,
          hasPassword: !!data.password_hash
        };
      } else {
        console.log('❌ Motorista não encontrado no banco');
        return {
          exists: false,
          driver: null,
          hasPassword: false
        };
      }

    } catch (error) {
      console.error('❌ Erro ao verificar motorista:', error);
      throw error;
    }
  }

  // Verificar senha do motorista
  async verifyDriverPassword(driverId, password) {
    try {
      console.log('🔐 Verificando senha do motorista:', driverId);
      
      const { data, error } = await supabase
        .from('drivers')
        .select('password_hash')
        .eq('id', driverId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar senha:', error);
        throw error;
      }

      // Por simplicidade, vamos comparar diretamente (em produção use bcrypt)
      const isValid = data.password_hash === password;
      
      console.log(isValid ? '✅ Senha válida' : '❌ Senha inválida');
      return isValid;

    } catch (error) {
      console.error('❌ Erro ao verificar senha:', error);
      throw error;
    }
  }

  // Definir nova senha para motorista
  async setDriverPassword(driverId, password) {
    try {
      console.log('🔐 Definindo nova senha para motorista:', driverId);
      
      const { error } = await supabase
        .from('drivers')
        .update({ 
          password_hash: password, // Em produção, use bcrypt para hash
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) {
        console.error('❌ Erro ao definir senha:', error);
        throw error;
      }

      console.log('✅ Senha definida com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro ao definir senha:', error);
      throw error;
    }
  }

  // Salvar dados do motorista localmente
  async saveDriverLocally(driverData, photo = null) {
    try {
      console.log('💾 Salvando dados do motorista localmente');
      
      // Salvar dados principais
      await AsyncStorage.setItem(
        STORAGE_KEYS.DRIVER_AUTH, 
        JSON.stringify({
          ...driverData,
          isLoggedIn: true,
          lastLogin: new Date().toISOString()
        })
      );

      // Salvar foto separadamente se fornecida
      if (photo) {
        await AsyncStorage.setItem(STORAGE_KEYS.DRIVER_PHOTO, photo);
      }

      // Salvar sessão ativa
      await AsyncStorage.setItem(
        STORAGE_KEYS.DRIVER_SESSION,
        JSON.stringify({
          driverId: driverData.id,
          loginTime: new Date().toISOString(),
          isActive: true
        })
      );

      this.currentDriver = driverData;
      console.log('✅ Dados salvos localmente');
      return true;

    } catch (error) {
      console.error('❌ Erro ao salvar dados localmente:', error);
      throw error;
    }
  }

  // Recuperar dados do motorista salvos localmente
  async getLocalDriverData() {
    try {
      const authData = await AsyncStorage.getItem(STORAGE_KEYS.DRIVER_AUTH);
      const photo = await AsyncStorage.getItem(STORAGE_KEYS.DRIVER_PHOTO);
      const session = await AsyncStorage.getItem(STORAGE_KEYS.DRIVER_SESSION);

      if (!authData) {
        return null;
      }

      const driverData = JSON.parse(authData);
      const sessionData = session ? JSON.parse(session) : null;

      return {
        ...driverData,
        photo,
        session: sessionData
      };

    } catch (error) {
      console.error('❌ Erro ao recuperar dados locais:', error);
      return null;
    }
  }

  // Verificar se motorista está logado
  async isDriverLoggedIn() {
    try {
      const localData = await this.getLocalDriverData();
      return !!(localData && localData.isLoggedIn && localData.session?.isActive);
    } catch (error) {
      console.error('❌ Erro ao verificar login:', error);
      return false;
    }
  }

  // Fazer logout do motorista
  async logoutDriver() {
    try {
      console.log('🚪 Fazendo logout do motorista');
      
      await AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_AUTH);
      await AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_PHOTO);
      await AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_SESSION);

      this.currentDriver = null;
      console.log('✅ Logout realizado com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      throw error;
    }
  }

  // Atualizar dados do motorista no Supabase
  async updateDriverInDatabase(driverId, updates) {
    try {
      console.log('🔄 Atualizando dados do motorista no banco:', driverId);
      
      const { error } = await supabase
        .from('drivers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) {
        console.error('❌ Erro ao atualizar motorista:', error);
        throw error;
      }

      console.log('✅ Motorista atualizado no banco');
      return true;

    } catch (error) {
      console.error('❌ Erro ao atualizar motorista:', error);
      throw error;
    }
  }

  // Buscar dados completos do motorista
  async getDriverFullData(driverId) {
    try {
      console.log('📊 Buscando dados completos do motorista:', driverId);
      
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          vehicles (*)
        `)
        .eq('id', driverId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar dados completos:', error);
        throw error;
      }

      console.log('✅ Dados completos obtidos');
      return data;

    } catch (error) {
      console.error('❌ Erro ao buscar dados completos:', error);
      throw error;
    }
  }

  // Salvar foto do motorista localmente
  async saveDriverPhoto(photoUri) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DRIVER_PHOTO, photoUri);
      console.log('✅ Foto do motorista salva localmente');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar foto:', error);
      throw error;
    }
  }

  // Recuperar foto do motorista
  async getDriverPhoto() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.DRIVER_PHOTO);
    } catch (error) {
      console.error('❌ Erro ao recuperar foto:', error);
      return null;
    }
  }
}

export default new DriverAuthService();