#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando API do aplicativo de corridas...\n');

// Caminho para o servidor da API
const apiPath = path.join(__dirname, 'api');
const serverFile = path.join(apiPath, 'server.js');

// Verificar se o arquivo do servidor existe
if (!fs.existsSync(serverFile)) {
  console.error('❌ Erro: Arquivo server.js não encontrado em:', serverFile);
  console.error('   Certifique-se de que a estrutura do projeto está correta.');
  process.exit(1);
}

// Verificar se o package.json existe na pasta api
const packagePath = path.join(apiPath, 'package.json');
if (!fs.existsSync(packagePath)) {
  console.error('❌ Erro: package.json não encontrado em:', packagePath);
  console.error('   Execute "npm init" na pasta api primeiro.');
  process.exit(1);
}

// Configurar o processo do servidor
const serverProcess = spawn('node', ['server.js'], {
  cwd: apiPath,
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

// Configurar encoding para UTF-8
if (serverProcess.stdout) {
  serverProcess.stdout.setEncoding('utf8');
}
if (serverProcess.stderr) {
  serverProcess.stderr.setEncoding('utf8');
}

console.log('📡 Servidor da API iniciado com PID:', serverProcess.pid);
console.log('🔗 Pasta da API:', apiPath);
console.log('📄 Arquivo do servidor:', serverFile);
console.log('─'.repeat(50));

// Capturar saída do servidor
serverProcess.stdout?.on('data', (data) => {
  process.stdout.write(data);
});

// Capturar erros do servidor
serverProcess.stderr?.on('data', (data) => {
  process.stderr.write(data);
});

// Lidar com encerramento do processo
serverProcess.on('close', (code) => {
  console.log('\n─'.repeat(50));
  if (code === 0) {
    console.log('✅ Servidor encerrado normalmente');
  } else {
    console.log(`❌ Servidor encerrado com código de erro: ${code}`);
  }
  process.exit(code);
});

// Lidar com erros de spawn
serverProcess.on('error', (err) => {
  console.error('\n❌ Erro ao iniciar o servidor:', err.message);
  
  if (err.code === 'ENOENT') {
    console.error('   Node.js não foi encontrado. Certifique-se de que está instalado.');
  }
  
  process.exit(1);
});

// Lidar com sinais de interrupção
process.on('SIGINT', () => {
  console.log('\n🛑 Recebido sinal de interrupção. Encerrando servidor...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido sinal de término. Encerrando servidor...');
  serverProcess.kill('SIGTERM');
});

// Mostrar instruções
console.log('\n💡 Instruções:');
console.log('   • Pressione Ctrl+C para encerrar o servidor');
console.log('   • O servidor será iniciado automaticamente');
console.log('   • Logs aparecerão abaixo desta linha');
console.log('─'.repeat(50));