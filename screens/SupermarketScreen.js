import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  StyleSheet,
  Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';

const { width } = Dimensions.get('window');

// Mock data for supermarkets in Angola
const SUPERMARKETS = [
  {
    id: '1',
    name: 'Kero',
    image: 'https://example.com/kero.jpg',
    rating: 4.5,
    deliveryTime: '30-45 min',
    minimumOrder: 5000,
  },
  {
    id: '2',
    name: 'Shoprite',
    image: 'https://example.com/shoprite.jpg',
    rating: 4.3,
    deliveryTime: '40-55 min',
    minimumOrder: 4000,
  },
  {
    id: '3',
    name: 'Candando',
    image: 'https://example.com/candando.jpg',
    rating: 4.4,
    deliveryTime: '35-50 min',
    minimumOrder: 4500,
  },
];

// Mock data for product categories
const CATEGORIES = [
  { id: '1', name: 'Frutas & Vegetais', icon: 'local-florist' },
  { id: '2', name: 'Carnes', icon: 'restaurant' },
  { id: '3', name: 'Bebidas', icon: 'local-bar' },
  { id: '4', name: 'Laticínios', icon: 'breakfast-dining' },
  { id: '5', name: 'Padaria', icon: 'bakery-dining' },
  { id: '6', name: 'Limpeza', icon: 'cleaning-services' },
];

export default function SupermarketScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupermarket, setSelectedSupermarket] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);

  const SupermarketCard = ({ item }) => (
    <TouchableOpacity
      style={styles.supermarketCard}
      onPress={() => setSelectedSupermarket(item)}
    >
      <Image 
        source={{ uri: item.image }}
        style={styles.supermarketImage}
        defaultSource={require('../assets/placeholder.png')}
      />
      <View style={styles.supermarketInfo}>
        <Text style={styles.supermarketName}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={16} color={COLORS.primary} />
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
        <Text style={styles.deliveryInfo}>
          Entrega: {item.deliveryTime}
        </Text>
        <Text style={styles.minimumOrder}>
          Pedido mínimo: {item.minimumOrder} Kz
        </Text>
      </View>
    </TouchableOpacity>
  );

  const CategoryButton = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory?.id === item.id && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <MaterialIcons 
        name={item.icon} 
        size={24} 
        color={selectedCategory?.id === item.id ? COLORS.white : COLORS.primary} 
      />
      <Text style={[
        styles.categoryText,
        selectedCategory?.id === item.id && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color={COLORS.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Procurar supermercado..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => {/* Navigate to cart */}}
        >
          <MaterialIcons name="shopping-cart" size={24} color={COLORS.primary} />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Categorias</Text>
      <FlatList
        horizontal
        data={CATEGORIES}
        renderItem={({ item }) => <CategoryButton item={item} />}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesList}
      />

      <Text style={styles.sectionTitle}>Supermercados</Text>
      <FlatList
        data={SUPERMARKETS}
        renderItem={({ item }) => <SupermarketCard item={item} />}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.supermarketsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  cartButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 15,
  },
  categoriesList: {
    paddingHorizontal: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  selectedCategory: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    marginLeft: 5,
    color: COLORS.text.primary,
  },
  selectedCategoryText: {
    color: COLORS.white,
  },
  supermarketsList: {
    padding: 15,
  },
  supermarketCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    ...SHADOWS.medium,
  },
  supermarketImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  supermarketInfo: {
    flex: 1,
    marginLeft: 15,
  },
  supermarketName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  rating: {
    marginLeft: 5,
    color: COLORS.text.secondary,
  },
  deliveryInfo: {
    marginTop: 5,
    color: COLORS.text.secondary,
  },
  minimumOrder: {
    marginTop: 5,
    color: COLORS.text.secondary,
  },
});