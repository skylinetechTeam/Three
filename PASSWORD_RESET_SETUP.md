# Recuperação de Senha (Somente Frontend)

Este app usa Supabase como banco para usuários (tabela `users`). Para funcionar o fluxo de "Esqueceu a senha?" sem backend próprio, crie a tabela auxiliar `password_resets` e (opcional) configure envio de email via EmailJS.

## 1) Criar tabela no Supabase

Execute no SQL do Supabase:

```sql
create table if not exists public.password_resets (
  email text primary key,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
-- Permissões para o client
alter table public.password_resets enable row level security;
-- Políticas simples (ajuste conforme necessidade)
create policy if not exists allow_all_on_password_resets
  on public.password_resets
  for all using (true) with check (true);
```

Observação: Em produção, restrinja políticas para evitar abuso.

## 2) Configurar envio de email (opcional)

Use EmailJS (não precisa backend):
- Crie um serviço e template (variáveis: to_email, to_name, code, app_name)
- Na raiz do projeto, crie `email.config.js` (não comitar):

```js
export const EMAILJS = {
  SERVICE_ID: 'seu_service_id',
  TEMPLATE_ID: 'seu_template_id',
  PUBLIC_KEY: 'seu_public_key'
};
```

Se não configurar, o app exibirá o código por Toast apenas para testes.

## 3) Fluxo do usuário

1. Login → "Esqueceu a senha?" → ForgotPasswordScreen
2. Digita email → Enviamos código → Vai para ResetPasswordScreen
3. Digita email + código + nova senha → Atualiza senha em `users.senha` (hash).

## 4) Segurança
- Código expira em 15 minutos
- O código é removido após uso
- Em produção, proteja a tabela com RLS adequada (por email do próprio usuário, etc.)