import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';

export default function AdvertisementsScreen() {
  const { theme } = useTheme();
  
  const adPackages = [
    {
      name: 'Basic',
      price: '$99/month',
      features: [
        'Banner ad in app',
        '10,000 impressions',
        'Basic analytics'
      ]
    },
    {
      name: 'Standard',
      price: '$199/month',
      features: [
        'Banner ad in app',
        '25,000 impressions',
        'Detailed analytics',
        'Ad placement options'
      ]
    },
    {
      name: 'Premium',
      price: '$499/month',
      features: [
        'Banner ad in app',
        'Featured placement',
        'Unlimited impressions',
        'Advanced analytics',
        'Custom targeting options',
        'Priority support'
      ]
    }
  ];
  
  const handlePackageSelect = (packageName: string) => {
    // In a real app, this would navigate to a form or contact page
    console.log(`Selected package: ${packageName}`);
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={styles.container}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Advertise With Us</Text>
          
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Reach thousands of Muslims daily through our app. We offer various advertising packages
            to suit your needs and budget.
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={[styles.statItem, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>10K+</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Daily Users</Text>
            </View>
            
            <View style={[styles.statItem, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>50+</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Countries</Text>
            </View>
            
            <View style={[styles.statItem, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>85%</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Engagement</Text>
            </View>
          </View>
          
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Advertising Packages</Text>
          
          {adPackages.map((pkg, index) => (
            <View 
              key={index} 
              style={[styles.packageCard, { 
                backgroundColor: theme.cardBackground,
                borderColor: theme.divider
              }]}
            >
              <Text style={[styles.packageName, { color: theme.primary }]}>{pkg.name}</Text>
              <Text style={[styles.packagePrice, { color: theme.textPrimary }]}>{pkg.price}</Text>
              
              <View style={styles.featuresList}>
                {pkg.features.map((feature, featureIndex) => (
                  <View key={featureIndex} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.success} style={styles.featureIcon} />
                    <Text style={[styles.featureText, { color: theme.textSecondary }]}>{feature}</Text>
                  </View>
                ))}
              </View>
              
              <TouchableOpacity
                style={[styles.selectButton, { backgroundColor: theme.primary }]}
                onPress={() => handlePackageSelect(pkg.name)}
              >
                <Text style={styles.selectButtonText}>Select Package</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <Text style={[styles.contactTitle, { color: theme.textPrimary }]}>Custom Advertising Solutions</Text>
          
          <Text style={[styles.contactText, { color: theme.textSecondary }]}>
            Looking for a custom advertising solution? Contact our advertising team to discuss your specific needs.
          </Text>
          
          <TouchableOpacity
            style={[styles.contactButton, { borderColor: theme.primary }]}
            onPress={() => {/* Navigate to contact page */}}
          >
            <Text style={[styles.contactButtonText, { color: theme.primary }]}>Contact Advertising Team</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  packageCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 16,
  },
  selectButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  contactButton: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 