import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';

const ReservasScreen = () => {
  const [reservas, setReservas] = useState([
    {
      id: '1',
      origem: '7958 Luanda-Cacuaco',
      destino: '105 Luanda-benfica',
      data: '10-12-2023',
      hora: '10:30',
      status: 'ativa'
    },
    {
      id: '2',
      origem: '7958 Luanda-Cacuaco',
      destino: '105 Luanda-benfica',
      data: '10-12-2023',
      hora: '16:30',
      status: 'ativa'
    }
  ]);

  const [novaReserva, setNovaReserva] = useState(false);

  const confirmarReserva = () => {
    Alert.alert(
      "Confirmar Reserva",
      "Deseja confirmar esta reserva de táxi?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Confirmar", 
          onPress: () => {
            Alert.alert("Reserva Confirmada", "Sua reserva foi confirmada com sucesso!");
          }
        }
      ]
    );
  };

  const renderReservaItem = ({ item }) => (
    <View style={styles.reservaCard}>
      <View style={styles.reservaHeader}>
        <View style={styles.origemDestino}>
          <View style={styles.locationItem}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.locationText}>{item.origem}</Text>
          </View>
          <View style={styles.locationItem}>
            <Ionicons name="navigate" size={20} color={COLORS.secondary} />
            <Text style={styles.locationText}>{item.destino}</Text>
          </View>
        </View>
        <View style={styles.dataHora}>
          <Text style={styles.dataText}>{item.data}</Text>
          <Text style={styles.horaText}>{item.hora}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.confirmarButton} onPress={confirmarReserva}>
        <Text style={styles.confirmarButtonText}>Reservar corrida</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reservas</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Reservas</Text>
        <FlatList
          data={reservas}
          renderItem={renderReservaItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.reservasList}
          showsVerticalScrollIndicator={false}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.novaReservaButton}
        onPress={() => Alert.alert("Nova Reserva", "Funcionalidade em desenvolvimento")}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.novaReservaText}>Nova Reserva</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 15,
  },
  reservasList: {
    paddingBottom: 80,
  },
  reservaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  origemDestino: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  dataHora: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  dataText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  horaText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 4,
  },
  confirmarButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  confirmarButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  novaReservaButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...SHADOWS.medium,
  },
  novaReservaText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default ReservasScreen;