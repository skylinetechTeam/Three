import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import driverAuthService from '../services/driverAuthService';

/**
 * Componente para exibir avatar do motorista
 * Busca a foto do Supabase usando o driverId dos dados da API
 */
const DriverAvatar = ({ driverId, size = 50, style }) => {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadDriverPhoto();
  }, [driverId]);

  const loadDriverPhoto = async () => {
    if (!driverId) {
      setLoading(false);
      setError(true);
      return;
    }

    try {
      setLoading(true);
      setError(false);
      
      // Buscar URL da foto do Supabase
      const url = await driverAuthService.getDriverPhotoUrl(driverId);
      
      if (url) {
        setPhotoUrl(url);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Erro ao carregar foto do motorista:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const avatarSize = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (loading) {
    return (
      <View style={[styles.container, avatarSize, style]}>
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  }

  if (error || !photoUrl) {
    // Fallback: ícone padrão se não tiver foto
    return (
      <View style={[styles.container, styles.placeholder, avatarSize, style]}>
        <Ionicons name="person" size={size * 0.6} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: photoUrl }}
      style={[styles.image, avatarSize, style]}
      onError={() => setError(true)}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#E5E7EB',
  },
  image: {
    resizeMode: 'cover',
  },
});

export default DriverAvatar;
