#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 EAS Update Helper');
console.log('Este script ajuda você a publicar atualizações over-the-air (OTA) para seu app.');
console.log('');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  try {
    console.log('Escolha o canal para publicar a atualização:');
    console.log('1. Development (desenvolvimento)');
    console.log('2. Preview (pré-visualização)');
    console.log('3. Production (produção)');
    console.log('');

    const choice = await question('Digite sua escolha (1-3): ');
    
    let channel;
    let command;
    
    switch (choice) {
      case '1':
        channel = 'development';
        command = 'npm run update:dev';
        break;
      case '2':
        channel = 'preview';
        command = 'npm run update:preview';
        break;
      case '3':
        channel = 'production';
        command = 'npm run update:prod';
        break;
      default:
        console.log('❌ Escolha inválida!');
        rl.close();
        return;
    }

    const message = await question(`Digite uma mensagem para a atualização (${channel}): `);
    
    console.log('');
    console.log(`📦 Publicando atualização para o canal "${channel}"...`);
    console.log(`💬 Mensagem: ${message}`);
    console.log('');
    
    const fullCommand = `${command} --message "${message}"`;
    console.log(`Executando: ${fullCommand}`);
    console.log('');
    
    execSync(fullCommand, { stdio: 'inherit' });
    
    console.log('');
    console.log('✅ Atualização publicada com sucesso!');
    console.log('');
    console.log('📱 Os usuários com o app instalado receberão a atualização automaticamente.');
    console.log('⚡ A atualização será aplicada na próxima abertura do app ou quando verificarem manualmente.');
    
  } catch (error) {
    console.error('❌ Erro ao publicar atualização:', error.message);
  } finally {
    rl.close();
  }
}

main();