import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';

interface FallbackScreenProps {
  message?: string;
}

export const FallbackScreen: React.FC<FallbackScreenProps> = ({ 
  message = 'Loading application...' 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <ActivityIndicator size="large" color="#10B981" style={styles.spinner} />
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.submessage}>
          Please wait while we prepare your app
        </Text>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937', // Match splash screen background
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width,
    height
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  spinner: {
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  submessage: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
  }
});

export default FallbackScreen; 