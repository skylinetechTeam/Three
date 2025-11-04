import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CompetitivePricingService from '../services/competitivePricingService';

const CompetitivePriceComparison = ({ originalPrice, yangoPrice, style }) => {
  // Calcular comparação de preços
  const comparison = CompetitivePricingService.getPriceComparison(originalPrice, yangoPrice);

  return (
    <View style={[styles.container, style]}>
      {/* Título */}
      <Text style={styles.title}>💰 Comparação de Preços</Text>
      
      {/* Preço da Yango (se disponível) */}
      {comparison.showComparison && (
        <View style={styles.competitorRow}>
          <Text style={styles.competitorLabel}>Yango</Text>
          <Text style={styles.competitorPrice}>{comparison.prices.yango.formatted}</Text>
        </View>
      )}
      
      {/* Nosso preço */}
      <View style={styles.ourPriceRow}>
        <Text style={styles.ourPriceLabel}>Nosso Preço</Text>
        <Text style={styles.ourPrice}>{comparison.prices.final.formatted}</Text>
      </View>
      
      {/* Economia (se houver) */}
      {comparison.savings.amount > 0 && (
        <View style={styles.savingsRow}>
          <Text style={styles.savingsText}>
            🎉 Você economiza: {comparison.savings.formatted} ({comparison.savings.percentage})
          </Text>
        </View>
      )}
      
      {/* Preço original riscado se houver desconto */}
      {comparison.prices.final.value < comparison.prices.original.value && (
        <View style={styles.originalPriceRow}>
          <Text style={styles.originalPrice}>
            De: {comparison.prices.original.formatted}
          </Text>
        </View>
      )}
      
      {/* Indicador de competitividade */}
      {comparison.isCompetitive && (
        <View style={styles.competitiveIndicator}>
          <Text style={styles.competitiveText}>✅ Mais barato que a concorrência!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 12,
    textAlign: 'center',
  },
  
  competitorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  
  competitorLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  
  competitorPrice: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '500',
  },
  
  ourPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  
  ourPriceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
  },
  
  ourPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#155724',
  },
  
  savingsRow: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  
  savingsText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '600',
  },
  
  originalPriceRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  
  originalPrice: {
    fontSize: 12,
    color: '#6c757d',
    textDecorationLine: 'line-through',
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

export default CompetitivePriceComparison;