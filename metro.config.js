const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurações específicas para garantir que o splash screen funcione corretamente
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif');

module.exports = config;
