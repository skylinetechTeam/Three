# 🚀 Scripts de Inicialização da API

Este diretório contém scripts para iniciar automaticamente o servidor da API do aplicativo de corridas.

## 📁 Scripts Disponíveis

### 1. `start-api.bat` (Windows - Batch)
Script mais simples para Windows.

**Como usar:**
```cmd
# Duplo clique no arquivo ou execute no terminal
start-api.bat
```

### 2. `start-api.ps1` (Windows - PowerShell)
Script mais avançado com logs coloridos e melhor tratamento de erros.

**Como usar:**
```powershell
# Executar normalmente
.\start-api.ps1

# Modo verboso (mais logs)
.\start-api.ps1 -Verbose

# Ver ajuda
.\start-api.ps1 -Help
```

### 3. `start-api.js` (Node.js - Multiplataforma)
Script em JavaScript que funciona em qualquer sistema operacional.

**Como usar:**
```bash
node start-api.js
```

### 4. `start.ps1` (PowerShell - Simples) ⭐ **RECOMENDADO**
Script PowerShell simplificado e confiável.

**Como usar:**
```powershell
.\start.ps1
```

### 5. `setup-and-start.ps1` (PowerShell - Completo)
Instala dependências automaticamente e inicia o servidor.

**Como usar:**
```powershell
# Para primeira execução ou se faltarem dependências
.\setup-and-start.ps1
```

## ⚙️ Pré-requisitos

- ✅ **Node.js instalado** (https://nodejs.org)
- ✅ **Pasta `api` existir** com arquivo `server.js`
- ✅ **Dependências instaladas** na pasta api (`npm install`)

## 🎯 O que os scripts fazem

1. **Verificam** se Node.js está instalado
2. **Validam** a estrutura do projeto (pasta api, server.js)
3. **Iniciam** o servidor da API automaticamente
4. **Mostram** os logs do servidor em tempo real
5. **Permitem** encerrar com Ctrl+C

## 📊 Estrutura Esperada

```
Seu Projeto/
├── api/
│   ├── server.js          # ← Arquivo principal da API
│   ├── package.json       # ← Configurações e dependências
│   ├── routes/           # ← Rotas da API
│   └── services/         # ← Serviços da API
├── start-api.bat         # ← Script Windows (Batch)
├── start-api.ps1         # ← Script Windows (PowerShell)
├── start-api.js          # ← Script Node.js
└── README_SCRIPTS.md     # ← Este arquivo
```

## 🔧 Solução de Problemas

### Erro: "Node.js não encontrado"
- Instale o Node.js: https://nodejs.org
- Reinicie o terminal após a instalação

### Erro: "Pasta 'api' não encontrada"
- Certifique-se de estar na pasta correta do projeto
- Verifique se a pasta `api` existe no mesmo diretório dos scripts

### Erro: "server.js não encontrado"
- Verifique se o arquivo `api/server.js` existe
- Certifique-se de que a API foi configurada corretamente

### Erro: "Módulo não encontrado"
- Execute `npm install` na pasta `api` para instalar dependências
- Verifique se o `package.json` está correto

## 💡 Dicas

- **Use `start.ps1`** ⭐ para melhor experiência (recomendado)
- **Use `setup-and-start.ps1`** na primeira execução para instalar dependências
- **Use duplo clique** no arquivo `.bat` para execução rápida
- **Pressione Ctrl+C** para encerrar o servidor
- **Verifique os logs** para identificar problemas

## 🌐 Acesso à API

Após iniciar, a API estará disponível em:
- **URL padrão:** http://localhost:3000
- **Health check:** http://localhost:3000/health
- **Documentação:** http://localhost:3000/api

## 🆘 Suporte

Se encontrar problemas:
1. Verifique se todos os pré-requisitos estão atendidos
2. Consulte os logs de erro exibidos pelo script
3. Certifique-se de que nenhum outro processo está usando a porta 3000