// Serviço de email via EmailJS usando método direto
// Requer EmailJS carregado globalmente ou importado

let EMAILJS_CONFIG = null;
let emailjs = null;

try {
  EMAILJS_CONFIG = require('../email.config.js').EMAILJS;
  // Tenta importar emailjs (pode não estar disponível em React Native)
  // Usar método fetch como fallback
} catch (e) {
  // sem config
}

export async function sendResetCodeEmail(toEmail, code, name = '') {
  console.log('🚀 EMAILSERVICE: Função chamada!', { toEmail, code, name });
  
  console.log('🔍 EMAILSERVICE: Verificando EMAILJS_CONFIG...', !!EMAILJS_CONFIG);
  if (!EMAILJS_CONFIG) {
    console.log('❌ EmailJS: Arquivo email.config.js não encontrado');
    return false;
  }

  console.log('🔍 EMAILSERVICE: Config encontrada:', {
    SERVICE_ID: EMAILJS_CONFIG.SERVICE_ID,
    TEMPLATE_ID: EMAILJS_CONFIG.TEMPLATE_ID, 
    PUBLIC_KEY: EMAILJS_CONFIG.PUBLIC_KEY ? 'OK' : 'VAZIO'
  });
  
  // Validar configuração completa
  if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID || !EMAILJS_CONFIG.PUBLIC_KEY) {
    console.log('❌ EmailJS: Configuração incompleta');
    console.log('SERVICE_ID:', EMAILJS_CONFIG.SERVICE_ID);
    console.log('TEMPLATE_ID:', EMAILJS_CONFIG.TEMPLATE_ID);
    console.log('PUBLIC_KEY:', EMAILJS_CONFIG.PUBLIC_KEY);
    return false;
  }

  try {
    console.log('📤 EmailJS: Tentativa de envio para:', toEmail, 'Código:', code);
    
    // Usar formato JSON direto como a documentação oficial
    const payload = {
      service_id: EMAILJS_CONFIG.SERVICE_ID,
      template_id: EMAILJS_CONFIG.TEMPLATE_ID,
      user_id: EMAILJS_CONFIG.PUBLIC_KEY,
      template_params: {
        code: code,
        email: toEmail,
        to_name: name || 'Usuário'
      }
    };
    
    console.log('📤 EmailJS: Payload JSON:');
    console.log(JSON.stringify(payload, null, 2));

    // Usar JSON como a documentação oficial
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📤 EmailJS: Status HTTP:', response.status);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log('📤 EmailJS: Resposta:', responseText);
      
      if (responseText.trim() === 'OK') {
        console.log('✅ EmailJS: SUCESSO! Email enviado.');
        return true;
      } else {
        console.log('⚠️ EmailJS: Resposta inesperada:', responseText);
        // Mesmo assim, pode ter funcionado
        return true;
      }
    } else {
      const errorText = await response.text();
      console.error('❌ EmailJS: Erro HTTP', response.status);
      console.error('❌ EmailJS: Detalhes:', errorText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ EmailJS: Exceção:', error.message);
    return false;
  }
}
