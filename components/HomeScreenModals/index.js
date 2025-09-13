import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal, OverlayModal } from '../BaseModal/ModalVariants';
import { ResponsiveButton, ResponsiveInput, ResponsiveCard } from '../ResponsiveUI';
import { useResponsive, useNotification } from '../../contexts/UIContext';
import { COLORS, SIZES, FONTS, SHADOWS, RESPONSIVE } from '../../config/theme';

/**
 * DestinationSearchModal - Enhanced destination search with autocomplete and recent locations
 */
export const DestinationSearchModal = ({
  visible,
  onClose,
  onDestinationSelect,
  currentLocation,
  recentDestinations = [],
  favorites = [],
  onLocationPress,
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTab, setSelectedTab] = useState('search'); // 'search', 'recent', 'favorites'
  const { isSmallScreen, getSize } = useResponsive();
  const { showNotification } = useNotification();
  const searchTimeoutRef = useRef(null);

  // Mock search function - replace with actual HERE Maps API call
  const searchPlaces = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API delay
    setTimeout(() => {
      const mockResults = [
        {
          id: '1',
          name: 'Shopping Belas',
          address: 'Talatona, Luanda',
          distance: 2.5,
          type: 'shopping',
          lat: -8.9270,
          lng: 13.1837,
        },
        {
          id: '2',
          name: 'Aeroporto Internacional 4 de Fevereiro',
          address: 'Luanda, Angola',
          distance: 15.2,
          type: 'airport',
          lat: -8.8584,
          lng: 13.2312,
        },
        {
          id: '3',
          name: 'Fortaleza de São Miguel',
          address: 'Ilha de Luanda, Luanda',
          distance: 8.7,
          type: 'landmark',
          lat: -8.8070,
          lng: 13.2368,
        },
      ].filter(place => 
        place.name.toLowerCase().includes(query.toLowerCase()) ||
        place.address.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 800);
  };

  const handleSearch = (text) => {
    setSearchText(text);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 300);
  };

  const handleLocationSelect = (location) => {
    onDestinationSelect?.(location);
    showNotification({
      type: 'success',
      title: 'Destino selecionado',
      message: location.name,
      duration: 2000,
    });
    onClose();
  };

  const getLocationIcon = (type) => {
    switch (type) {
      case 'shopping': return 'storefront';
      case 'airport': return 'airplane';
      case 'landmark': return 'location';
      case 'restaurant': return 'restaurant';
      case 'hotel': return 'bed';
      default: return 'location-outline';
    }
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.resultIconContainer}>
        <Ionicons 
          name={getLocationIcon(item.type)} 
          size={RESPONSIVE.getIconSize('medium')} 
          color={COLORS.primary[500]} 
        />
      </View>
      
      <View style={styles.resultInfo}>
        <Text style={[FONTS.styles.body1, styles.resultName]}>{item.name}</Text>
        <Text style={[FONTS.styles.body2, styles.resultAddress]}>{item.address}</Text>
        {item.distance && (
          <Text style={[FONTS.styles.caption, styles.resultDistance]}>
            {item.distance}km de distância
          </Text>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.addToFavoritesButton}
        onPress={() => {
          // Add to favorites logic here
          showNotification({
            type: 'success',
            title: 'Adicionado aos favoritos',
            message: item.name,
          });
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons 
          name="heart-outline" 
          size={RESPONSIVE.getIconSize('small')} 
          color={COLORS.text.light} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recentItem}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.recentIconContainer}>
        <Ionicons 
          name="time-outline" 
          size={RESPONSIVE.getIconSize('medium')} 
          color={COLORS.text.light} 
        />
      </View>
      
      <View style={styles.recentInfo}>
        <Text style={[FONTS.styles.body1, styles.recentName]}>{item.name}</Text>
        <Text style={[FONTS.styles.body2, styles.recentAddress]}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.favoriteItem}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.favoriteIconContainer}>
        <Ionicons 
          name="heart" 
          size={RESPONSIVE.getIconSize('medium')} 
          color={COLORS.semantic.error} 
        />
      </View>
      
      <View style={styles.favoriteInfo}>
        <Text style={[FONTS.styles.body1, styles.favoriteName]}>{item.name}</Text>
        <Text style={[FONTS.styles.body2, styles.favoriteAddress]}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'search':
        return (
          <View style={styles.searchContent}>
            <ResponsiveInput
              placeholder="Para onde você quer ir?"
              value={searchText}
              onChangeText={handleSearch}
              icon="search"
              rightIcon={searchText ? "close-circle" : undefined}
              onRightIconPress={() => {
                setSearchText('');
                setSearchResults([]);
              }}
              style={styles.searchInput}
            />
            
            {currentLocation && (
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={() => handleLocationSelect({
                  id: 'current',
                  name: 'Minha localização atual',
                  address: 'Localização GPS',
                  ...currentLocation,
                })}
              >
                <Ionicons 
                  name="navigate" 
                  size={RESPONSIVE.getIconSize('medium')} 
                  color={COLORS.primary[500]} 
                />
                <Text style={[FONTS.styles.body1, styles.currentLocationText]}>
                  Usar minha localização atual
                </Text>
              </TouchableOpacity>
            )}
            
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary[500]} />
                <Text style={[FONTS.styles.body2, styles.loadingText]}>
                  Buscando locais...
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultsList}
              />
            )}
          </View>
        );
        
      case 'recent':
        return (
          <View style={styles.tabContent}>
            {recentDestinations.length > 0 ? (
              <FlatList
                data={recentDestinations}
                renderItem={renderRecentItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultsList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons 
                  name="time-outline" 
                  size={RESPONSIVE.getIconSize('xl')} 
                  color={COLORS.text.light} 
                />
                <Text style={[FONTS.styles.body1, styles.emptyStateText]}>
                  Nenhum destino recente
                </Text>
              </View>
            )}
          </View>
        );
        
      case 'favorites':
        return (
          <View style={styles.tabContent}>
            {favorites.length > 0 ? (
              <FlatList
                data={favorites}
                renderItem={renderFavoriteItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultsList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons 
                  name="heart-outline" 
                  size={RESPONSIVE.getIconSize('xl')} 
                  color={COLORS.text.light} 
                />
                <Text style={[FONTS.styles.body1, styles.emptyStateText]}>
                  Nenhum local favorito
                </Text>
              </View>
            )}
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Escolher destino"
      initialSnapPoint={0.8}
      snapPoints={[0.5, 0.8, 0.95]}
    >
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'search' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('search')}
        >
          <Ionicons 
            name="search" 
            size={RESPONSIVE.getIconSize('small')} 
            color={selectedTab === 'search' ? COLORS.primary[500] : COLORS.text.light} 
          />
          <Text style={[
            FONTS.styles.caption,
            styles.tabText,
            selectedTab === 'search' && styles.activeTabText
          ]}>
            Buscar
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'recent' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('recent')}
        >
          <Ionicons 
            name="time-outline" 
            size={RESPONSIVE.getIconSize('small')} 
            color={selectedTab === 'recent' ? COLORS.primary[500] : COLORS.text.light} 
          />
          <Text style={[
            FONTS.styles.caption,
            styles.tabText,
            selectedTab === 'recent' && styles.activeTabText
          ]}>
            Recentes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'favorites' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('favorites')}
        >
          <Ionicons 
            name="heart-outline" 
            size={RESPONSIVE.getIconSize('small')} 
            color={selectedTab === 'favorites' ? COLORS.primary[500] : COLORS.text.light} 
          />
          <Text style={[
            FONTS.styles.caption,
            styles.tabText,
            selectedTab === 'favorites' && styles.activeTabText
          ]}>
            Favoritos
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      {renderTabContent()}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface.backgroundSecondary,
    borderRadius: SIZES.radius.medium,
    padding: SIZES.spacing.xs,
    marginBottom: SIZES.spacing.lg,
  },
  
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    borderRadius: SIZES.radius.small,
    gap: SIZES.spacing.xs,
  },
  
  activeTab: {
    backgroundColor: COLORS.surface.card,
    ...SHADOWS.small,
  },
  
  tabText: {
    fontSize: RESPONSIVE.getDynamicSize({ small: 11, standard: 12, large: 13, tablet: 14 }),
  },
  
  activeTabText: {
    color: COLORS.primary[500],
    fontWeight: '600',
  },
  
  // Search content styles
  searchContent: {
    flex: 1,
  },
  
  searchInput: {
    marginBottom: SIZES.spacing.lg,
  },
  
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
    backgroundColor: COLORS.primary[50],
    borderRadius: SIZES.radius.medium,
    marginBottom: SIZES.spacing.lg,
    gap: SIZES.spacing.md,
  },
  
  currentLocationText: {
    color: COLORS.primary[700],
    fontWeight: '500',
  },
  
  // Search results styles
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SIZES.spacing.md,
  },
  
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  resultInfo: {
    flex: 1,
  },
  
  resultName: {
    fontWeight: '600',
    marginBottom: SIZES.spacing.xs,
  },
  
  resultAddress: {
    marginBottom: SIZES.spacing.xs,
  },
  
  resultDistance: {
    color: COLORS.text.light,
  },
  
  addToFavoritesButton: {
    padding: SIZES.spacing.sm,
  },
  
  // Recent items styles
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SIZES.spacing.md,
  },
  
  recentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  recentInfo: {
    flex: 1,
  },
  
  recentName: {
    fontWeight: '600',
    marginBottom: SIZES.spacing.xs,
  },
  
  recentAddress: {
    color: COLORS.text.secondary,
  },
  
  // Favorite items styles
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SIZES.spacing.md,
  },
  
  favoriteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.semantic.errorLight,
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
  },
  
  // Common styles
  tabContent: {
    flex: 1,
  },
  
  resultsList: {
    paddingBottom: SIZES.spacing.xl,
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.spacing.xl,
    gap: SIZES.spacing.md,
  },
  
  loadingText: {
    color: COLORS.text.light,
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.xl,
  },
  
  emptyStateText: {
    color: COLORS.text.light,
    marginTop: SIZES.spacing.md,
  },
});

export { DestinationSearchModal } from './DestinationSearchModal';
export { TaxiSelectionModal } from './TaxiSelectionModal';
export { TripConfirmationModal } from './TripConfirmationModal';
export { DriverSearchModal } from './DriverSearchModal';

export default {
  DestinationSearchModal,
  TaxiSelectionModal, 
  TripConfirmationModal,
  DriverSearchModal,
};