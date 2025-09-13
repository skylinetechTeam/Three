import { supabase } from '../supabaseClient';
import { Buffer } from 'buffer';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

// Função para gerar um salt aleatório
const generateSalt = (length = 16) => {
  const bytes = Array.from(crypto.getRandomValues(new Uint8Array(length)));
  return Buffer.from(bytes).toString('base64');
};

// Função para hash da senha usando SHA-256 (sem salt por enquanto para resolver erro de coluna)
const hashPassword = (password) => {
  const hash = sha256(password + 'TRAVEL_APP_SECRET_2024');
  return Base64.stringify(hash);
};

const authService = {
  async register({ nome, email, telefone, senha }) {
    try {
      // Hash da senha (sem salt por enquanto)
      const hashedPassword = hashPassword(senha);
      
      // Inserir usuário
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            nome,
            email,
            telefone,
            senha: hashedPassword
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
      console.log('Login attempt with:', { email, telefone, hasPassword: !!senha });
      
      // Busca usuário por email ou telefone
      let query = supabase.from('users').select('*');
      
      if (email) {
        console.log('Searching by email:', email);
        query = query.eq('email', email);
      } else if (telefone) {
        console.log('Searching by telefone:', telefone);
        query = query.eq('telefone', telefone);
      } else {
        throw new Error('Email ou telefone é obrigatório');
      }
      
      console.log('Executing Supabase query...');
      const { data: user, error } = await query.single();
      
      console.log('Supabase response:', { user: user ? 'found' : 'not found', error });

      if (error) {
        console.error('Supabase error details:', error);
        if (error.code === 'PGRST116') {
          throw new Error('Usuário não encontrado. Verifique se o email/telefone está correto.');
        }
        throw error;
      }
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verifica senha (sem salt)
      console.log('Verifying password...');
      const hashedInput = hashPassword(senha);
      const passwordMatch = hashedInput === user.senha;
      
      console.log('Password verification:', { match: passwordMatch });
      
      if (!passwordMatch) {
        throw new Error('Senha incorreta');
      }

      // Retorna usuário sem a senha
      const { senha: _, ...userWithoutPassword } = user;
      console.log('Login successful for user:', userWithoutPassword.nome);
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

      // Verifica senha atual (sem salt)
      const oldHash = hashPassword(oldPassword);
      const passwordMatch = oldHash === user.senha;
      if (!passwordMatch) throw new Error('Senha atual incorreta');

      // Gera hash para a nova senha (sem salt)
      const hashedPassword = hashPassword(newPassword);

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
