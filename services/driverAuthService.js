import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

// Chaves para o AsyncStorage
const STORAGE_KEYS = {
  DRIVER_AUTH: 'driver_auth_data',
  DRIVER_PHOTO: 'driver_photo',
  DRIVER_SESSION: 'driver_session'
};

// Função para gerar hash da senha (mesmo sistema dos usuários)
const hashPassword = (password) => {
  const hash = sha256(password + 'TRAVEL_APP_SECRET_2024');
  return Base64.stringify(hash);
};

class DriverAuthService {
  constructor() {
    this.currentDriver = null;
    this.supabase = supabase; // Exportar cliente supabase
  }

  // Verificar se motorista existe no banco por email ou telefone
  async checkDriverExists(emailOrPhone) {
    try {
      console.log('🔍 Verificando se motorista existe:', emailOrPhone);
      
      // Limpar e validar entrada
      const input = emailOrPhone.trim().toLowerCase();
      
      if (!input) {
        throw new Error('Email ou telefone é obrigatório');
      }
      
      // Verificar se é email ou telefone
      const isEmail = input.includes('@');
      
      let query;
      if (isEmail) {
        // Validar formato básico do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          throw new Error('Formato de email inválido');
        }
        
        query = supabase
          .from('drivers')
          .select('*')
          .eq('email', input)
          .single();
      } else {
        // Normalizar telefone (remover espaços, traços, etc)
        const normalizedPhone = input.replace(/\D/g, '');
        
        if (normalizedPhone.length < 8) {
          throw new Error('Número de telefone muito curto');
        }
        
        query = supabase
          .from('drivers')
          .select('*')
          .eq('phone', normalizedPhone)
          .single();
      }

      const { data, error } = await query;

      if (error && error.code !== 'PGRST116') { // PGRST116 = não encontrado
        console.error('❌ Erro ao verificar motorista:', error);
        
        // Tratar diferentes tipos de erro
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
        } else if (error.message?.includes('timeout')) {
          throw new Error('Tempo limite esgotado. Tente novamente.');
        } else {
          throw new Error('Erro no servidor. Tente novamente em alguns minutos.');
        }
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
      
      // Se o erro já tem uma mensagem personalizada, mantê-la
      if (error.message && !error.message.includes('supabase')) {
        throw error;
      }
      
      // Caso contrário, criar uma mensagem mais amigável
      throw new Error('Erro ao verificar motorista. Verifique sua conexão e tente novamente.');
    }
  }

  // Verificar senha do motorista no Supabase
  async verifyDriverPassword(driverId, password) {
    try {
      console.log('🔐 Verificando senha do motorista no Supabase:', driverId);
      
      if (!driverId || !password) {
        throw new Error('ID do motorista e senha são obrigatórios');
      }

      // Buscar motorista no banco
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('password_hash')
        .eq('id', driverId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar motorista:', error);
        throw new Error('Motorista não encontrado');
      }

      if (!driver.password_hash) {
        console.log('❌ Motorista não tem senha definida');
        return false;
      }

      // Comparar senha com hash
      const hashedInput = hashPassword(password);
      const isValid = hashedInput === driver.password_hash;
      
      console.log(isValid ? '✅ Senha válida' : '❌ Senha inválida');
      return isValid;

    } catch (error) {
      console.error('❌ Erro ao verificar senha:', error);
      throw error;
    }
  }

  // Definir nova senha para motorista no Supabase
  async setDriverPassword(driverId, password) {
    try {
      console.log('🔐 Definindo nova senha no Supabase para motorista:', driverId);
      
      if (!driverId || !password) {
        throw new Error('ID do motorista e senha são obrigatórios');
      }

      if (password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }
      
      // Gerar hash da senha
      const hashedPassword = hashPassword(password);
      
      // Atualizar senha no banco
      const { error } = await supabase
        .from('drivers')
        .update({ 
          password_hash: hashedPassword
        })
        .eq('id', driverId);

      if (error) {
        console.error('❌ Erro ao atualizar senha:', error);
        throw error;
      }
      
      console.log('✅ Senha definida com sucesso no Supabase');
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
        .update(updates)
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

  // Salvar foto do motorista localmente E no Supabase Storage
  async saveDriverPhoto(photoUri, driverId) {
    try {
      // Salvar localmente
      await AsyncStorage.setItem(STORAGE_KEYS.DRIVER_PHOTO, photoUri);
      console.log('✅ Foto salva localmente');
      
      // Fazer upload para Supabase Storage
      if (driverId && photoUri) {
        try {
          await this.uploadDriverPhotoToSupabase(photoUri, driverId);
        } catch (uploadError) {
          console.warn('⚠️ Erro ao fazer upload da foto, continuando...', uploadError);
          // Não falhar o login se o upload falhar
        }
      }
      
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

  // Upload da foto do motorista para Supabase Storage
  async uploadDriverPhotoToSupabase(photoUri, driverId) {
    try {
      console.log('📋 Upload de foto para Supabase:', driverId);
      
      // Converter URI para Blob
      const response = await fetch(photoUri);
      const blob = await response.blob();
      
      // Nome do arquivo: driver_{id}_{timestamp}.jpg
      const timestamp = Date.now();
      const fileName = `driver_${driverId}_${timestamp}.jpg`;
      const filePath = `drivers/${fileName}`;
      
      // Upload para o bucket 'driver-photos'
      const { data, error } = await supabase.storage
        .from('driver-photos')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (error) {
        console.error('❌ Erro no upload:', error);
        throw error;
      }
      
      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('driver-photos')
        .getPublicUrl(filePath);
      
      const photoUrl = publicUrlData.publicUrl;
      console.log('✅ Foto enviada com sucesso:', photoUrl);
      
      // Atualizar campo photo_url na tabela drivers
      const { error: updateError } = await supabase
        .from('drivers')
        .update({ photo_url: photoUrl })
        .eq('id', driverId);
      
      if (updateError) {
        console.warn('⚠️ Erro ao atualizar photo_url:', updateError);
      }
      
      return photoUrl;
    } catch (error) {
      console.error('❌ Erro ao fazer upload da foto:', error);
      throw error;
    }
  }

  // Buscar URL da foto do motorista do Supabase
  async getDriverPhotoUrl(driverId) {
    try {
      if (!driverId) {
        return null;
      }

      // Tentar buscar por ID primeiro
      let { data, error } = await supabase
        .from('drivers')
        .select('photo_url')
        .eq('id', driverId)
        .single();
      
      // Se não encontrou por ID, tentar por tax_id
      if (error || !data) {
        const { data: dataByTaxId, error: errorByTaxId } = await supabase
          .from('drivers')
          .select('photo_url')
          .eq('tax_id', driverId)
          .single();
        
        if (!errorByTaxId && dataByTaxId) {
          return dataByTaxId.photo_url;
        }
      }
      
      // Se não encontrou por tax_id, tentar por license_number (placa)
      if (error || !data) {
        const { data: dataByLicense, error: errorByLicense } = await supabase
          .from('drivers')
          .select('photo_url')
          .eq('license_number', driverId)
          .single();
        
        if (!errorByLicense && dataByLicense) {
          return dataByLicense.photo_url;
        }
      }
      
      return data?.photo_url || null;
    } catch (error) {
      console.error('❌ Erro ao buscar photo_url:', error);
      return null;
    }
  }

  // Alterar senha do motorista
  async changeDriverPassword(currentPassword, newPassword) {
    try {
      console.log('🔐 Iniciando alteração de senha do motorista');
      
      if (!currentPassword || !newPassword) {
        throw new Error('Senha atual e nova senha são obrigatórias');
      }

      if (currentPassword === newPassword) {
        throw new Error('Nova senha deve ser diferente da senha atual');
      }

      if (newPassword.length < 6) {
        throw new Error('Nova senha deve ter pelo menos 6 caracteres');
      }

      // Obter dados locais do motorista
      const driverData = await this.getLocalDriverData();
      
      if (!driverData) {
        throw new Error('Dados do motorista não encontrados');
      }

      // Verificar senha atual no Supabase
      const isCurrentValid = await this.verifyDriverPassword(driverData.id, currentPassword);
      
      if (!isCurrentValid) {
        throw new Error('Senha atual incorreta');
      }

      // Atualizar senha no Supabase
      await this.setDriverPassword(driverData.id, newPassword);
      
      console.log('✅ Senha alterada com sucesso');
      return {
        success: true,
        message: 'Senha alterada com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      throw error;
    }
  }
}

export default new DriverAuthService();