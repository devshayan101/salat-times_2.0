import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const KAABA_COORDS = {
  latitude: 21.4225,
  longitude: 39.8262,
};

export default function QiblaScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        // Calculate Qibla direction
        const lat1 = location.coords.latitude * (Math.PI / 180);
        const lon1 = location.coords.longitude * (Math.PI / 180);
        const lat2 = KAABA_COORDS.latitude * (Math.PI / 180);
        const lon2 = KAABA_COORDS.longitude * (Math.PI / 180);

        const y = Math.sin(lon2 - lon1);
        const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(lon2 - lon1);
        const qibla = Math.atan2(y, x) * (180 / Math.PI);
        setQiblaDirection(qibla);
      } catch (err) {
        setError('Failed to determine Qibla direction');
      }
    })();
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withSpring(`${qiblaDirection}deg`, {
            damping: 20,
            stiffness: 90,
          }),
        },
      ],
    };
  });

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Qibla Direction</Text>
      <View style={styles.compassContainer}>
        <Animated.View style={[styles.compass, animatedStyle]}>
          <Svg height="200" width="200" viewBox="0 0 24 24">
            <Path
              d="M12 2L8 12L12 22L16 12L12 2Z"
              fill="#60A5FA"
              stroke="#1F2937"
              strokeWidth="1"
            />
          </Svg>
        </Animated.View>
      </View>
      <Text style={styles.coordinates}>
        {location
          ? `📍 ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
          : 'Determining location...'}
      </Text>
      {qiblaDirection && (
        <Text style={styles.degrees}>{Math.round(qiblaDirection)}° from North</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 40,
  },
  compassContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#1F2937',
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
  },
  coordinates: {
    marginTop: 40,
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  degrees: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '600',
    color: '#60A5FA',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
});