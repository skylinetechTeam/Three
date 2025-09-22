export default ({ config }) => ({
  ...config,
  name: "Three",
  slug: "three",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  
  // Configurações de atualização OTA
  updates: {
    enabled: true,
    url: "https://u.expo.dev/5b82dbdf-d906-4f6e-91d0-3f7e3fb80d8f", // URL do EAS Update
    checkAutomatically: "ON_LOAD", // Verifica atualizações ao iniciar o app
    fallbackToCacheTimeout: 30000, // 30 segundos de timeout
    
    // Configuração para atualizações silenciosas
    // O app baixa a atualização em background sem interromper o usuário
    requestHeaders: {
      "expo-channel-name": "production"
    }
  },
  
  // Runtime version para controlar compatibilidade de atualizações
  runtimeVersion: {
    policy: "appVersion" // Usa a versão do SDK como base
  },
  splash: {
    backgroundColor: "#1737e8",
    resizeMode: "contain",
    image: "./assets/logo.png",
    imageWidth: 200,
    imageHeight: 200,
    dark: {
      backgroundColor: "#1737e8",
      image: "./assets/logo.png",
    },
  },
  ios: {
    supportsTablet: true,
    splash: {
      backgroundColor: "#1737e8",
      image: "./assets/logo.png",
      resizeMode: "contain",
      imageWidth: 200,
      imageHeight: 200,
      dark: {
        backgroundColor: "#1737e8",
        image: "./assets/logo.png",
      },
    },
  },
  android: {
    package: 'com.lumora.three',
    versionCode: 2,
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#1737e8',
    },
    splash: {
      backgroundColor: "#1737e8",
      image: "./assets/logo.png",
      resizeMode: "contain",
      imageWidth: 200,
      imageHeight: 200,
      dark: {
        backgroundColor: "#1737e8",
        image: "./assets/logo.png",
      },
    },
  },
  web: {
    favicon: "./assets/icon.png",
    splash: {
      backgroundColor: "#1737e8",
      image: "./assets/logo.png",
      resizeMode: "contain",
    },
  },
  plugins: [
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Permitir $(PRODUCT_NAME) que use a sua localização.",
      },
    ],
  ],
});
