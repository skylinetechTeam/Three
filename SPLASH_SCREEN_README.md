# Splash Screen - Three App

## Configuração Implementada

### 1. Splash Screen Nativo (Expo)
- **Arquivo**: `app.json` e `app.config.js`
- **Imagem**: `./assets/logo.png`
- **Cor de fundo**: `#1737e8` (azul) - aplicado em TODOS os níveis
- **Modo de redimensionamento**: `contain`
- **Configurações específicas**: iOS, Android e Web com fundo azul

### 2. Splash Screen Personalizado (React Native)
- **Componente**: `components/SplashScreen.js`
- **Características**:
  - Animação de fade-in e scale
  - Gradiente de fundo azul
  - Logo centralizado
  - Duração: ~2.5 segundos

## Como Funciona

1. **Ao iniciar a aplicação**: O splash screen nativo do Expo é exibido com fundo azul
2. **Durante o carregamento**: O componente `SplashScreen` é renderizado com gradiente azul
3. **Transição**: Após a animação, a aplicação principal é carregada

## Configurações de Fundo Azul

Para garantir que o fundo azul seja aplicado em TODOS os níveis:

- ✅ **Splash principal**: `backgroundColor: "#1737e8"`
- ✅ **iOS específico**: `backgroundColor: "#1737e8"`
- ✅ **Android específico**: `backgroundColor: "#1737e8"`
- ✅ **Web específico**: `backgroundColor: "#1737e8"`
- ✅ **Modo escuro**: `backgroundColor: "#1737e8"` (mesmo azul)

## Personalização

### Alterar duração do splash screen:
Edite o arquivo `components/SplashScreen.js` e modifique o valor no `setTimeout`:

```javascript
setTimeout(() => {
  // ... código
}, 1500); // Altere este valor (em milissegundos)
```

### Alterar cores:
Modifique o array `colors` no `LinearGradient`:

```javascript
colors={['#1737e8', '#1e4fd8', '#2a5fd8']}
```

### Alterar tamanho do logo:
Modifique os valores em `styles.logo`:

```javascript
logo: {
  width: width * 0.4,  // 40% da largura da tela
  height: width * 0.4, // 40% da largura da tela
},
```

## Build e Teste

Para testar as mudanças:

1. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm start
   # ou
   yarn start
   ```

2. **Para testar no dispositivo/emulador**:
   ```bash
   npm run android
   # ou
   npm run ios
   ```

3. **Para build de produção**:
   ```bash
   expo build:android
   # ou
   expo build:ios
   ```

## Notas Importantes

- O splash screen nativo só aparece em builds de produção
- Durante o desenvolvimento, apenas o componente React Native é exibido
- Certifique-se de que `assets/logo.png` existe e tem boa qualidade
- O logo deve ter fundo transparente para melhor resultado

## Solução de Problemas

### Se o fundo branco ainda aparecer:

1. **Limpe o cache do Expo**:
   ```bash
   expo start --clear
   ```

2. **Reinicie completamente o servidor**:
   ```bash
   # Pare o servidor (Ctrl+C)
   # Depois execute:
   npm start
   ```

3. **Para builds de produção, use**:
   ```bash
   expo build:android --clear-cache
   expo build:ios --clear-cache
   ```

4. **Verifique se todos os arquivos estão sincronizados**:
   - `app.json` ✅
   - `app.config.js` ✅
   - `components/SplashScreen.js` ✅
