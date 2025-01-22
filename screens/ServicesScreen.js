import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import supabase from '../supabaseClient';

const ServicosScreen = () => {
  const [servicos, setServicos] = useState([]);

  useEffect(() => {
    const fetchServicos = async () => {
      const { data, error } = await supabase.from('servicos').select('*');
      if (error) {
        console.error('Erro ao buscar serviços:', error);
      } else {
        setServicos(data);
      }
    };

    fetchServicos();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Serviços</Text>
      <Text style={styles.subHeader}>vá a qualquer lugar</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.servicosContainer}
      >
        {servicos.map((servico) => (
          <View key={servico.id} style={styles.servicoBox}>
            <Ionicons name="car" size={40} color="black" />
            <Text style={styles.servicoText}>{servico.nome}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.sectionHeader}>Fazer Pedidos de entregas</Text>
      <View style={styles.gridContainer}>
        {[
          { label: 'Food', icon: 'fast-food', promo: true },
          { label: 'Grocery', icon: 'basket', promo: true },
          { label: 'Alcohol', icon: 'beer', promo: true },
          { label: 'Convenience', icon: 'cart' },
          { label: 'Health', icon: 'medkit' },
          { label: 'Personal Care', icon: 'happy' },
          { label: 'Baby', icon: 'body' },
          { label: 'Gourmet', icon: 'pizza' },
          { label: 'Flowers', icon: 'flower' },
          { label: 'Electronics', icon: 'tv' },
          { label: 'Books', icon: 'book' },
          { label: 'Furniture', icon: 'bed' },
          { label: 'Pets', icon: 'paw' },
          { label: 'Cleaning', icon: 'broom' },
          { label: 'Fitness', icon: 'barbell' },
          { label: 'Travel', icon: 'airplane' },
        ].map((item, index) => (
          <TouchableOpacity key={index} style={styles.gridItem}>
            {item.promo && <Text style={styles.promo}>Promo</Text>}
            <Ionicons name={item.icon} size={30} color="black" />
            <Text style={styles.gridText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
  servicosContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  servicoBox: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  servicoText: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '22%',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  promo: {
    position: 'absolute',
    top: 5,
    left: 5,
    fontSize: 10,
    color: '#fff',
    backgroundColor: 'green',
    borderRadius: 5,
    paddingHorizontal: 5,
  },
  gridText: {
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ServicosScreen;
