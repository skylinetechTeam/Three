// INTEGRAÇÃO CORRETA - Aplicar no HomeScreen.js nas linhas 2119-2127

// 1. ADICIONAR IMPORT no topo do HomeScreen.js:
import PricingHelper from './PricingHelper';

// 2. ADICIONAR ESTADOS no início do componente HomeScreen:
const [yangoPrice, setYangoPrice] = useState(''); // Campo opcional para preço da Yango
const [competitivePrice, setCompetitivePrice] = useState(null); // Preço competitivo calculado

// 3. SUBSTITUIR o código das linhas 2119-2129 por:

      // CÓDIGO ORIGINAL:
      // const estimate = {
      //   distance: estimatedDistance,
      //   distanceText: routeInfo?.distanceText || `${distanceInKm.toFixed(1)} km`,
      //   time: estimatedTime,
      //   timeText: routeInfo?.durationText || `${timeInMin} min`,
      //   fare: estimatedFare,
      //   vehicleType: vehicleType,
      //   destination: selectedLocation
      // };

      // NOVO CÓDIGO COM PRECIFICAÇÃO COMPETITIVA:
      
      // Salvar preço original calculado
      const originalFare = estimatedFare;
      console.log('💰 Tarifa original calculada:', originalFare, 'AOA');

      // Aplicar precificação competitiva
      const yangoValue = yangoPrice ? parseInt(yangoPrice.replace(/[^0-9]/g, '')) : null;
      const competitivePricing = PricingHelper.calculateCompetitivePrice(
        originalFare,        // 21200 AOA (preço original)
        yangoValue,         // 17900 AOA se informado pelo usuário
        vehicleType,        // 'privado' ou 'coletivo'  
        distanceInKm        // 100 km
      );

      // Usar preço competitivo como preço final
      const finalFare = competitivePricing.finalPrice;
      console.log('💰 Tarifa competitiva aplicada:', finalFare, 'AOA');
      console.log('💰 Economia vs preço original:', competitivePricing.savings, 'AOA');
      
      if (competitivePricing.yangoComparison) {
        console.log('🏆 vs Yango:', competitivePricing.yangoComparison.savings, 'AOA mais barato');
      }

      // Criar objeto estimate com preço competitivo
      const estimate = {
        distance: estimatedDistance,
        distanceText: routeInfo?.distanceText || `${distanceInKm.toFixed(1)} km`,
        time: estimatedTime,
        timeText: routeInfo?.durationText || `${timeInMin} min`,
        fare: finalFare,                    // PREÇO COMPETITIVO (ex: 15752 ao invés de 21200)
        originalFare: originalFare,         // PREÇO ORIGINAL para referência
        competitiveData: competitivePricing, // DADOS PARA INTERFACE
        vehicleType: vehicleType,
        destination: selectedLocation
      };

      // Salvar dados competitivos para interface
      setCompetitivePrice(competitivePricing);

// 4. ADICIONAR FUNÇÃO para campo da Yango (adicionar após linha 2136):

  // Função para atualizar preço da Yango
  const handleYangoPriceChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue) {
      const formattedValue = parseInt(numericValue).toLocaleString() + ' AOA';
      setYangoPrice(formattedValue);
      
      // Se já temos estimativa, recalcular
      if (rideEstimate) {
        const newCompetitive = PricingHelper.calculateCompetitivePrice(
          rideEstimate.originalFare || rideEstimate.fare,
          parseInt(numericValue),
          rideEstimate.vehicleType,
          rideEstimate.distance / 1000
        );
        
        setCompetitivePrice(newCompetitive);
        
        // Atualizar preço na estimativa atual
        setRideEstimate(prev => ({
          ...prev,
          fare: newCompetitive.finalPrice,
          competitiveData: newCompetitive
        }));
      }
    } else {
      setYangoPrice('');
    }
  };

// 5. ADICIONAR COMPONENTE VISUAL no JSX (onde é mostrada a estimativa):

  // Componente para mostrar precificação competitiva
  const CompetitivePriceDisplay = () => {
    if (!competitivePrice || !rideEstimate) return null;
    
    return (
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

// 6. NO JSX DO MODAL DE CONFIRMAÇÃO, adicionar:
// <CompetitivePriceDisplay />

// 7. ADICIONAR ESTILOS no StyleSheet:

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
  }

// RESULTADO ESPERADO:
// Após integração, os logs mostrarão:
// 💰 Tarifa original calculada: 21200 AOA
// 💰 [PRICING] Calculando preço competitivo...
// 💰 [PRICING] Preço original: 21200 AOA  
// 💰 [PRICING] Preço Yango: 17900 AOA (se informado)
// 💰 [PRICING] Aplicando desconto vs Yango: 12%
// 💰 [PRICING] Preço final: 15752 AOA
// 💰 Tarifa competitiva aplicada: 15752 AOA
// 💰 Economia vs preço original: 5448 AOA
// 🏆 vs Yango: 2148 AOA mais barato

// E o objeto estimate terá:
// {
//   distance: 100000,
//   distanceText: "100.0 km", 
//   time: 12000,
//   timeText: "200 min",
//   fare: 15752,              // PREÇO COMPETITIVO!
//   originalFare: 21200,      // PREÇO ORIGINAL
//   competitiveData: {...},   // DADOS PARA INTERFACE
//   vehicleType: "privado",
//   destination: {...}
// }