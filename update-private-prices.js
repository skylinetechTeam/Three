/**
 * Script para atualizar os preços base do táxi privado no Supabase
 * Execute: node update-private-prices.js
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const supabaseUrl = "https://fplfizngqozlnxkzevyg.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbGZpem5ncW96bG54a3pldnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzE3NTYsImV4cCI6MjA2ODk0Nzc1Nn0.jTkKTHIrk8mmmU-gUTrs_gPkyC5D-xsZWTO363yGbfE";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Mostra todos os preços atuais
 */
async function showAllPrices() {
  console.log('\n📊 PREÇOS ATUAIS DO TÁXI PRIVADO\n');
  console.log('═'.repeat(60));
  
  const { data, error } = await supabase
    .from('private_base_price')
    .select('*')
    .order('id');

  if (error) {
    console.error('❌ Error fetching prices:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Nenhum preço encontrado na tabela.');
    return;
  }

  data.forEach((item, index) => {
    const status = item.is_active ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${item.price_type.toUpperCase()}`);
    console.log(`   Preço: ${item.base_price} Kz`);
    console.log(`   Descrição: ${item.description}`);
    console.log(`   Atualizado: ${new Date(item.updated_at).toLocaleString('pt-PT')}`);
    console.log('─'.repeat(60));
  });
}

/**
 * Atualiza um preço específico
 */
async function updatePrice() {
  console.log('\n💰 ATUALIZAR PREÇO BASE\n');
  
  const priceTypes = {
    '1': 'normal',
    '2': 'peak_hours',
    '3': 'end_of_month',
    '4': 'end_of_year',
    '5': 'weekend',
    '6': 'night'
  };

  console.log('Escolha o tipo de preço:');
  console.log('1. Normal');
  console.log('2. Horas de pico (7h-9h e 17h-19h)');
  console.log('3. Fim do mês (últimos 5 dias)');
  console.log('4. Fim de ano (dezembro)');
  console.log('5. Fim de semana');
  console.log('6. Período noturno (22h-6h)');
  
  const choice = await question('\nEscolha (1-6): ');
  const priceType = priceTypes[choice];

  if (!priceType) {
    console.log('❌ Opção inválida!');
    return;
  }

  const newPrice = await question('Digite o novo preço base (em Kz): ');
  const priceValue = parseFloat(newPrice);

  if (isNaN(priceValue) || priceValue <= 0) {
    console.log('❌ Preço inválido!');
    return;
  }

  console.log(`\n⚠️  Confirmar atualização:`);
  console.log(`   Tipo: ${priceType}`);
  console.log(`   Novo preço: ${priceValue} Kz`);
  
  const confirm = await question('\nConfirmar? (s/n): ');
  
  if (confirm.toLowerCase() !== 's') {
    console.log('❌ Operação cancelada.');
    return;
  }

  const { error } = await supabase
    .from('private_base_price')
    .update({ base_price: priceValue })
    .eq('price_type', priceType);

  if (error) {
    console.error('❌ Error updating price:', error.message);
    return;
  }

  console.log(`✅ Preço atualizado com sucesso!`);
  console.log(`   ${priceType} → ${priceValue} Kz`);
}

/**
 * Mostra o preço ativo no momento
 */
async function showCurrentActivePrice() {
  console.log('\n🕐 PREÇO ATIVO NO MOMENTO\n');
  console.log('═'.repeat(60));

  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const dayOfMonth = now.getDate();
  const month = now.getMonth();
  const daysInMonth = new Date(now.getFullYear(), month + 1, 0).getDate();

  console.log(`📅 Data/Hora atual: ${now.toLocaleString('pt-PT')}`);
  console.log('');

  const priceType = (() => {
    if (month === 11) return 'end_of_year';
    if (dayOfMonth > daysInMonth - 5) return 'end_of_month';
    if (hour >= 22 || hour < 6) return 'night';
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) return 'peak_hours';
    if (day === 0 || day === 6) return 'weekend';
    return 'normal';
  })();

  const { data, error } = await supabase
    .from('private_base_price')
    .select('*')
    .eq('price_type', priceType)
    .single();

  if (error) {
    console.error('❌ Error fetching current price:', error.message);
    return;
  }

  console.log(`🎯 Tipo de preço ativo: ${priceType.toUpperCase()}`);
  console.log(`💰 Preço base atual: ${data.base_price} Kz`);
  console.log(`📝 Descrição: ${data.description}`);
  console.log(`✅ Status: ${data.is_active ? 'Ativo' : 'Inativo'}`);
  console.log('═'.repeat(60));
}

/**
 * Menu principal
 */
async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     GERENCIADOR DE PREÇOS BASE - TÁXI PRIVADO             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  while (true) {
    console.log('\n📋 MENU:\n');
    console.log('1. Ver todos os preços');
    console.log('2. Atualizar um preço');
    console.log('3. Ver preço ativo no momento');
    console.log('4. Sair');
    
    const option = await question('\nEscolha uma opção (1-4): ');

    switch (option) {
      case '1':
        await showAllPrices();
        break;
      case '2':
        await updatePrice();
        break;
      case '3':
        await showCurrentActivePrice();
        break;
      case '4':
        console.log('\n👋 Até logo!\n');
        rl.close();
        return;
      default:
        console.log('\n❌ Opção inválida! Tente novamente.');
    }

    await question('\nPressione Enter para continuar...');
    console.clear();
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     GERENCIADOR DE PREÇOS BASE - TÁXI PRIVADO             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
  }
}

// Executar script
main().catch(console.error);
