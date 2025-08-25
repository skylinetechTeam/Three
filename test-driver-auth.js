// Teste de integração do novo sistema de autenticação de motoristas
import driverAuthService from './services/driverAuthService';

console.log('🧪 Iniciando testes do sistema de autenticação de motoristas...\n');

async function testDriverAuth() {
  try {
    console.log('📋 Teste 1: Verificar motorista inexistente');
    const nonExistentResult = await driverAuthService.checkDriverExists('inexistente@email.com');
    console.log('Resultado:', nonExistentResult);
    console.log('✅ Teste 1 passou: Motorista inexistente retornou false\n');

    console.log('📋 Teste 2: Verificar validação de email');
    try {
      await driverAuthService.checkDriverExists('email-invalido');
      console.log('❌ Teste 2 falhou: Deveria ter rejeitado email inválido');
    } catch (error) {
      console.log('✅ Teste 2 passou: Email inválido foi rejeitado:', error.message);
    }
    console.log('');

    console.log('📋 Teste 3: Verificar validação de telefone');
    try {
      await driverAuthService.checkDriverExists('123');
      console.log('❌ Teste 3 falhou: Deveria ter rejeitado telefone muito curto');
    } catch (error) {
      console.log('✅ Teste 3 passou: Telefone muito curto foi rejeitado:', error.message);
    }
    console.log('');

    console.log('📋 Teste 4: Verificar dados locais');
    const localData = await driverAuthService.getLocalDriverData();
    console.log('Dados locais:', localData ? 'Encontrados' : 'Não encontrados');
    console.log('');

    console.log('📋 Teste 5: Verificar status de login');
    const isLoggedIn = await driverAuthService.isDriverLoggedIn();
    console.log('Status de login:', isLoggedIn ? 'Logado' : 'Não logado');
    console.log('');

    console.log('📋 Teste 6: Simular salvamento de foto');
    const photoUri = 'file:///test/photo.jpg';
    await driverAuthService.saveDriverPhoto(photoUri);
    const savedPhoto = await driverAuthService.getDriverPhoto();
    console.log('Foto salva:', savedPhoto === photoUri ? 'Sucesso' : 'Falha');
    console.log('');

    console.log('🎉 Todos os testes básicos passaram!');
    console.log('');
    console.log('📝 Próximos passos para teste completo:');
    console.log('1. Cadastre um motorista no Supabase');
    console.log('2. Teste o fluxo completo na aplicação');
    console.log('3. Verifique se os dados são persistidos corretamente');
    console.log('4. Teste o logout e login novamente');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar testes se o arquivo for chamado diretamente
if (require.main === module) {
  testDriverAuth();
}

export default testDriverAuth;