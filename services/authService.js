import { supabase } from '../supabaseClient';
import { Buffer } from 'buffer';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

// Função para gerar um salt aleatório
const generateSalt = (length = 16) => {
  const bytes = Array.from(crypto.getRandomValues(new Uint8Array(length)));
  return Buffer.from(bytes).toString('base64');
};

// Função para hash da senha usando SHA-256 com salt
const hashPassword = (password, salt) => {
  const hash = sha256(password + salt);
  return Base64.stringify(hash);
};

const authService = {
  async register({ nome, email, telefone, senha }) {
    try {
      // Gera salt e hash da senha
      const salt = generateSalt();
      const hashedPassword = hashPassword(senha, salt);
      
      // Inserir usuário
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            nome,
            email,
            telefone,
            senha: hashedPassword,
            salt
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      // Retorna usuário sem a senha
      const { senha: _, ...userWithoutPassword } = data;
      return { user: userWithoutPassword };
      
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  },

  async login({ email, telefone, senha }) {
    try {
      // Busca usuário por email ou telefone
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${email},telefone.eq.${telefone}`)
        .single();

      if (error) throw error;
      if (!user) throw new Error('Usuário não encontrado');

      // Verifica senha
      const hashedInput = hashPassword(senha, user.salt);
      const passwordMatch = hashedInput === user.senha;
      if (!passwordMatch) throw new Error('Senha incorreta');

      // Retorna usuário sem a senha
      const { senha: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };

    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  async getUserById(id) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, nome, email, telefone, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!user) throw new Error('Usuário não encontrado');

      return { user };

    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  },

  async updateUser(id, { nome, email, telefone }) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .update({ nome, email, telefone })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { user };

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  async changePassword(id, oldPassword, newPassword) {
    try {
      // Busca usuário atual
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('senha')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Verifica senha atual
      const oldHash = hashPassword(oldPassword, user.salt);
      const passwordMatch = oldHash === user.senha;
      if (!passwordMatch) throw new Error('Senha atual incorreta');

      // Gera novo salt e hash para a nova senha
      const newSalt = generateSalt();
      const hashedPassword = hashPassword(newPassword, newSalt);

      // Atualiza senha
      const { error: updateError } = await supabase
        .from('users')
        .update({ senha: hashedPassword })
        .eq('id', id);

      if (updateError) throw updateError;

      return { success: true };

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }
  }
};

export default authService;
