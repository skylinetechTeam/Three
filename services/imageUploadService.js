import { supabase } from '../supabaseClient';

const imageUploadService = {
  /**
   * Faz upload de uma imagem para o Supabase Storage
   * @param {string} imageUri - URI local da imagem (file://)
   * @param {string} userId - ID do usuário
   * @returns {Promise<string|null>} - URL pública da imagem ou null se falhar
   */
  async uploadProfileImage(imageUri, userId) {
    try {
      console.log('📸 [ImageUpload] Iniciando upload...');
      console.log('📸 [ImageUpload] URI:', imageUri);
      console.log('📸 [ImageUpload] User ID:', userId);

      // Validar entrada
      if (!imageUri || !imageUri.startsWith('file://')) {
        console.error('❌ [ImageUpload] URI inválida');
        return null;
      }

      if (!userId) {
        console.error('❌ [ImageUpload] User ID não fornecido');
        return null;
      }

      // Converter imagem para blob
      console.log('🔄 [ImageUpload] Convertendo imagem para blob...');
      const response = await fetch(imageUri);
      const blob = await response.blob();
      console.log('✅ [ImageUpload] Blob criado:', blob.size, 'bytes');

      // Criar nome único para o arquivo
      const timestamp = Date.now();
      const fileName = `${userId}_${timestamp}.jpg`;
      console.log('📝 [ImageUpload] Nome do arquivo:', fileName);

      // Fazer upload para o bucket profile-images
      console.log('⬆️ [ImageUpload] Fazendo upload para Supabase Storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ [ImageUpload] Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('✅ [ImageUpload] Upload concluído!');
      console.log('📁 [ImageUpload] Path:', uploadData.path);

      // Obter URL pública
      console.log('🌐 [ImageUpload] Obtendo URL pública...');
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        console.error('❌ [ImageUpload] Não foi possível obter URL pública');
        return null;
      }

      console.log('✅ [ImageUpload] URL pública obtida:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error) {
      console.error('❌ [ImageUpload] Erro geral:', error);
      return null;
    }
  },

  /**
   * Deleta uma imagem antiga do Supabase Storage
   * @param {string} imageUrl - URL da imagem a ser deletada
   */
  async deleteProfileImage(imageUrl) {
    try {
      if (!imageUrl) return;

      // Extrair nome do arquivo da URL
      const fileName = imageUrl.split('/').pop();
      console.log('🗑️ [ImageUpload] Deletando imagem:', fileName);

      const { error } = await supabase.storage
        .from('profile-images')
        .remove([fileName]);

      if (error) {
        console.error('❌ [ImageUpload] Erro ao deletar:', error);
      } else {
        console.log('✅ [ImageUpload] Imagem deletada com sucesso');
      }
    } catch (error) {
      console.error('❌ [ImageUpload] Erro ao deletar:', error);
    }
  }
};

export default imageUploadService;
