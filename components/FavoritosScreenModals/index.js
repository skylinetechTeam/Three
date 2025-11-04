import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '../BaseModal/ModalVariants';
import { ResponsiveButton, ResponsiveInput, ResponsiveCard } from '../ResponsiveUI';
import Button from '../Button';
import { useResponsive, useNotification } from '../../contexts/UIContext';
import { COLORS, SIZES, FONTS, RESPONSIVE } from '../../config/theme';

/**
 * SmartCategoriesModal - Intelligent categorization system for favorites
 */
export const SmartCategoriesModal = ({
  visible,
  onClose,
  favorites = [],
  onCategorySelect,
  onFavoriteSelect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const { showNotification } = useNotification();

  // Smart categorization based on usage patterns and location types
  const categories = [
    {
      id: 'all',
      name: 'Todos',
      icon: 'grid',
      count: favorites.length,
      color: COLORS.text.primary,
    },
    {
      id: 'frequent',
      name: 'Frequentes',
      icon: 'star',
      count: favorites.filter(f => f.frequencia === 'Diário' || f.frequencia === 'Semanal').length,
      color: COLORS.semantic.warning,
    },
    {
      id: 'home',
      name: 'Casa',
      icon: 'home',
      count: favorites.filter(f => f.tipo === 'casa').length,
      color: COLORS.semantic.success,
    },
    {
      id: 'work',
      name: 'Trabalho',
      icon: 'business',
      count: favorites.filter(f => f.tipo === 'trabalho').length,
      color: COLORS.primary[500],
    },
    {
      id: 'entertainment',
      name: 'Lazer',
      icon: 'restaurant',
      count: favorites.filter(f => 
        f.tipo === 'restaurante' || f.tipo === 'shopping' || f.tipo === 'outro'
      ).length,
      color: COLORS.semantic.info,
    },
    {
      id: 'recent',
      name: 'Recentes',
      icon: 'time',
      count: favorites.filter(f => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(f.createdAt) > oneWeekAgo;
      }).length,
      color: COLORS.text.light,
    },
  ];

  const getFilteredFavorites = () => {
    let filtered = favorites;

    // Apply category filter
    switch (selectedCategory) {
      case 'frequent':
        filtered = filtered.filter(f => f.frequencia === 'Diário' || f.frequencia === 'Semanal');
        break;
      case 'home':
        filtered = filtered.filter(f => f.tipo === 'casa');
        break;
      case 'work':
        filtered = filtered.filter(f => f.tipo === 'trabalho');
        break;
      case 'entertainment':
        filtered = filtered.filter(f => 
          f.tipo === 'restaurante' || f.tipo === 'shopping' || f.tipo === 'outro'
        );
        break;
      case 'recent':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(f => new Date(f.createdAt) > oneWeekAgo);
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(f =>
        f.nome.toLowerCase().includes(searchText.toLowerCase()) ||
        f.endereco.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return filtered;
  };

  const renderCategoryCard = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryCard,
        selectedCategory === category.id && styles.categoryCardSelected
      ]}
      onPress={() => {
        setSelectedCategory(category.id);
        onCategorySelect?.(category);
      }}
    >
      <View style={[
        styles.categoryIcon,
        { backgroundColor: category.color + '20' }
      ]}>
        <Ionicons 
          name={category.icon} 
          size={RESPONSIVE.getIconSize('medium')} 
          color={category.color} 
        />
      </View>
      
      <Text style={[
        FONTS.styles.body2,
        styles.categoryName,
        selectedCategory === category.id && styles.categoryNameSelected
      ]}>
        {category.name}
      </Text>
      
      <Text style={[
        FONTS.styles.caption,
        styles.categoryCount,
        selectedCategory === category.id && styles.categoryCountSelected
      ]}>
        {category.count}
      </Text>
    </TouchableOpacity>
  );

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.favoriteItem}
      onPress={() => {
        onFavoriteSelect?.(item);
        onClose();
      }}
    >
      <View style={styles.favoriteIcon}>
        <MaterialIcons 
          name={getLocationIcon(item.tipo)} 
          size={RESPONSIVE.getIconSize('medium')} 
          color={COLORS.primary[500]} 
        />
      </View>
      
      <View style={styles.favoriteInfo}>
        <Text style={[FONTS.styles.body1, styles.favoriteName]}>
          {item.nome}
        </Text>
        <Text style={[FONTS.styles.body2, styles.favoriteAddress]}>
          {item.endereco}
        </Text>
        
        <View style={styles.favoriteTags}>
          <View style={[styles.tag, getFrequencyTagStyle(item.frequencia)]}>
            <Text style={[FONTS.styles.caption, styles.tagText]}>
              {item.frequencia}
            </Text>
          </View>
          
          <View style={styles.tag}>
            <Text style={[FONTS.styles.caption, styles.tagText]}>
              {item.tipo}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.favoriteAction}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => {
            showNotification({
              type: 'success',
              title: 'Corrida solicitada',
              message: `Destino: ${item.nome}`,
            });
          }}
          iconLeft={
            <Ionicons 
              name="car" 
              size={RESPONSIVE.getIconSize('small')} 
              color={COLORS.semantic.success} 
            />
          }
          accessibilityLabel={`Solicitar corrida para ${item.nome}`}
          accessibilityHint="Toque para iniciar uma corrida para este destino favorito"
          style={styles.favoriteButton}
        />
      </View>
    </TouchableOpacity>
  );

  const getLocationIcon = (type) => {
    switch (type) {
      case 'casa': return 'home';
      case 'trabalho': return 'business';
      case 'restaurante': return 'restaurant';
      case 'shopping': return 'shopping-cart';
      default: return 'location-on';
    }
  };

  const getFrequencyTagStyle = (frequency) => {
    switch (frequency) {
      case 'Diário':
        return { backgroundColor: COLORS.semantic.successLight };
      case 'Semanal':
        return { backgroundColor: COLORS.primary[100] };
      case 'Mensal':
        return { backgroundColor: COLORS.semantic.warningLight };
      default:
        return { backgroundColor: COLORS.surface.backgroundSecondary };
    }
  };

  const filteredFavorites = getFilteredFavorites();

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Favoritos organizados"
      subtitle="Encontre rapidamente seus destinos preferidos"
      initialSnapPoint={0.9}
      snapPoints={[0.7, 0.9]}
    >
      {/* Search Bar */}
      <ResponsiveInput
        placeholder="Buscar favoritos..."
        value={searchText}
        onChangeText={setSearchText}
        icon="search"
        rightIcon={searchText ? "close-circle" : undefined}
        onRightIconPress={() => setSearchText('')}
        style={styles.searchInput}
      />

      {/* Categories Grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categoriesScroll}
      >
        {categories.map(renderCategoryCard)}
      </ScrollView>

      {/* Favorites List */}
      <View style={styles.favoritesSection}>
        <View style={styles.sectionHeader}>
          <Text style={[FONTS.styles.h3, styles.sectionTitle]}>
            {selectedCategory === 'all' ? 'Todos os favoritos' : 
             categories.find(c => c.id === selectedCategory)?.name}
          </Text>
          <Text style={[FONTS.styles.caption, styles.resultCount]}>
            {filteredFavorites.length} {filteredFavorites.length === 1 ? 'local' : 'locais'}
          </Text>
        </View>

        {filteredFavorites.length > 0 ? (
          <FlatList
            data={filteredFavorites}
            renderItem={renderFavoriteItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.favoritesList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons 
              name="heart-outline" 
              size={RESPONSIVE.getIconSize('xl')} 
              color={COLORS.text.light} 
            />
            <Text style={[FONTS.styles.body1, styles.emptyStateText]}>
              {searchText 
                ? 'Nenhum favorito encontrado' 
                : 'Nenhum favorito nesta categoria'}
            </Text>
            <Text style={[FONTS.styles.body2, styles.emptyStateSubtext]}>
              {searchText 
                ? 'Tente buscar com outro termo' 
                : 'Adicione locais a esta categoria'}
            </Text>
          </View>
        )}
      </View>
    </BottomSheetModal>
  );
};

