# Integração de Preços Dinâmicos com Supabase ✅

## 📋 Resumo das Alterações

O sistema de precificação foi atualizado para buscar preços **em tempo real** diretamente do Supabase, eliminando caches e valores hardcoded.

---

## 🔧 Alterações Realizadas

### 1. **placesService.js** - Cache Desabilitado
**Arquivo:** `services/placesService.js`

- ✅ `CACHE_EXPIRATION` definido como `0` (linha 5)
- ✅ Verificações de cache comentadas/desabilitadas
- ✅ Busca sempre dados atualizados, sem cache de 5 minutos

```javascript
// Cache desabilitado - sempre buscar preço atualizado
const CACHE_EXPIRATION = 0;
```

---

### 2. **apiService.js** - Novo Método Assíncrono
**Arquivo:** `services/apiService.js`

**Método Antigo (DEPRECATED):**
```javascript
calculateEstimatedFare(distance, time, vehicleType)
// ❌ Usava valores hardcoded (2500 AOA base)
```

**Método Novo (RECOMENDADO):**
```javascript
async calculateEstimatedFareAsync(distance, time, vehicleType)
// ✅ Busca preço base do Supabase em tempo real
// ✅ Aplica cálculo: basePrice + (distance * 300) + (time * 50)
```

**Integração:**
- Importa `privateBasePriceService` dinamicamente
- Chama `getCurrentBasePrice()` para obter preço base atual
- Aplica multiplicadores de distância e tempo
- Retorna preço final calculado

---

### 3. **HomeScreen.js** - Atualização da Chamada
**Arquivo:** `screens/HomeScreen.js`

**Antes (linha 2121):**
```javascript
const originalFare = apiService.calculateEstimatedFare(distanceInKm, timeInMinutes, vehicleType);
```

**Depois (linha 2121):**
```javascript
const originalFare = await apiService.calculateEstimatedFareAsync(distanceInKm, timeInMinutes, vehicleType);
```

---

### 4. **TaxiSelectionModal.js** - Comentários Adicionados
**Arquivo:** `components/HomeScreenModals/TaxiSelectionModal.js`

- ✅ Documentação clara de que o preço é calculado em tempo real
- ✅ Sem cache - recalculado a cada renderização
- ✅ Recalculado no momento da seleção da zona

---

## 📊 Fluxo de Cálculo de Preço

```
1. Passageiro seleciona destino
   ↓
2. HomeScreen calcula distância e tempo
   ↓
3. apiService.calculateEstimatedFareAsync() é chamado
   ↓
4. privateBasePriceService.getCurrentBasePrice() busca do Supabase
   ↓
5. Determina tipo de preço (normal, peak_hours, night, etc.)
   ↓
6. Retorna basePrice da tabela private_base_price
   ↓
7. Aplica fórmula: basePrice + (km * 300) + (min * 50)
   ↓
8. PricingHelper aplica descontos competitivos
   ↓
9. Preço final exibido na TripConfirmationModal
```

---

## 🎯 Tipos de Preço no Supabase

A tabela `private_base_price` contém os seguintes tipos:

| Tipo | Descrição | Prioridade |
|------|-----------|------------|
| `normal` | Preço padrão | 6 (menor) |
| `peak_hours` | Horário de pico (7h-9h, 17h-19h) | 4 |
| `weekend` | Fins de semana | 5 |
| `night` | Período noturno (22h-6h) | 3 |
| `end_of_month` | Últimos 5 dias do mês | 2 |
| `end_of_year` | Todo mês de dezembro | 1 (maior) |

**Lógica de Prioridade:**
- A prioridade mais alta (1) sobrepõe todas as outras
- Se dezembro (end_of_year), ignora todas as outras condições
- Se fim de mês, ignora peak_hours, weekend, night

---

## 🧪 Como Testar

### Teste 1: Executar Script de Teste
```bash
node test_supabase_pricing.js
```

Este script:
- ✅ Testa cálculo de preço para diferentes distâncias
- ✅ Verifica busca do Supabase
- ✅ Compara método antigo vs novo
- ✅ Exibe informações detalhadas de preço

### Teste 2: No App (Manual)
1. Abra o app no dispositivo/emulador
2. Selecione um destino
3. Observe os logs do console:
   - `💰 [PRICING] Calculando preço com dados do Supabase...`
   - `💲 [PRICING] Preço base do Supabase: XXXX AOA`
   - `✅ [PRICING] Preço final: XXXX AOA`

### Teste 3: Verificar Modal
1. Selecione uma zona/destino
2. Verifique se o modal de confirmação mostra o preço correto
3. O preço deve:
   - ✅ Refletir o horário atual (peak, night, etc.)
   - ✅ Incluir descontos competitivos
   - ✅ Ser diferente do valor fixo anterior (2500 AOA)

---

## 📝 Exemplo de Cálculo

**Cenário:** Corrida de 10km, 20 minutos, às 18h em um dia útil

```
1. privateBasePriceService.determinePriceType() → "peak_hours"
2. Busca no Supabase: basePrice = 3000 AOA (exemplo)
3. Cálculo:
   - Base: 3000 AOA
   - Distância: 10km × 300 = 3000 AOA
   - Tempo: 20min × 50 = 1000 AOA
   - Total: 3000 + 3000 + 1000 = 7000 AOA
4. PricingHelper aplica desconto de 20%:
   - Final: 7000 × 0.8 = 5600 AOA
```

---

## ⚠️ Importante

### Fallback em Caso de Erro
Se houver erro ao buscar do Supabase:
- O método retorna ao cálculo com valores fixos (2500 AOA)
- Um aviso é logado no console
- A corrida continua normalmente

### Performance
- Busca do Supabase é rápida (~100-300ms)
- Não bloqueia a UI
- Executa de forma assíncrona

### Logs
Todos os cálculos são logados com emoji para fácil identificação:
- 💰 `[PRICING]` - Cálculo de preço
- 💲 `[PRICING]` - Preço do Supabase
- 📊 `[PRICING]` - Detalhes do cálculo
- ✅ `[PRICING]` - Resultado final

---

## 🚀 Próximos Passos (Opcional)

1. **Cache Inteligente**
   - Cachear preço base por 1-2 minutos
   - Reduz chamadas ao Supabase sem comprometer atualização

2. **Integração com Yango**
   - Buscar preços da Yango via API
   - Garantir sempre 10-15% mais barato

3. **Histórico de Preços**
   - Salvar histórico de preços calculados
   - Analytics de variação de preços

4. **Testes Automatizados**
   - Unit tests para cálculo de preço
   - Integration tests com Supabase

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do console
2. Execute o script de teste
3. Verifique a conexão com Supabase
4. Confirme que a tabela `private_base_price` existe e tem dados

---

**Última atualização:** 2025-10-13
**Autor:** AI Agent Mode (Claude 4.5 Sonnet)
