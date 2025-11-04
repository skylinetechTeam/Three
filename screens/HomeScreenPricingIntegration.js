// Integração da precificação competitiva no HomeScreen
// Adicione este código ao seu HomeScreen.js

import PricingHelper from './PricingHelper';

// Adicionar estas variáveis de estado no HomeScreen component
const [yangoPrice, setYangoPrice] = useState(''); // Campo opcional para preço da Yango
const [competitivePrice, setCompetitivePrice] = useState(null); // Preço competitivo calculado
const [originalEstimation, setOriginalEstimation] = useState(null); // Estimativa original

// Modificar sua função de cálculo de estimativa existente
const calculateEstimation = async (origin, destination, selectedTaxiType) => {
  try {
    console.log('🧮 Calculando estimativa...');
    
    // ... seu código existente de cálculo ...
    
    // Depois do cálculo original (onde você tem estimatedFare = 21200)
    const originalFare = estimatedFare; // Salvar preço original
    
    // Aplicar precificação competitiva
    const yangoValue = yangoPrice ? parseInt(yangoPrice.replace(/[^0-9]/g, '')) : null;
    const competitivePricing = PricingHelper.calculateCompetitivePrice(
      originalFare,
      yangoValue, // Preço da Yango se fornecido
      vehicleType, // Mapeado (privado, standard, etc)
      distanceInKm
    );
    
    // Usar preço competitivo como preço final
    const finalEstimation = {
      ...estimation, // Seus dados existentes
      originalFare: originalFare,
      estimatedFare: competitivePricing.finalPrice, // Preço competitivo
      competitiveData: competitivePricing,
      displayPrice: PricingHelper.formatPrice(competitivePricing.finalPrice)
    };
    
    console.log('💰 [INTEGRATION] Preço original:', originalFare, 'AOA');
    console.log('💰 [INTEGRATION] Preço competitivo:', competitivePricing.finalPrice, 'AOA');
    console.log('💰 [INTEGRATION] Economia:', competitivePricing.savings, 'AOA');
    
    // Atualizar estados
    setOriginalEstimation(estimation);
    setCompetitivePrice(competitivePricing);
    setEstimation(finalEstimation);
    
    return finalEstimation;
    
  } catch (error) {
    console.error('❌ Erro no cálculo de estimativa:', error);
    throw error;
  }
};

// Função para atualizar preço quando usuário digitar preço da Yango
const handleYangoPriceChange = (text) => {
  const numericValue = text.replace(/[^0-9]/g, '');
  if (numericValue) {
    const formattedValue = parseInt(numericValue).toLocaleString() + ' AOA';
    setYangoPrice(formattedValue);
    
    // Recalcular preço competitivo se já temos uma estimativa
    if (originalEstimation) {
      const newCompetitive = PricingHelper.calculateCompetitivePrice(
        originalEstimation.estimatedFare,
        parseInt(numericValue),
        vehicleType,
        originalEstimation.distanceInKm
      );
      
      setCompetitivePrice(newCompetitive);
      
      // Atualizar estimativa com novo preço
      const updatedEstimation = {
        ...originalEstimation,
        estimatedFare: newCompetitive.finalPrice,
        competitiveData: newCompetitive,
        displayPrice: PricingHelper.formatPrice(newCompetitive.finalPrice)
      };
      
      setEstimation(updatedEstimation);
    }
  } else {
    setYangoPrice('');
  }
};

// Componente para mostrar comparação de preços (adicionar ao JSX)
const CompetitivePriceDisplay = () => {
  if (!competitivePrice) return null;
  
  return (
    <View style={styles.competitivePricing}>
      <Text style={styles.competitiveTitle}>💰 Preço Competitivo</Text>
      
      {/* Campo opcional para preço da Yango */}
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
      
      {/* Comparação de preços */}
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
  );
};

// Estilos para adicionar ao StyleSheet
const competitivePricingStyles = StyleSheet.create({
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

// No JSX do HomeScreen, adicionar o componente onde você mostra a estimativa:
// <CompetitivePriceDisplay />

export default {
  // Funções para exportar
  calculateEstimation,
  handleYangoPriceChange,
  CompetitivePriceDisplay,
  competitivePricingStyles
};