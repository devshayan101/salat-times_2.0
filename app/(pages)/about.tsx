import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';

export default function AboutScreen() {
  const { theme } = useTheme();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={styles.container}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>About Us</Text>
          
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
          />
          
          <Text style={[styles.subtitle, { color: theme.primary }]}>SalatTimes App</Text>
          
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            SalatTimes is a comprehensive Islamic prayer times application designed to help Muslims
            keep track of their daily prayers with accurate timings based on their location.
          </Text>
          
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Our app provides accurate prayer times, Qibla direction, Tasbih counter, and other
            useful features for Muslims around the world.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Our Mission</Text>
          
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Our mission is to provide Muslims with reliable and easy-to-use tools that help them
            fulfill their religious obligations and enhance their spiritual journey.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Features</Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={[styles.featureBullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                Accurate prayer times based on your location
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={[styles.featureBullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                Qibla direction finder
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={[styles.featureBullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                Digital Tasbih counter
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={[styles.featureBullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                Hijri calendar
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={[styles.featureBullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                Sehri and Iftar times
              </Text>
            </View>
          </View>
          
          <Text style={[styles.version, { color: theme.textDisabled }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
  featureList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 18,
    marginRight: 8,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  version: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
}); 