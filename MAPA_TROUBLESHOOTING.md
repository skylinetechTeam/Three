# Guia de Solução de Problemas - Mapa

## Problema: Mapa não aparece no Home Screen

### Possíveis Causas e Soluções:

#### 1. **API Key do HERE Maps Inválida ou Expirada**
- **Sintoma**: Mapa não carrega, erro no console
- **Solução**: 
  - Verifique se a API key em `config/maps.js` está válida
  - Obtenha uma nova API key em: https://developer.here.com/
  - Atualize a chave no arquivo `config/maps.js`

#### 2. **Problemas de Conectividade**
- **Sintoma**: Mapa não carrega, mensagem de erro de rede
- **Solução**:
  - Verifique a conexão com a internet
  - Teste se outros sites carregam normalmente
  - Verifique se há firewall bloqueando as requisições

#### 3. **Permissões de Localização**
- **Sintoma**: Mapa carrega mas não mostra localização atual
- **Solução**:
  - Verifique se o app tem permissão para acessar localização
  - Vá em Configurações > Privacidade > Localização
  - Permita o acesso para o app

#### 4. **Problemas com WebView**
- **Sintoma**: Tela em branco onde deveria estar o mapa
- **Solução**:
  - Verifique se `react-native-webview` está instalado corretamente
  - Execute: `npm install react-native-webview`
  - Limpe o cache: `npx expo start --clear`

#### 5. **Problemas de Configuração do Expo**
- **Sintoma**: Erro de build ou runtime
- **Solução**:
  - Verifique se todas as dependências estão instaladas
  - Execute: `npm install`
  - Limpe o cache: `npx expo start --clear`

### Como Testar:

#### 1. **Teste da API (Modo Desenvolvimento)**
- Abra o app em modo desenvolvimento
- Procure pelo painel de debug no canto superior esquerdo
- Clique em "Test API" para verificar se a API está funcionando

#### 2. **Verificar Logs**
- Abra o console do Expo/React Native
- Procure por mensagens de erro relacionadas ao mapa
- Mensagens importantes:
  - `🗺️ WebView loaded successfully` - Mapa carregou
  - `❌ WebView error` - Erro no WebView
  - `🌐 WebView HTTP error` - Erro HTTP

#### 3. **Teste Manual da API**
```javascript
// Execute no console do navegador
const apiKey = 'SUA_API_KEY';
const url = `https://discover.search.hereapi.com/v1/discover?apikey=${apiKey}&q=Luanda&at=-8.8390,13.2894&limit=1`;
fetch(url).then(r => r.json()).then(console.log);
```

### Configurações Importantes:

#### 1. **Arquivo de Configuração** (`config/maps.js`)
```javascript
export const MAPS_CONFIG = {
  HERE: {
    API_KEY: 'sua_api_key_aqui',
    // ...
  }
};
```

#### 2. **Permissões** (`app.config.js`)
```javascript
plugins: [
  [
    "expo-location",
    {
      locationAlwaysAndWhenInUsePermission: "Permitir $(PRODUCT_NAME) que use a sua localização.",
    },
  ],
],
```

#### 3. **Dependências** (`package.json`)
```json
{
  "dependencies": {
    "react-native-webview": "^13.15.0",
    "expo-location": "~18.1.6"
  }
}
```

### Fallbacks Implementados:

1. **Tela de Loading**: Mostra indicador enquanto carrega
2. **Tela de Erro**: Mostra mensagem quando falha
3. **Botão de Retry**: Permite tentar novamente
4. **Localização Padrão**: Usa Luanda, Angola como fallback
5. **Debug Info**: Mostra informações úteis em desenvolvimento

### Próximos Passos se o Problema Persistir:

1. **Verifique a API Key**: Teste se está funcionando
2. **Teste em Diferentes Dispositivos**: Pode ser problema específico
3. **Verifique a Versão do React Native**: Pode ser incompatibilidade
4. **Considere Alternativas**: Google Maps, Mapbox, etc.

### Contato para Suporte:

Se o problema persistir após tentar todas as soluções acima, forneça:
- Logs de erro completos
- Versão do React Native/Expo
- Dispositivo/emulador usado
- Screenshots do problema