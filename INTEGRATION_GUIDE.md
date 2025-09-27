# 🔧 Guia de Integração - Precificação Competitiva

## 🎯 Objetivo
Integrar a precificação competitiva no HomeScreen existente, fazendo seu app cobrar **15.752 AOA** ao invés de **21.200 AOA** quando a Yango cobra **17.900 AOA**.

## 📊 Resultado Esperado
```
Situação atual:
• Seu app: 21.200 AOA
• Yango: 17.900 AOA
• ❌ Vocês estão 18% mais caros

Após integração:
• Seu app: 15.752 AOA ✅
• Yango: 17.900 AOA
• ✅ Vocês ficam 12% mais baratos!
```

## 🛠️ Passos de Integração

### Passo 1: Copiar Arquivos
```bash
# Copiar o helper de precificação
# Coloque PricingHelper.js na pasta screens/
```

### Passo 2: Modificar HomeScreen.js

#### A. Importar o helper no topo do arquivo:
```javascript
// No topo do HomeScreen.js, adicionar:
import PricingHelper from './PricingHelper';
```

#### B. Adicionar novos estados:
```javascript
// Adicionar junto com seus outros useState:
const [yangoPrice, setYangoPrice] = useState(''); // Campo opcional para preço da Yango
const [competitivePrice, setCompetitivePrice] = useState(null); // Preço competitivo calculado
const [originalEstimation, setOriginalEstimation] = useState(null); // Estimativa original
```

#### C. Modificar função de cálculo de estimativa:

**Encontre esta parte do seu código (aproximadamente linha 2104):**
```javascript
💰 Tarifa calculada privado: 21200 AOA
```

**E modifique para:**
```javascript
// Seu cálculo existente (que resulta em 21200)
const originalFare = estimatedFare; // Salvar preço original

console.log('💰 Tarifa original calculada:', originalFare, 'AOA');

// NOVO: Aplicar precificação competitiva
const yangoValue = yangoPrice ? parseInt(yangoPrice.replace(/[^0-9]/g, '')) : null;
const competitivePricing = PricingHelper.calculateCompetitivePrice(
  originalFare,           // 21200
  yangoValue,            // 17900 se fornecido pelo usuário
  vehicleType,           // 'privado'
  distanceInKm          // 100
);

// Usar preço competitivo como preço final
const finalFare = competitivePricing.finalPrice;

console.log('💰 Tarifa competitiva aplicada:', finalFare, 'AOA');
console.log('💰 Economia vs preço original:', competitivePricing.savings, 'AOA');

// Atualizar sua variável estimatedFare
estimatedFare = finalFare;

// Salvar dados para interface
setCompetitivePrice(competitivePricing);
setOriginalEstimation({
  originalFare,
  distanceInKm,
  vehicleType
});
```

#### D. Adicionar função para campo da Yango:
```javascript
// Adicionar esta função no seu componente:
const handleYangoPriceChange = (text) => {
  const numericValue = text.replace(/[^0-9]/g, '');
  if (numericValue) {
    const formattedValue = parseInt(numericValue).toLocaleString() + ' AOA';
    setYangoPrice(formattedValue);
    
    // Se já temos estimativa, recalcular
    if (originalEstimation) {
      const newCompetitive = PricingHelper.calculateCompetitivePrice(
        originalEstimation.originalFare,
        parseInt(numericValue),
        originalEstimation.vehicleType,
        originalEstimation.distanceInKm
      );
      
      setCompetitivePrice(newCompetitive);
      
      // Atualizar preço na tela
      setEstimation(prev => ({
        ...prev,
        estimatedFare: newCompetitive.finalPrice,
        displayPrice: PricingHelper.formatPrice(newCompetitive.finalPrice)
      }));
    }
  } else {
    setYangoPrice('');
  }
};
```

### Passo 3: Adicionar Interface Visual

**Encontre onde você mostra o preço da estimativa no JSX e adicione antes ou depois:**

