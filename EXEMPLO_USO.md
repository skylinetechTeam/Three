# 📱 Exemplo de Uso - Scripts de Inicialização

## 🚀 Primeira Execução

Se esta é a primeira vez que você está executando o projeto:

### Opção 1: Script Completo (Recomendado)
```powershell
# Abre o PowerShell e executa:
.\setup-and-start.ps1
```

✅ **O que este script faz:**
- Verifica se a estrutura do projeto está correta
- Instala todas as dependências necessárias automaticamente
- Inicia o servidor da API

### Opção 2: Manual
```powershell
# 1. Instalar dependências
cd api
npm install

# 2. Voltar e iniciar servidor
cd ..
.\start.ps1
```

## 🔄 Execuções Subsequentes

Para execuções normais (quando as dependências já estão instaladas):

### Opção Mais Simples
```powershell
.\start.ps1
```

### Ou duplo clique
- Duplo clique em `start-api.bat` no Explorer

## 📋 Passo a Passo Detalhado

### 1. Verificar Pré-requisitos
- ✅ Node.js instalado (https://nodejs.org)
- ✅ Pasta `api` existe
- ✅ Arquivo `api/server.js` existe

### 2. Escolher Script
- **Primeira vez:** `setup-and-start.ps1`
- **Uso normal:** `start.ps1`
- **Alternativa:** `start-api.bat`

### 3. Executar
```powershell
# Abrir PowerShell na pasta do projeto
# Executar o script escolhido
.\start.ps1
```

### 4. Verificar Funcionamento
- Aguardar mensagem: "Servidor rodando na porta 3000"
- Testar: http://localhost:3000/health
- Ver logs no terminal

### 5. Encerrar
- Pressionar `Ctrl+C`
- Aguardar encerramento gracioso

## 🎯 Resultado Esperado

Quando tudo estiver funcionando, você verá algo assim:

```
🚀 Iniciando API...
✅ Estrutura do projeto verificada
🚗 Servidor rodando na porta 3000
📡 Socket.IO habilitado para atualizações em tempo real
🌐 API disponível em: http://localhost:3000/api
❤️ Health check: http://localhost:3000/health
```

## 🔧 Solução de Problemas Comuns

### "Pasta api não encontrada"
```powershell
# Verificar se você está na pasta correta
ls
# Deve mostrar a pasta 'api'
```

### "Node.js não encontrado"
```powershell
# Verificar instalação
node --version
# Se não funcionar, instalar Node.js
```

### "Módulo não encontrado"
```powershell
# Instalar dependências manualmente
cd api
npm install
cd ..
.\start.ps1
```

### Porta já em uso
```powershell
# Verificar processos usando a porta 3000
netstat -ano | findstr :3000
# Encerrar processo se necessário
```

## 🎉 Pronto para Usar!

Após seguir estes passos, sua API estará rodando e pronta para receber requisições do aplicativo de corridas!