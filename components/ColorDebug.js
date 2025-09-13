// Temporary color debug component to verify theme is working
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';

const ColorDebug = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Color Debug</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Primary Colors</Text>
        <View style={[styles.colorBox, { backgroundColor: COLORS.primary[500] }]}>
          <Text style={styles.colorText}>Primary 500: {COLORS.primary[500]}</Text>
        </View>
        <View style={[styles.colorBox, { backgroundColor: COLORS.primary[600] }]}>
          <Text style={styles.colorText}>Primary 600: {COLORS.primary[600]}</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Surface Colors</Text>
        <View style={[styles.colorBox, { backgroundColor: COLORS.surface.background, borderWidth: 1, borderColor: '#ccc' }]}>
          <Text style={[styles.colorText, { color: '#000' }]}>Background: {COLORS.surface.background}</Text>
        </View>
        <View style={[styles.colorBox, { backgroundColor: COLORS.surface.card, borderWidth: 1, borderColor: '#ccc' }]}>
          <Text style={[styles.colorText, { color: '#000' }]}>Card: {COLORS.surface.card}</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text Colors</Text>
        <View style={[styles.colorBox, { backgroundColor: '#f0f0f0' }]}>
          <Text style={[styles.colorText, { color: COLORS.text.primary }]}>Primary Text: {COLORS.text.primary}</Text>
          <Text style={[styles.colorText, { color: COLORS.text.secondary }]}>Secondary Text: {COLORS.text.secondary}</Text>
          <Text style={[styles.colorText, { color: COLORS.text.light }]}>Light Text: {COLORS.text.light}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.surface.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.text.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: COLORS.text.primary,
  },
  colorBox: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    minHeight: 60,
    justifyContent: 'center',
  },
  colorText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.inverse,
  },
});

export default ColorDebug;