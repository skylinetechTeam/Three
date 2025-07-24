import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';

const FavoritosScreen = () => {
  const [favoritos, setFavoritos] = useState([
    {
      id: '1',
      nome: 'Casa',
      endereco: 'Rua 7958, Luanda-Cacuaco',
      tipo: 'casa',
      frequencia: 'Frequente'
    },
    {
      id: '2',
      nome: 'Trabalho',
      endereco: 'Avenida 105, Luanda-benfica',
      tipo: 'trabalho',
      frequencia: 'Diário'
    },
    {
      id: '3',
      nome: 'Academia',
      endereco: 'Rua Principal 45, Talatona',
      tipo: 'lazer',
      frequencia: 'Semanal'
    },
    {
      id: '4',
      nome: 'Shopping',
      endereco: 'Avenida Comercial, Luanda',
      tipo: 'compras',
      frequencia: 'Mensal'
    }
  ]);

  const [searchText, setSearchText] = useState('');
  
  const filteredFavoritos = favoritos.filter(item => 
    item.nome.toLowerCase().includes(searchText.toLowerCase()) ||
    item.endereco.toLowerCase().includes(searchText.toLowerCase())
  );

  const getIconForType = (tipo) => {
    switch (tipo) {
      case 'casa':
        return <Ionicons name="home" size={24} color={COLORS.primary} />;
      case 'trabalho':
        return <MaterialIcons name="work" size={24} color={COLORS.primary} />;
      case 'lazer':
        return <Ionicons name="fitness" size={24} color={COLORS.primary} />;
      case 'compras':
        return <Ionicons name="cart" size={24} color={COLORS.primary} />;
      default:
        return <Ionicons name="location" size={24} color={COLORS.primary} />;
    }
  };

  const handleRemoveFavorito = (id) => {
    Alert.alert(
      "Remover Favorito",
      "Tem certeza que deseja remover este local dos favoritos?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Remover", 
          onPress: () => {
            setFavoritos(favoritos.filter(item => item.id !== id));
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleAddFavorito = () => {
    Alert.alert(
      "Adicionar Favorito",
      "Funcionalidade em desenvolvimento",
      [{ text: "OK" }]
    );
  };

  const renderFavoritoItem = ({ item }) => (
    <TouchableOpacity style={styles.favoritoCard}>
      <View style={styles.favoritoContent}>
        <View style={styles.iconContainer}>
          {getIconForType(item.tipo)}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.favoritoNome}>{item.nome}</Text>
          <Text style={styles.favoritoEndereco}>{item.endereco}</Text>
          <Text style={styles.favoritoFrequencia}>{item.frequencia}</Text>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveFavorito(item.id)}
        >
          <Ionicons name="close-circle" size={24} color={COLORS.notification} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favoritos</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar favoritos"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={COLORS.text.secondary}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.content}>
        {filteredFavoritos.length > 0 ? (
          <FlatList
            data={filteredFavoritos}
            renderItem={renderFavoritoItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.favoritosList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>Nenhum favorito encontrado</Text>
            <Text style={styles.emptySubtext}>
              {searchText.length > 0 
                ? "Tente uma busca diferente" 
                : "Adicione seus locais favoritos para acesso rápido"}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddFavorito}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Adicionar Favorito</Text>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  favoritosList: {
    paddingBottom: 80,
  },
  favoritoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
  favoritoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.input.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  favoritoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  favoritoEndereco: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  favoritoFrequencia: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.light,
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
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
  addButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default FavoritosScreen;