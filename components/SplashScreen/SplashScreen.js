import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../config/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Travel</Text>
        <Text style={styles.slogan}>Viaje com conforto e segurança</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1737e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 60,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
    letterSpacing: 2,
  },
  slogan: {
    fontSize: SIZES.medium,
    color: COLORS.white,
    letterSpacing: 1,
  },
});

export default SplashScreen; 