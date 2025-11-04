import { supabase } from '../supabaseClient';
import { Buffer } from 'buffer';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
import { sendResetCodeEmail } from '../utils/emailService';

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
  supabase, // Exportar cliente supabase
  
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
  },

  // Solicita código de redefinição (armazena no Supabase e tenta enviar por email)
  async requestPasswordReset(email) {
    try {
      // Verifica se email existe
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, nome')
        .eq('email', email)
        .single();

      if (userError || !user) {
        throw new Error('Email não encontrado');
      }

      // Gera código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

      // Salva/atualiza solicitação na tabela password_resets
      const { error: upsertError } = await supabase
        .from('password_resets')
        .upsert({ email, code, expires_at: expiresAt }, { onConflict: 'email' });

      if (upsertError) throw upsertError;

      // Tenta enviar por email (opcional)
      let viaEmail = false;
      try {
        console.log('🔄 AuthService: Chamando sendResetCodeEmail...');
        viaEmail = await sendResetCodeEmail(email, code, user?.nome || '');
        console.log('🔄 AuthService: Resultado do envio:', viaEmail);
      } catch (e) {
        console.error('❌ AuthService: Erro no emailService:', e);
        viaEmail = false;
      }

      return { sent: true, code, viaEmail };
    } catch (error) {
      console.error('Erro ao solicitar reset:', error);
      throw error;
    }
  },

  // Confirma código e redefine senha
  async resetPasswordWithCode(email, code, newPassword) {
    try {
      // Busca solicitação
      const { data: req, error: reqError } = await supabase
        .from('password_resets')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .single();

      if (reqError || !req) throw new Error('Código inválido');
      if (new Date(req.expires_at).getTime() < Date.now()) throw new Error('Código expirado');

      // Atualiza senha do usuário
      const hashedPassword = hashPassword(newPassword);
      const { error: updateError } = await supabase
        .from('users')
        .update({ senha: hashedPassword })
        .eq('email', email);

      if (updateError) throw updateError;

      // Remove o código usado
      await supabase
        .from('password_resets')
        .delete()
        .eq('email', email);

      return { success: true };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      throw error;
    }
  }
};

export default authService;
