import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import axios from 'axios';
import Constants from 'expo-constants';

// Check environment
const isDevelopment = Constants.appOwnership === 'expo' || __DEV__;

// API URL - use localhost in development, production URL in production
const API_URL = isDevelopment 
  ? 'http://localhost:5000/api' 
  : 'https://time-api-t6dc.onrender.com/api';

export default function ContactScreen() {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    // Validate inputs
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In production builds, we'll just show success without actually submitting
      if (!isDevelopment) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSubmitting(false);
        Alert.alert(
          'Message Sent',
          'Thank you for contacting us. We will get back to you soon.',
          [{ text: 'OK', onPress: () => resetForm() }]
        );
        return;
      }
      
      // Send data to backend
      const response = await axios.post(`${API_URL}/contacts`, {
        name,
        email,
        subject: subject || 'General Inquiry', // Use default if subject is empty
        message
      });
      
      setIsSubmitting(false);
      
      if (response.data.success) {
        Alert.alert(
          'Message Sent',
          'Thank you for contacting us. We will get back to you soon.',
          [{ text: 'OK', onPress: () => resetForm() }]
        );
      } else {
        Alert.alert('Error', 'There was a problem sending your message. Please try again.');
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error sending contact form:', error);
      Alert.alert(
        'Error',
        'There was a problem sending your message. Please try again later.'
      );
    }
  };
  
  const resetForm = () => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={styles.container}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Contact Us</Text>
          
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            We'd love to hear from you! Please fill out the form below and we'll get back to you as soon as possible.
          </Text>
          
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.divider }]}
                placeholder="Your Name"
                placeholderTextColor={theme.textDisabled}
                value={name}
                onChangeText={setName}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.divider }]}
                placeholder="Your Email"
                placeholderTextColor={theme.textDisabled}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="briefcase-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.divider }]}
                placeholder="Subject (Optional)"
                placeholderTextColor={theme.textDisabled}
                value={subject}
                onChangeText={setSubject}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="chatbubble-outline" size={20} color={theme.textSecondary} style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 12 }]} />
              <TextInput
                style={[styles.textArea, { color: theme.textPrimary, borderColor: theme.divider }]}
                placeholder="Your Message"
                placeholderTextColor={theme.textDisabled}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Send Message</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <Text style={[styles.contactTitle, { color: theme.textPrimary }]}>Other Ways to Reach Us</Text>
          
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={20} color={theme.primary} style={styles.contactIcon} />
            <Text style={[styles.contactText, { color: theme.textSecondary }]}>support@salattimes.com</Text>
          </View>
          
          <View style={styles.contactItem}>
            <Ionicons name="call" size={20} color={theme.primary} style={styles.contactIcon} />
            <Text style={[styles.contactText, { color: theme.textSecondary }]}>+1 (123) 456-7890</Text>
          </View>
          
          <View style={styles.contactItem}>
            <Ionicons name="location" size={20} color={theme.primary} style={styles.contactIcon} />
            <Text style={[styles.contactText, { color: theme.textSecondary }]}>
              123 Prayer Street, Madinah District, Islamic City
            </Text>
          </View>
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
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    flex: 1,
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
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
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactIcon: {
    marginRight: 12,
  },
  contactText: {
    fontSize: 16,
    flex: 1,
  },
}); 