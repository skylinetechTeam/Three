# 💰 Sistema de Preço Base Dinâmico - Táxi Privado

## 📋 Visão Geral

Sistema simples para gerenciar o **preço base do táxi privado** através do Supabase, permitindo alterar os valores sem mexer no código. O preço é automaticamente ajustado baseado na data/hora atual.

> **Nota:** O táxi coletivo continua fixo em 500 Kz e não é gerenciado por este sistema.

---

## 🗂️ Arquivos Criados

### 1. `database/private_base_price_table.sql`
Script SQL para criar a tabela no Supabase com os preços configuráveis.

### 2. `services/privateBasePriceService.js`
Serviço JavaScript que busca automaticamente o preço correto do Supabase baseado na data/hora.

### 3. `update-private-prices.js`
Script interativo para visualizar e atualizar os preços diretamente no terminal.

---

## 🚀 Como Configurar

### Passo 1: Criar a Tabela no Supabase

1. Acesse o **SQL Editor** do seu projeto Supabase
2. Copie todo o conteúdo de `database/private_base_price_table.sql`
3. Execute o script
4. Verifique se a tabela foi criada com sucesso

A tabela terá **6 tipos de preços**:

| Tipo de Preço | Preço Padrão | Quando Aplica |
|---------------|--------------|---------------|
| `normal` | 500 Kz | Horário normal (padrão) |
| `peak_hours` | 700 Kz | Horas de pico (7h-9h e 17h-19h) |
| `end_of_month` | 650 Kz | Últimos 5 dias do mês |
| `end_of_year` | 800 Kz | Todo mês de dezembro |
| `weekend` | 550 Kz | Fins de semana (sábado e domingo) |
| `night` | 600 Kz | Período noturno (22h-6h) |

### Passo 2: Verificar a Conexão

A conexão com Supabase já está configurada em `supabaseClient.js`.

---

## 💻 Como Usar no Código

### Importar o Serviço

```javascript
import privateBasePriceService from '../services/privateBasePriceService';
```

### Buscar o Preço Base Atual

```javascript
// Busca automaticamente o preço correto baseado na data/hora atual
const basePrice = await privateBasePriceService.getCurrentBasePrice();
console.log(`Preço base atual: ${basePrice} Kz`);
```

### Exemplo Completo

```javascript
import privateBasePriceService from '../services/privateBasePriceService';

async function calculateRidePrice(distance, time) {
  // 1. Buscar preço base dinâmico do Supabase
  const basePrice = await privateBasePriceService.getCurrentBasePrice();
  
  // 2. Calcular preço total
  const totalPrice = basePrice + (distance * 150) + (time * 25);
  
  return {
    basePrice,
    totalPrice,
    breakdown: {
      base: basePrice,
      distance: distance * 150,
      time: time * 25
    }
  };
}

// Usar na aplicação
const price = await calculateRidePrice(5.2, 15);
console.log(`Preço total: ${price.totalPrice} Kz`);
```

### Verificar Qual Preço Está Ativo

```javascript
const info = await privateBasePriceService.getCurrentPriceInfo();
console.log(info);
// Output:
// {
//   currentDateTime: "2025-10-13T13:30:00.000Z",
//   priceType: "normal",
//   basePrice: 500,
//   description: "Preço normal"
// }
```

---

## 🛠️ Como Atualizar Preços

### Opção 1: Script Interativo (Recomendado)

Execute o script no terminal:

```bash
node update-private-prices.js
```

Menu do script:
```
╔════════════════════════════════════════════════════════════╗
║     GERENCIADOR DE PREÇOS BASE - TÁXI PRIVADO             ║
╚════════════════════════════════════════════════════════════╝

📋 MENU:

1. Ver todos os preços
2. Atualizar um preço
3. Ver preço ativo no momento
4. Sair

Escolha uma opção (1-4):
```

### Opção 2: Diretamente no Código

```javascript
import privateBasePriceService from './services/privateBasePriceService';

// Atualizar preço de fim de ano para 900 Kz
await privateBasePriceService.updatePrice('end_of_year', 900);

// Verificar o novo preço
const newPrice = await privateBasePriceService.getPriceByType('end_of_year');
console.log(`Novo preço: ${newPrice} Kz`);
```

### Opção 3: Diretamente no Supabase

