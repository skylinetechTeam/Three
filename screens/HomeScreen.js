import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  Animated, 
  ActivityIndicator, 
  Image, 
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialIcons, FontAwesome, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS, COMMON_STYLES } from '../config/theme';

const { width, height } = Dimensions.get('window');

const SERVICES = {
  TAXI: {
    id: 'taxi',
    name: 'Táxi',
    description: 'Viaje com conforto e segurança',
    icon: 'taxi',
    iconFamily: 'FontAwesome5',
    color: '#FF6B6B',
    screen: 'TaxiService'
  },
  MARKET: {
    id: 'market',
    name: 'Supermercado',
    description: 'Compras entregues em sua casa',
    icon: 'shopping-cart',
    iconFamily: 'FontAwesome5',
    color: '#4ECDC4',
    screen: 'MarketService'
  },
  DELIVERY: {
    id: 'delivery',
    name: 'Entregas',
    description: 'Envie e receba encomendas',
    icon: 'shipping-fast',
    iconFamily: 'FontAwesome5',
    color: '#FFD93D',
    screen: 'DeliveryService'
  }
};

export default function HomeScreen({ navigation }) {
  const [selectedService, setSelectedService] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleServiceSelection = (service) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();

    setSelectedService(service);
    if (service === 'taxi') {
      // Navigate to TaxiScreen with custom transition
      navigation.navigate('TaxiScreen', {
        screen: 'TaxiScreen',
        params: {
          fromHome: true
        }
      });
    }
  };

  const ServiceCard = ({ service }) => {
    const isSelected = selectedService === service.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.serviceCard,
          {
            backgroundColor: isSelected ? `${service.color}22` : COLORS.white,
            borderColor: service.color,
            borderWidth: isSelected ? 2 : 0
          }
        ]}
        onPress={() => handleServiceSelection(service.id)}
      >
        <View style={[styles.serviceIconContainer, { backgroundColor: service.color }]}>
          <FontAwesome5 name={service.icon} size={24} color={COLORS.white} />
        </View>
        
        <View style={styles.serviceInfo}>
          <Text style={[
            styles.serviceName,
            isSelected && { color: service.color }
          ]}>
            {service.name}
          </Text>
          <Text style={styles.serviceDescription}>
            {service.description}
          </Text>
        </View>
        
        <View style={styles.arrowContainer}>
          <MaterialIcons 
            name="arrow-forward-ios" 
            size={20} 
            color={isSelected ? service.color : COLORS.text.secondary} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  const PromoCard = ({ title, discount, code, color }) => (
    <View style={[styles.promoCard, { backgroundColor: color }]}>
      <View style={styles.promoContent}>
        <Text style={styles.promoTitle}>{title}</Text>
        <Text style={styles.promoDiscount}>{discount}</Text>
        <View style={styles.promoCodeContainer}>
          <Text style={styles.promoCode}>{code}</Text>
        </View>
      </View>
      <View style={styles.promoImageContainer}>
        <FontAwesome5 
          name={title.toLowerCase().includes('taxi') ? 'taxi' : 
               title.toLowerCase().includes('mercado') ? 'shopping-cart' : 'shipping-fast'} 
          size={40} 
          color={COLORS.white} 
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, Bem-vindo!</Text>
          <Text style={styles.subtitle}>O que você precisa hoje?</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <FontAwesome5 name="user-circle" size={32} color={COLORS.primary} />
              </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.servicesContainer, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Nossos Serviços</Text>
          {Object.values(SERVICES).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </Animated.View>

        <View style={styles.promotionsContainer}>
          <Text style={styles.sectionTitle}>Promoções</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promoScroll}
          >
            <PromoCard 
              title="Taxi Premium"
              discount="20% OFF"
              code="TAXI20"
              color="#FF6B6B"
            />
            <PromoCard 
              title="Super Mercado"
              discount="15% OFF"
              code="MARKET15"
              color="#4ECDC4"
            />
            <PromoCard 
              title="Entregas"
              discount="25% OFF"
              code="DELIVERY25"
              color="#FFD93D"
            />
          </ScrollView>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Recursos</Text>
          <View style={styles.featuresGrid}>
            <TouchableOpacity style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#FF6B6B' }]}>
                <FontAwesome5 name="history" size={20} color={COLORS.white} />
                  </View>
              <Text style={styles.featureText}>Histórico</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#4ECDC4' }]}>
                <FontAwesome5 name="heart" size={20} color={COLORS.white} />
                </View>
              <Text style={styles.featureText}>Favoritos</Text>
                </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#FFD93D' }]}>
                <FontAwesome5 name="gift" size={20} color={COLORS.white} />
                  </View>
              <Text style={styles.featureText}>Cupons</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#6C5CE7' }]}>
                <FontAwesome5 name="headset" size={20} color={COLORS.white} />
                </View>
              <Text style={styles.featureText}>Suporte</Text>
                </TouchableOpacity>
          </View>
    </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.large,
    paddingVertical: SIZES.padding.medium,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  greeting: {
    fontSize: SIZES.large,
    ...FONTS.bold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: SIZES.font,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  profileButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  servicesContainer: {
    padding: SIZES.padding.large,
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    ...FONTS.semiBold,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.medium,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    padding: SIZES.padding.medium,
    marginBottom: SIZES.padding.medium,
    ...SHADOWS.medium,
    elevation: 4,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding.medium,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: SIZES.medium,
    ...FONTS.semiBold,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: SIZES.font,
    color: COLORS.text.secondary,
  },
  arrowContainer: {
    padding: 5,
  },
  promotionsContainer: {
    paddingVertical: SIZES.padding.medium,
  },
  promoScroll: {
    paddingHorizontal: SIZES.padding.large,
  },
  promoCard: {
    width: width * 0.7,
    height: 120,
    borderRadius: SIZES.radiusMedium,
    marginRight: SIZES.padding.medium,
    padding: SIZES.padding.medium,
    flexDirection: 'row',
  },
  promoContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  promoTitle: {
    fontSize: SIZES.medium,
    ...FONTS.bold,
    color: COLORS.white,
  },
  promoDiscount: {
    fontSize: SIZES.large,
    ...FONTS.bold,
    color: COLORS.white,
  },
  promoCodeContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: SIZES.radiusSmall,
    alignSelf: 'flex-start',
  },
  promoCode: {
    fontSize: SIZES.font,
    color: COLORS.white,
    ...FONTS.semiBold,
  },
  promoImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  featuresContainer: {
    padding: SIZES.padding.large,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    padding: SIZES.padding.medium,
    marginBottom: SIZES.padding.medium,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: SIZES.font,
    color: COLORS.text.primary,
    ...FONTS.medium,
  },
});