```jsx
{/* Comparação de Preços Competitivos */}
{competitivePrice && (
  <View style={styles.competitivePricing}>
    <Text style={styles.competitiveTitle}>💰 Preço Competitivo</Text>
    
    {/* Campo para preço da Yango */}
    <View style={styles.yangoInputContainer}>
      <Text style={styles.yangoInputLabel}>
        🏆 Preço da Yango (opcional):
      </Text>
      <TextInput
        style={styles.yangoInput}
        placeholder="Ex: 17900 AOA"
        value={yangoPrice}
        onChangeText={handleYangoPriceChange}
        keyboardType="numeric"
      />
    </View>
    
    {/* Comparação */}
    <View style={styles.priceComparison}>
      {competitivePrice.yangoPrice && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Yango:</Text>
          <Text style={styles.yangoPrice}>
            {PricingHelper.formatPrice(competitivePrice.yangoPrice)}
          </Text>
        </View>
      )}
      
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Preço original:</Text>
        <Text style={[styles.originalPrice, competitivePrice.savings > 0 && styles.strikethrough]}>
          {PricingHelper.formatPrice(competitivePrice.originalPrice)}
        </Text>
      </View>
      
      <View style={[styles.priceRow, styles.finalPriceRow]}>
        <Text style={styles.finalPriceLabel}>Nosso preço:</Text>
        <Text style={styles.finalPrice}>
          {PricingHelper.formatPrice(competitivePrice.finalPrice)}
        </Text>
      </View>
      
      {competitivePrice.savings > 0 && (
        <View style={styles.savingsRow}>
          <Text style={styles.savingsText}>
            🎉 Você economiza: {PricingHelper.formatPrice(competitivePrice.savings)}
            {competitivePrice.yangoPrice && ` (${competitivePrice.yangoComparison.percentage}% vs Yango)`}
          </Text>
        </View>
      )}
    </View>
    
    {competitivePrice.isCompetitive && (
      <View style={styles.competitiveIndicator}>
        <Text style={styles.competitiveText}>
          ✅ Mais barato que a concorrência!
        </Text>
      </View>
    )}
  </View>
)}
```

### Passo 4: Adicionar Estilos

**No seu StyleSheet, adicionar:**

```javascript
const styles = StyleSheet.create({
  // ... seus estilos existentes ...
  
  // Novos estilos para precificação competitiva
  competitivePricing: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  
  competitiveTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 12,
    textAlign: 'center',
  },
  
  yangoInputContainer: {
    marginBottom: 16,
  },
  
  yangoInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  
  yangoInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  
  priceComparison: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  
  finalPriceRow: {
    backgroundColor: '#d4edda',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  
  finalPriceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
  },
  
  yangoPrice: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '500',
  },
  
  originalPrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  
  finalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#155724',
  },
  
  savingsRow: {
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  
  savingsText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '600',
  },
  
  competitiveIndicator: {
    backgroundColor: '#d1ecf1',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  
  competitiveText: {
    fontSize: 12,
    color: '#0c5460',
    fontWeight: '600',
  },
});
```

## 🧪 Teste da Integração

1. **Abra o app e solicite estimativa para a rota de 100km**
2. **Deve mostrar preço competitivo automaticamente** (aprox. 18.020 AOA ao invés de 21.200)
3. **Digite 17900 no campo "Preço da Yango"**
4. **Deve recalcular para 15.752 AOA** (12% mais barato que Yango)
5. **Deve mostrar "Você economiza 2.148 AOA vs Yango"**

## 📊 Resultados Esperados

### Sem preço da Yango informado:
- Preço original: 21.200 AOA
- Preço competitivo: ~18.020 AOA (15% desconto automático)
- Economia: ~3.180 AOA

### Com preço da Yango (17.900 AOA):
- Preço original: 21.200 AOA
- Preço Yango: 17.900 AOA
- Nosso preço: 15.752 AOA
- Economia vs original: 5.448 AOA
- Economia vs Yango: 2.148 AOA (12% mais barato)

## ✅ Verificação Final

Após integração, seus logs devem mostrar:
```
💰 Tarifa original calculada: 21200 AOA
💰 [PRICING] Calculando preço competitivo...
💰 [PRICING] Preço original: 21200 AOA
💰 [PRICING] Preço Yango: 17900 AOA
💰 [PRICING] Aplicando desconto vs Yango: 12%
💰 [PRICING] Preço final: 15752 AOA
💰 Tarifa competitiva aplicada: 15752 AOA
💰 Economia vs preço original: 5448 AOA
```

**🎉 Pronto! Agora seu app será sempre mais barato que a Yango!**