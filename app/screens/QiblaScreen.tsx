import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform, AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

const KAABA_COORDS = {
  latitude: 21.4225,
  longitude: 39.8262,
};

export default function QiblaScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const qiblaDirectionValue = useSharedValue(0);
  const headingValue = useSharedValue(0);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const router = useRouter();
  const isFocused = useIsFocused();
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const appState = useRef(AppState.currentState);

  // Setup location and calculate Qibla direction
  useEffect(() => {
    let isMounted = true;
    
    const setupLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        if (isMounted) {
          setLocation(location);

          // Calculate Qibla direction
          const lat1 = location.coords.latitude * (Math.PI / 180);
          const lon1 = location.coords.longitude * (Math.PI / 180);
          const lat2 = KAABA_COORDS.latitude * (Math.PI / 180);
          const lon2 = KAABA_COORDS.longitude * (Math.PI / 180);

          const y = Math.sin(lon2 - lon1);
          const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(lon2 - lon1);
          const qibla = Math.atan2(y, x) * (180 / Math.PI);
          qiblaDirectionValue.value = qibla;
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to determine Qibla direction');
        }
      }
    };

    if (isFocused) {
      setupLocation();
    }

    return () => {
      isMounted = false;
    };
  }, [isFocused]);

  // Handle heading subscription based on focus state
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to background, clean up resources
        cleanupHeadingSubscription();
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active' && isFocused) {
        // App is coming to foreground and screen is focused, restart subscription
        startWatchingHeading();
      }
      appState.current = nextAppState;
    };

    // Subscribe to AppState changes for additional cleanup
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Start or stop watching heading based on focus
    if (isFocused) {
      startWatchingHeading();
    } else {
      cleanupHeadingSubscription();
    }

    return () => {
      cleanupHeadingSubscription();
      subscription.remove();
    };
  }, [isFocused]);

  const cleanupHeadingSubscription = () => {
    if (headingSubscriptionRef.current) {
      headingSubscriptionRef.current.remove();
      headingSubscriptionRef.current = null;
      console.log('Cleaned up heading subscription');
    }
  };

  const startWatchingHeading = async () => {
    try {
      // Clean up any existing subscription first
      cleanupHeadingSubscription();

      // Only start a new subscription if we're focused
      if (isFocused) {
        headingSubscriptionRef.current = await Location.watchHeadingAsync((headingData) => {
          const newHeading = headingData.trueHeading || headingData.magHeading;
          setHeading(newHeading);
          headingValue.value = newHeading;
        });
        console.log('Started heading subscription');
      }
    } catch (err) {
      setError('Failed to access compass. Please check if your device has a compass sensor.');
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    // Calculate rotation directly in the worklet
    const rotationDegrees = heading === null 
      ? qiblaDirectionValue.value 
      : qiblaDirectionValue.value - headingValue.value;
    
    return {
      transform: [
        {
          rotate: withSpring(`${rotationDegrees}deg`, {
            damping: 20,
            stiffness: 90,
          }),
        },
      ],
    };
  });

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background, zIndex: 1 }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Qibla Direction</Text>
      <View style={[styles.compassContainer, { backgroundColor: theme.surface }]}>
        <Animated.View style={[styles.compass, animatedStyle]}>
          <Svg height="200" width="200" viewBox="0 0 100 100">
            {/* Kaaba Icon */}
            <Path
              d="M30 30 L70 30 L70 70 L30 70 Z"
              fill="#000000"
              stroke="#000000"
              strokeWidth="2"
            />
            {/* Kaaba Door */}
            <Path
              d="M45 70 L45 55 L55 55 L55 70"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2"
            />
            {/* Kiswa Pattern - Gold Decoration */}
            <Path
              d="M30 40 L70 40"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1"
            />
            <Path
              d="M30 50 L70 50"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1"
            />
            <Path
              d="M30 60 L70 60"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1"
            />
            {/* Direction Indicator */}
            <Path
              d="M50 10 L45 25 L50 20 L55 25 Z"
              fill={theme.primary}
              stroke={theme.divider}
              strokeWidth="1"
            />
          </Svg>
        </Animated.View>
      </View>
      <Text style={[styles.coordinates, { color: theme.textSecondary }]}>
        {location
          ? `📍 ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
          : 'Determining location...'}
      </Text>
      <Text style={[styles.degrees, { color: theme.primary }]}>
        {qiblaDirectionValue ? `${Math.round(qiblaDirectionValue.value)}° from North` : ''}
      </Text>
      {heading !== null && (
        <Text style={[styles.heading, { color: theme.textSecondary }]}>
          Compass heading: {Math.round(heading)}°
        </Text>
      )}
      <Text style={[styles.instructions, { color: theme.textSecondary }]}>
        The arrow will automatically point to the Qibla direction as you rotate your device
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 40,
  },
  compassContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  compass: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordinates: {
    marginTop: 40,
    fontSize: 16,
    textAlign: 'center',
  },
  degrees: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '600',
  },
  heading: {
    marginTop: 10,
    fontSize: 16,
  },
  instructions: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 