1. Acesse o **Table Editor** no Supabase
2. Selecione a tabela `private_base_price`
3. Edite o campo `base_price` do tipo desejado
4. Salve as alterações

---

## 🎯 Lógica de Prioridade

O sistema aplica os preços na seguinte ordem de prioridade:

1. **Fim de ano** (dezembro) - Prioridade máxima
2. **Fim de mês** (últimos 5 dias)
3. **Período noturno** (22h-6h)
4. **Horas de pico** (7h-9h e 17h-19h)
5. **Fim de semana** (sábado e domingo)
6. **Normal** - Padrão para todos os outros casos

**Exemplo:** Se for dia 28 de dezembro às 8h:
- ✅ Aplica `end_of_year` (prioridade 1)
- ❌ Ignora `end_of_month` (prioridade 2)
- ❌ Ignora `peak_hours` (prioridade 4)

---

## 📊 Exemplo de Uso Real

### Cenário: Cliente solicita corrida

```javascript
// No componente de estimativa de preço
import privateBasePriceService from '../services/privateBasePriceService';

const EstimateScreen = () => {
  const [basePrice, setBasePrice] = useState(0);
  const [priceInfo, setPriceInfo] = useState(null);

  useEffect(() => {
    async function loadPrice() {
      // Buscar preço base atual
      const info = await privateBasePriceService.getCurrentPriceInfo();
      setBasePrice(info.basePrice);
      setPriceInfo(info);
    }
    loadPrice();
  }, []);

  return (
    <View>
      <Text>Preço base: {basePrice} Kz</Text>
      <Text>Tipo: {priceInfo?.description}</Text>
      {/* Resto do componente */}
    </View>
  );
};
```

---

## ✅ Vantagens do Sistema

- ✅ **Sem editar código** - Altere preços diretamente no Supabase
- ✅ **Automático** - Sistema detecta a data/hora e aplica o preço correto
- ✅ **Simples** - Apenas 6 tipos de preços fáceis de gerenciar
- ✅ **Flexível** - Pode adicionar novos tipos se necessário
- ✅ **Seguro** - Fallback para 500 Kz caso haja erro
- ✅ **Rápido** - Cache pode ser implementado se necessário

---

## 🔍 Estrutura da Tabela

```sql
CREATE TABLE private_base_price (
  id SERIAL PRIMARY KEY,
  price_type VARCHAR(50) UNIQUE NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Campos:**
- `id`: ID único
- `price_type`: Tipo do preço (normal, peak_hours, etc)
- `base_price`: Valor do preço base em Kz
- `description`: Descrição legível
- `is_active`: Se o preço está ativo (para desabilitar temporariamente)
- `updated_at`: Última atualização (atualizado automaticamente)

---

## 🧪 Testes

### Testar no Console

```javascript
import privateBasePriceService from './services/privateBasePriceService';

// Teste 1: Buscar preço atual
const current = await privateBasePriceService.getCurrentBasePrice();
console.log('Preço atual:', current);

// Teste 2: Ver informações completas
const info = await privateBasePriceService.getCurrentPriceInfo();
console.log('Info completa:', info);

// Teste 3: Ver todos os preços
const all = await privateBasePriceService.getAllPrices();
console.log('Todos os preços:', all);
```

---

## 🚨 Troubleshooting

### Erro: "Cannot connect to Supabase"
- Verifique se a tabela foi criada corretamente
- Confirme que o `supabaseClient.js` está com as credenciais corretas

### Erro: "Fallback price used"
- A tabela pode não ter o tipo de preço necessário
- Execute novamente o script SQL para inserir os dados padrão

### Preço não atualiza
- Limpe o cache do app (se implementado)
- Verifique se o campo `is_active` está como `true` na tabela

---

## 📝 Próximos Passos (Opcional)

1. **Implementar cache** - Reduzir chamadas ao Supabase
2. **Adicionar histórico** - Registrar mudanças de preços
3. **Dashboard admin** - Interface web para gerenciar preços
4. **Notificações** - Alertar quando preços são alterados

---

## 🎉 Pronto para Usar!

Agora você pode:
1. ✅ Executar o SQL no Supabase
2. ✅ Usar o serviço no seu código
3. ✅ Atualizar preços quando necessário sem mexer no código!

**Dúvidas?** Consulte os exemplos acima ou teste com o script interativo.
