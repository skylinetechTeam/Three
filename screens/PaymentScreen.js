import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const PaymentScreen = ({ navigation, route }) => {

  const paymentMethod = {
    id: 'cash',
    title: 'Dinheiro em Mão',
    subtitle: 'Pague diretamente ao motorista',
    icon: 'cash-outline',
    color: '#10B981',
  };

     const handlePayment = () => {
     Alert.alert(
       'Configuração Confirmada',
       'Método de pagamento configurado com sucesso!',
       [
         {
           text: 'OK',
           onPress: () => {
             // Navegar para confirmação ou voltar
             navigation.goBack();
           },
         },
       ]
     );
   };

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
                 <Text style={styles.headerTitle}>Configurar Pagamento</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

                           <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                   {/* Método de Pagamento */}
         <View style={styles.paymentSection}>
           <Text style={styles.sectionTitle}>Método de Pagamento</Text>
           <View style={[styles.paymentMethod, styles.selectedMethod]}>
             <View style={styles.methodIcon}>
               <Ionicons
                 name={paymentMethod.icon}
                 size={24}
                 color={paymentMethod.color}
               />
             </View>
             <View style={styles.methodInfo}>
               <Text style={styles.methodTitle}>{paymentMethod.title}</Text>
               <Text style={styles.methodSubtitle}>{paymentMethod.subtitle}</Text>
             </View>
             <View style={styles.methodCheck}>
               <Ionicons name="checkmark-circle" size={24} color="#10B981" />
             </View>
           </View>
         </View>

        {/* Informações Importantes */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informações Importantes</Text>
                     <View style={styles.infoItem}>
             <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
             <Text style={styles.infoText}>
               Tenha o valor exato preparado para pagar ao motorista
             </Text>
           </View>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              O motorista não carrega troco, prepare o valor exato
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Botão de Pagamento */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.payButtonGradient}
          >
                         <Text style={styles.payButtonText}>
               Confirmar Configuração
             </Text>
          </LinearGradient>
        </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
     
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
     
     
   
  paymentSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedMethod: {
    borderColor: '#1737e8',
    backgroundColor: '#EFF6FF',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  methodCheck: {
    width: 24,
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PaymentScreen;
