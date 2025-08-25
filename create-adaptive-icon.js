// Script para criar um ícone adaptativo adequado para Android
// Execute este script se o ícone ainda estiver muito grande

const fs = require('fs');
const path = require('path');

console.log('🎨 Script para criar ícone adaptativo Android');
console.log('');

// Verificar se os arquivos existem
const assetsDir = './assets';
const iconPath = path.join(assetsDir, 'icon.png');
const adaptiveIconPath = path.join(assetsDir, 'adaptive-icon.png');

if (!fs.existsSync(iconPath)) {
  console.error('❌ Arquivo icon.png não encontrado em ./assets/');
  process.exit(1);
}

console.log('✅ Arquivo icon.png encontrado');

if (fs.existsSync(adaptiveIconPath)) {
  console.log('✅ Arquivo adaptive-icon.png já existe');
} else {
  console.log('⚠️  Arquivo adaptive-icon.png não encontrado');
}

console.log('');
console.log('📋 Instruções para criar um ícone adaptativo adequado:');
console.log('');
console.log('1. 🖼️  TAMANHO CORRETO:');
console.log('   - Canvas: 1024x1024 pixels');
console.log('   - Área segura: 720x720 pixels (centro)');
console.log('   - Margem: 152px em cada lado');
console.log('');
console.log('2. 🎯 POSICIONAMENTO:');
console.log('   - Logo deve ocupar apenas o centro');
console.log('   - Deixar espaço ao redor (15% de margem)');
console.log('   - Não encostar nas bordas');
console.log('');
console.log('3. 🎨 FORMATO:');
console.log('   - PNG com transparência');
console.log('   - Fundo transparente');
console.log('   - Logo centralizado');
console.log('');
console.log('4. 🛠️  FERRAMENTAS RECOMENDADAS:');
console.log('   - Canva (online, fácil de usar)');
console.log('   - Figma (profissional)');
console.log('   - GIMP (gratuito)');
console.log('   - Photoshop');
console.log('');
console.log('5. 📐 TEMPLATE SUGERIDO:');
console.log('   - Crie um quadrado de 1024x1024px');
console.log('   - Adicione guias em 152px de cada lado');
console.log('   - Coloque seu logo na área central (720x720px)');
console.log('   - Redimensione o logo para ~500-600px');
console.log('   - Centralize perfeitamente');
console.log('');
console.log('6. 💾 SALVAR:');
console.log('   - Salve como "adaptive-icon.png"');
console.log('   - Coloque na pasta ./assets/');
console.log('   - Substitua o arquivo existente se houver');
console.log('');
console.log('🚀 Após criar o ícone, execute:');
console.log('   npx eas build --platform android --profile preview');
console.log('');
console.log('📱 Teste no dispositivo para verificar o resultado!');

// Verificar configuração atual
console.log('');
console.log('🔧 Configuração atual do app.json:');
try {
  const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
  const androidConfig = appJson.expo.android;
  
  console.log('   - Background do adaptive icon:', androidConfig.adaptiveIcon?.backgroundColor || 'Não definido');
  console.log('   - Imagem do adaptive icon:', androidConfig.adaptiveIcon?.foregroundImage || 'Não definido');
  console.log('   - Background do splash:', androidConfig.splash?.backgroundColor || 'Não definido');
  
} catch (error) {
  console.error('❌ Erro ao ler app.json:', error.message);
}

console.log('');
console.log('✅ Script executado com sucesso!');
console.log('   Siga as instruções acima para criar um ícone adequado.');