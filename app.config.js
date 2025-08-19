export default ({ config }) => ({
  ...config,
  name: "Three",
  slug: "three",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
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
