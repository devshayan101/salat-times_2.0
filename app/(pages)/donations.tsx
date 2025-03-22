import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';

export default function DonationsScreen() {
  const { theme } = useTheme();
  
  const donationOptions = [
    { amount: 5, description: 'Support our basic server costs' },
    { amount: 10, description: 'Help us improve prayer time accuracy' },
    { amount: 25, description: 'Support new feature development' },
    { amount: 50, description: 'Become a major supporter' },
    { amount: 100, description: 'Help us reach more Muslims worldwide' },
  ];
  
  const handleDonate = (amount: number) => {
    // In a real app, this would open a payment gateway
    Linking.openURL('https://sawadeazam.org/pe/');
    console.log(`Donating $${amount}`);
    // You could use something like Stripe, PayPal, etc.
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={styles.container}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Support Our Mission</Text>
          
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
          />
          
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your donations help us maintain and improve SalatTimes app, ensuring Muslims worldwide
            have access to accurate prayer times and Islamic tools.
          </Text>
          
          <View style={styles.donationOptionsContainer}>
            {donationOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.donationOption, { backgroundColor: theme.cardBackground, borderColor: theme.divider }]}
                onPress={() => handleDonate(option.amount)}
              >
                <View style={[styles.amountBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.amountText}>${option.amount}</Text>
                </View>
                <Text style={[styles.donationDescription, { color: theme.textPrimary }]}>
                  {option.description}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={theme.primary} />
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={[styles.customAmountButton, { borderColor: theme.primary }]}
            onPress={() => {Linking.openURL('https://sawadeazam.org/pe/');}}
          >
            <Text style={[styles.customAmountText, { color: theme.primary }]}>
              Enter Custom Amount
            </Text>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>How Your Donation Helps</Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="server-outline" size={24} color={theme.primary} style={styles.benefitIcon} />
              <View style={styles.benefitTextContainer}>
                <Text style={[styles.benefitTitle, { color: theme.textPrimary }]}>Server Costs</Text>
                <Text style={[styles.benefitDescription, { color: theme.textSecondary }]}>
                  Helps us maintain our servers and databases for accurate prayer times.
                </Text>
              </View>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="code-outline" size={24} color={theme.primary} style={styles.benefitIcon} />
              <View style={styles.benefitTextContainer}>
                <Text style={[styles.benefitTitle, { color: theme.textPrimary }]}>Development</Text>
                <Text style={[styles.benefitDescription, { color: theme.textSecondary }]}>
                  Supports our developers in creating new features and improvements.
                </Text>
              </View>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="globe-outline" size={24} color={theme.primary} style={styles.benefitIcon} />
              <View style={styles.benefitTextContainer}>
                <Text style={[styles.benefitTitle, { color: theme.textPrimary }]}>Expansion</Text>
                <Text style={[styles.benefitDescription, { color: theme.textSecondary }]}>
                  Helps us reach more Muslims around the world with our app.
                </Text>
              </View>
            </View>
          </View>
          
          <Text style={[styles.thankYouText, { color: theme.textSecondary }]}>
            Thank you for your support! May Allah reward your generosity.
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
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  donationOptionsContainer: {
    marginBottom: 16,
  },
  donationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  amountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  amountText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  donationDescription: {
    flex: 1,
    fontSize: 16,
  },
  customAmountButton: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  customAmountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  benefitsList: {
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  benefitIcon: {
    marginRight: 16,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  thankYouText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
}); 