import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const PaymentHistoryScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Dados mockados para demonstração
  const paymentHistory = [
    {
      id: '1',
      service: 'Transporte',
      amount: 2500,
      method: 'Dinheiro em Mão',
      date: '2024-01-15',
      time: '14:30',
      status: 'completed',
      driver: 'João Silva',
      from: 'Shopping Center',
      to: 'Casa',
    },
    {
      id: '2',
      service: 'Transporte',
      amount: 1850,
      method: 'Dinheiro em Mão',
      date: '2024-01-14',
      time: '09:15',
      status: 'completed',
      driver: 'Maria Santos',
      from: 'Aeroporto',
      to: 'Hotel',
    },
    {
      id: '3',
      service: 'Transporte',
      amount: 3200,
      method: 'Dinheiro em Mão',
      date: '2024-01-13',
      time: '20:45',
      status: 'completed',
      driver: 'Pedro Costa',
      from: 'Restaurante',
      to: 'Casa',
    },
    {
      id: '4',
      service: 'Transporte',
      amount: 1575,
      method: 'Dinheiro em Mão',
      date: '2024-01-12',
      time: '16:20',
      status: 'completed',
      driver: 'Ana Oliveira',
      from: 'Farmácia',
      to: 'Casa',
    },
    {
      id: '5',
      service: 'Transporte',
      amount: 2890,
      method: 'Dinheiro em Mão',
      date: '2024-01-11',
      time: '11:30',
      status: 'completed',
      driver: 'Carlos Lima',
      from: 'Supermercado',
      to: 'Casa',
    },
  ];

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'cash', label: 'Dinheiro' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'Dinheiro em Mão':
        return 'cash-outline';
      case 'Cartão de Crédito':
      case 'Cartão de Débito':
        return 'card-outline';
      case 'PIX':
        return 'phone-portrait-outline';
      case 'Carteira Digital':
        return 'wallet-outline';
      default:
        return 'card-outline';
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'Dinheiro em Mão':
        return '#10B981';
      case 'Cartão de Crédito':
      case 'Cartão de Débito':
        return '#3B82F6';
      case 'PIX':
        return '#8B5CF6';
      case 'Carteira Digital':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const filteredHistory = selectedFilter === 'all' 
    ? paymentHistory 
    : paymentHistory.filter(item => {
        if (selectedFilter === 'cash') return item.method === 'Dinheiro em Mão';
        return true;
      });

  const renderPaymentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.paymentItem}
      onPress={() => {
        // Aqui você pode navegar para detalhes do pagamento
        console.log('Detalhes do pagamento:', item.id);
      }}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceTitle}>{item.service}</Text>
          <Text style={styles.serviceSubtitle}>
            {item.from} → {item.to}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{item.amount.toLocaleString('pt-AO')} Kz</Text>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.driver}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.time}</Text>
          </View>
        </View>

        <View style={styles.methodRow}>
          <View style={styles.methodContainer}>
            <Ionicons
              name={getMethodIcon(item.method)}
              size={16}
              color={getMethodColor(item.method)}
            />
            <Text style={[styles.methodText, { color: getMethodColor(item.method) }]}>
              {item.method}
            </Text>
          </View>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1737e8', '#1e4fd8', '#2a5fd8']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de Pagamentos</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de Pagamentos */}
      <FlatList
        data={filteredHistory}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Nenhum pagamento encontrado</Text>
            <Text style={styles.emptySubtitle}>
              Seus pagamentos aparecerão aqui
            </Text>
          </View>
        }
      />

      {/* Resumo */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total de Pagamentos:</Text>
          <Text style={styles.summaryValue}>{filteredHistory.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Valor Total:</Text>
          <Text style={styles.summaryValue}>
            {filteredHistory.reduce((sum, item) => sum + item.amount, 0).toLocaleString('pt-AO')} Kz
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#1737e8',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 20,
  },
  paymentItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1737e8',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default PaymentHistoryScreen;