/**
 * VisualSearchModal - Map-based visual search for favorites
 */
export const VisualSearchModal = ({
  visible,
  onClose,
  favorites = [],
  onLocationSelect,
  currentLocation,
}) => {
  const [mapRegion, setMapRegion] = useState({
    latitude: currentLocation?.latitude || -8.8390,
    longitude: currentLocation?.longitude || 13.2894,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [selectedFavorite, setSelectedFavorite] = useState(null);

  const handleMarkerPress = (favorite) => {
    setSelectedFavorite(favorite);
  };

  const handleLocationSelect = () => {
    if (selectedFavorite) {
      onLocationSelect?.(selectedFavorite);
      onClose();
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Busca visual"
      subtitle="Encontre favoritos no mapa"
      initialSnapPoint={0.85}
      snapPoints={[0.6, 0.85]}
    >
      <View style={styles.mapContainer}>
        {/* Map placeholder - replace with actual map component */}
        <View style={styles.mapPlaceholder}>
          <MaterialIcons 
            name="map" 
            size={RESPONSIVE.getIconSize('xl')} 
            color={COLORS.text.light} 
          />
          <Text style={[FONTS.styles.body1, styles.mapPlaceholderText]}>
            Mapa com favoritos
          </Text>
          <Text style={[FONTS.styles.body2, styles.mapPlaceholderSubtext]}>
            {favorites.length} locais marcados
          </Text>
        </View>
        
        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapControlButton}>
            <Ionicons name="locate" size={20} color={COLORS.primary[500]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.mapControlButton}>
            <Ionicons name="layers" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Favorite Details */}
      {selectedFavorite && (
        <ResponsiveCard style={styles.selectedCard} variant="elevated">
          <View style={styles.selectedHeader}>
            <View style={styles.selectedIcon}>
              <MaterialIcons 
                name={getLocationIcon(selectedFavorite.tipo)} 
                size={24} 
                color={COLORS.primary[500]} 
              />
            </View>
            
            <View style={styles.selectedInfo}>
              <Text style={[FONTS.styles.h3, styles.selectedName]}>
                {selectedFavorite.nome}
              </Text>
              <Text style={[FONTS.styles.body2, styles.selectedAddress]}>
                {selectedFavorite.endereco}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.selectButton}
              onPress={handleLocationSelect}
            >
              <Ionicons name="checkmark" size={20} color={COLORS.text.inverse} />
            </TouchableOpacity>
          </View>
        </ResponsiveCard>
      )}

      {/* Nearby Favorites List */}
      <View style={styles.nearbySection}>
        <Text style={[FONTS.styles.h3, styles.nearbyTitle]}>
          Favoritos próximos
        </Text>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nearbyList}
        >
          {favorites.slice(0, 5).map((favorite) => (
            <TouchableOpacity
              key={favorite.id}
              style={[
                styles.nearbyCard,
                selectedFavorite?.id === favorite.id && styles.nearbyCardSelected
              ]}
              onPress={() => setSelectedFavorite(favorite)}
            >
              <MaterialIcons 
                name={getLocationIcon(favorite.tipo)} 
                size={20} 
                color={COLORS.primary[500]} 
              />
              <Text style={[FONTS.styles.caption, styles.nearbyName]}>
                {favorite.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  // Search input
  searchInput: {
    marginBottom: SIZES.spacing.lg,
  },

  // Categories
  categoriesScroll: {
    marginBottom: SIZES.spacing.lg,
  },
  
  categoriesContainer: {
    paddingHorizontal: SIZES.spacing.sm,
    gap: SIZES.spacing.md,
  },
  
  categoryCard: {
    alignItems: 'center',
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface.card,
    minWidth: 80,
    gap: SIZES.spacing.sm,
  },
  
  categoryCardSelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  categoryName: {
    fontWeight: '500',
    textAlign: 'center',
  },
  
  categoryNameSelected: {
    color: COLORS.primary[700],
  },
  
  categoryCount: {
    color: COLORS.text.light,
  },
  
  categoryCountSelected: {
    color: COLORS.primary[600],
  },

  // Favorites section
  favoritesSection: {
    flex: 1,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  
  sectionTitle: {
    flex: 1,
  },
  
  resultCount: {
    color: COLORS.text.light,
  },
  
  favoritesList: {
    paddingBottom: SIZES.spacing.xl,
  },
  
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SIZES.spacing.md,
  },
  
  favoriteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  favoriteInfo: {
    flex: 1,
  },
  
  favoriteName: {
    fontWeight: '600',
    marginBottom: SIZES.spacing.xs,
  },
  
  favoriteAddress: {
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.sm,
  },
  
  favoriteTags: {
    flexDirection: 'row',
    gap: SIZES.spacing.sm,
  },
  
  tag: {
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.small,
    backgroundColor: COLORS.surface.backgroundSecondary,
  },
  
  tagText: {
    color: COLORS.text.light,
    fontWeight: '500',
  },
  
  favoriteAction: {
    minWidth: RESPONSIVE.getDynamicSize({ small: 36, standard: 40, large: 44, tablet: 48 }),
    minHeight: RESPONSIVE.getDynamicSize({ small: 36, standard: 40, large: 44, tablet: 48 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  favoriteButton: {
    minWidth: RESPONSIVE.getDynamicSize({ small: 36, standard: 40, large: 44, tablet: 48 }),
    minHeight: RESPONSIVE.getDynamicSize({ small: 36, standard: 40, large: 44, tablet: 48 }),
    borderRadius: RESPONSIVE.getDynamicSize({ small: 18, standard: 20, large: 22, tablet: 24 }),
    backgroundColor: COLORS.semantic.successLight,
    margin: 0,
    padding: SIZES.spacing.xs,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.xl,
  },
  
  emptyStateText: {
    color: COLORS.text.light,
    marginTop: SIZES.spacing.md,
    textAlign: 'center',
  },
  
  emptyStateSubtext: {
    color: COLORS.text.light,
    marginTop: SIZES.spacing.sm,
    textAlign: 'center',
  },

  // Visual search modal
  mapContainer: {
    height: 300,
    borderRadius: SIZES.radius.medium,
    overflow: 'hidden',
    marginBottom: SIZES.spacing.lg,
    position: 'relative',
  },
  
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface.backgroundSecondary,
    gap: SIZES.spacing.sm,
  },
  
  mapPlaceholderText: {
    color: COLORS.text.light,
    fontWeight: '600',
  },
  
  mapPlaceholderSubtext: {
    color: COLORS.text.light,
  },
  
  mapControls: {
    position: 'absolute',
    top: SIZES.spacing.md,
    right: SIZES.spacing.md,
    gap: SIZES.spacing.sm,
  },
  
  mapControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  
  selectedCard: {
    marginBottom: SIZES.spacing.lg,
  },
  
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.md,
  },
  
  selectedIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  selectedInfo: {
    flex: 1,
  },
  
  selectedName: {
    marginBottom: SIZES.spacing.xs,
  },
  
  selectedAddress: {
    color: COLORS.text.secondary,
  },
  
  selectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.semantic.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  nearbySection: {
    marginTop: SIZES.spacing.lg,
  },
  
  nearbyTitle: {
    marginBottom: SIZES.spacing.md,
  },
  
  nearbyList: {
    paddingHorizontal: SIZES.spacing.sm,
    gap: SIZES.spacing.md,
  },
  
  nearbyCard: {
    alignItems: 'center',
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.medium,
    backgroundColor: COLORS.surface.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 80,
    gap: SIZES.spacing.sm,
  },
  
  nearbyCardSelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  
  nearbyName: {
    textAlign: 'center',
    fontWeight: '500',
  },
});

export { SmartCategoriesModal, VisualSearchModal };

export default {
  SmartCategoriesModal,
  VisualSearchModal,
};