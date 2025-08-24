# 🚀 Guia EAS Updates - Atualizações Over-The-Air (OTA)

## 📋 O que foi configurado

O EAS Updates foi configurado no seu aplicativo para permitir atualizações over-the-air (OTA). Isso significa que você pode enviar atualizações de código JavaScript, assets e configurações diretamente para os usuários sem precisar republicar o app nas lojas.

## 🔧 Configurações Realizadas

### 1. Dependências
- ✅ `expo-updates` instalado
- ✅ Plugin `expo-updates` adicionado ao `app.json`

### 2. Configuração do App (`app.json`)
```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/5b82dbdf-d906-4f6e-91d0-3f7e3fb80d8f"
    },
    "plugins": [
      "expo-updates"
    ]
  }
}
```

### 3. Configuração EAS (`eas.json`)
```json
{
  "build": {
    "development": {
      "channel": "development"
    },
    "preview": {
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  },
  "update": {
    "development": {
      "channel": "development"
    },
    "preview": {
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

### 4. Lógica de Atualização no App
- ✅ Verificação automática de atualizações ao iniciar o app
- ✅ Alertas em português para o usuário
- ✅ Download e aplicação automática das atualizações

## 🚀 Como Usar

### Publicar Atualizações

#### Método 1: Script Helper (Recomendado)
```bash
node update-helper.js
```

#### Método 2: Comandos NPM Diretos
```bash
# Para desenvolvimento
npm run update:dev

# Para preview
npm run update:preview

# Para produção
npm run update:prod
```

#### Método 3: Comandos EAS Diretos
```bash
# Desenvolvimento
eas update --branch development --message "Sua mensagem aqui"

# Preview
eas update --branch preview --message "Sua mensagem aqui"

# Produção
eas update --branch production --message "Sua mensagem aqui"
```

### Fluxo de Trabalho Recomendado

1. **Desenvolvimento**: Teste suas mudanças
   ```bash
   npm run update:dev
   ```

2. **Preview**: Envie para teste interno
   ```bash
   npm run update:preview
   ```

3. **Produção**: Publique para todos os usuários
   ```bash
   npm run update:prod
   ```

## 📱 Experiência do Usuário

### Quando uma atualização está disponível:
1. O app verifica atualizações ao iniciar
2. Se encontrar, mostra um alerta em português
3. Usuário pode escolher "Depois" ou "Atualizar"
4. Se escolher atualizar, o download acontece automaticamente
5. Após o download, o app reinicia com a nova versão

### Mensagens em Português:
- **Título**: "Atualização Disponível"
- **Descrição**: "Uma nova versão do aplicativo está disponível. Deseja atualizar agora?"
- **Botões**: "Depois" e "Atualizar"

## 🔍 Monitoramento

### Ver Atualizações Publicadas
```bash
eas update:list
```

### Ver Detalhes de uma Atualização
```bash
eas update:view [UPDATE_ID]
```

## ⚠️ Limitações das Atualizações OTA

### ✅ O que PODE ser atualizado:
- Código JavaScript
- Imagens e assets
- Configurações do app.json (limitadas)
- Mudanças de UI/UX
- Correções de bugs
- Novas funcionalidades em JS

### ❌ O que NÃO PODE ser atualizado:
- Código nativo (iOS/Android)
- Novas permissões
- Mudanças de ícone ou splash screen
- Alterações no build (eas.json)
- Plugins nativos novos

Para essas mudanças, você precisa fazer um novo build com:
```bash
eas build --platform android --profile preview
```

## 🛠️ Troubleshooting

### Atualização não aparece
1. Verifique se o canal está correto
2. Confirme que a runtime version é compatível
3. Teste em um build de produção (não funciona em desenvolvimento)

### Erro ao publicar
1. Verifique sua autenticação EAS: `eas login`
2. Confirme que o projeto está configurado: `eas whoami`

### Atualização não aplica
1. Force close e reabra o app
2. Verifique a conexão com internet
3. Confirme que não está em modo de desenvolvimento

## 🎯 Próximos Passos

1. **Teste a configuração**: Faça uma atualização de teste
2. **Configure CI/CD**: Automatize as atualizações
3. **Monitore métricas**: Acompanhe adoção das atualizações
4. **Rollback**: Configure estratégias de reversão se necessário

## 📞 Comandos Úteis

```bash
# Status do projeto
eas whoami

# Listar atualizações
eas update:list

# Ver branches disponíveis
eas branch:list

# Deletar uma atualização
eas update:delete [UPDATE_ID]

# Ver logs
eas update:view [UPDATE_ID]
```

---

**Configuração concluída! 🎉**

Seu app agora suporta atualizações over-the-air. Os usuários receberão atualizações automaticamente, melhorando a experiência e permitindo correções rápidas.