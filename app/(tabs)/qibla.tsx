import React, { useEffect } from 'react';
import LazyLoadComponent from '../components/LazyLoadComponent';
import { View, Text } from 'react-native';
import * as Location from 'expo-location';

// Define a type to handle the internal API
type LocationWithInternals = typeof Location & {
  _subscriptions?: Record<string, any>;
  _removeSubscription?: (subscription: { watchId: string }) => void;
}

// This is a lightweight wrapper around the QiblaScreen that helps with proper loading
export default function QiblaTab() {
  // Clear any existing resources when the component unmounts
  useEffect(() => {
    return () => {
      // Clean up any potential resources that might be leaked
      console.log('Qibla tab unmounted - cleanup performed');
      
      // Force cleanup any dangling Location subscriptions
      try {
        // Cast to our internal type
        const locationInternal = Location as LocationWithInternals;
        
        if (locationInternal._subscriptions) {
          console.log('Forcing cleanup of remaining Location subscriptions');
          Object.keys(locationInternal._subscriptions).forEach(key => {
            try {
              if (locationInternal._removeSubscription) {
                locationInternal._removeSubscription({ watchId: key });
              }
            } catch (e) {
              console.log(`Error cleaning up subscription ${key}:`, e);
            }
          });
        }
      } catch (err) {
        console.error('Error during Location subscription cleanup:', err);
      }
    };
  }, []);

  return (
    <LazyLoadComponent 
      importFunc={() => import('../screens/QiblaScreen')
        .then(module => {
          // Validate the module has a default export
          if (!module || !module.default) {
            console.error('QiblaScreen module does not have a default export');
            throw new Error('Failed to load QiblaScreen component');
          }
          return module;
        })
        .catch(error => {
          console.error('Error loading Qibla component:', error);
          // Return a fallback component
          return {
            default: () => (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text>Unable to load Qibla direction. Please restart the app.</Text>
              </View>
            )
          };
        })
      }
      loadingMessage="Loading Qibla direction..."
    />
  );
}