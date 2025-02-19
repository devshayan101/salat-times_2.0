import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Pressable } from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
  altitude: number;
}

function calculateDhuhr(longitude: number, date: Date): string {
  // Calculate days from January 1st
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  
  // Calculate B parameter
  const B = (360 / 365.24) * (days - 81);
  const BRad = B * (Math.PI / 180); // Convert to radians
  
  // Get UTC offset in hours
  const Y = -date.getTimezoneOffset() / 60;
  
  // Main calculation
  const timeEquation = (9.87 * Math.sin(2 * BRad) - 7.53 * Math.cos(BRad) - 1.5 * Math.sin(BRad)) / 60;
  const dhuhrTime = Y - (longitude / 15) + 12 - timeEquation;
  
  // Convert to HH:MM format
  const hours = Math.floor(dhuhrTime);
  const minutes = Math.round((dhuhrTime - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function calculatePrayerTime(
  date: Date,
  coordinates: Coordinates,
  isMaghribOrSunrise: boolean,
  isFajrOrIsha: boolean,
  salat: string
): number {
  // Calculate days from January 1st
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const G = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  console.log('G', G);
  // Calculate C parameter
  const H = 360 / 365.24;
  
  // Calculate the inner expression
  const inner = H * (G + 10) + 1.9137 * Math.sin(H * (G - 2) * (Math.PI / 180)); // Ensure radians

  console.log(inner); // Output the value of inner
  const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);
  const radiansToDegrees = (radians: number) => radians * (180 / Math.PI);

  // Calculate C
  const sin23_44 = Math.sin(degreesToRadians(23.44));
  const cosInner = Math.cos(degreesToRadians(inner));
  const value = sin23_44 * cosInner;

  const C = -Math.asin(value); // C in radians
  const C_degrees = radiansToDegrees(C); // Convert C to degrees

  console.log('C_degrees',C_degrees); // Output the value of C

  // Calculate A parameter based on prayer type and elevation
  console.log('elevation',coordinates.altitude+10);
  const sqrtE = Math.sqrt(coordinates.altitude + 10);
  
  // let A = 90; // Default for Asr  
  // if (isMaghribOrSunrise) {
  //   A = 91 + sqrtE * 0.0347;
  // } else if (isFajrOrIsha) {
  //   A = 110 + sqrtE * 0.0347;
  // }

  const A = isMaghribOrSunrise || isFajrOrIsha
    ? (isMaghribOrSunrise ? 91 : 110) + sqrtE * 0.0347
    : 90; // Default for Asr

  // from degrees to radians before calculating its sine. This is necessary because trigonometric functions in JavaScript expect angles in radians.
  // Convert latitude to radians
  const latRad = coordinates.latitude * (Math.PI / 180);
  const CRad = C * (Math.PI / 180);
  const ARad = A * (Math.PI / 180);

  // Main calculation
  const cosA = Math.cos(ARad);
  const cosLat = Math.cos(latRad);
  const cosC = Math.cos(CRad);
  const tanLat = Math.tan(latRad);
  const tanC = Math.tan(C);

  // Log intermediate values for debugging
  console.log({
    salat,
    A,
    latitude: coordinates.latitude,
    C: C_degrees,
    cosA: cosA.toFixed(6),
    cosLat: cosLat.toFixed(6),
    cosC: cosC.toFixed(6),
    tanLat: tanLat.toFixed(6),
    tanC: tanC.toFixed(6)
  });

  // Calculate step by step
  const term1 = cosA / (cosLat * cosC);
  const term2 = tanLat * tanC;
  const innerFormula = term1 - term2;
  
  console.log({
    salat,
    term1: term1.toFixed(6),
    term2: term2.toFixed(6),
    innerFormula: innerFormula.toFixed(6)
  });

  // Ensure the value is within valid arccos range (-1 to 1)
  const clampedInnerFormula = Math.max(-1, Math.min(1, innerFormula));
  const arcCos = Math.acos(clampedInnerFormula) * (180 / Math.PI);
  const timeOffset = arcCos / 15;

  console.log({
    salat,
    arcCos: arcCos.toFixed(6),
    timeOffset: timeOffset.toFixed(6)
  });

  return timeOffset;
}

function calculatePrayerTimes(date: Date, coordinates: Coordinates): PrayerTimes {
  const dhuhrTime = calculateDhuhr(coordinates.longitude, date);
  const [dhuhrHours, dhuhrMinutes] = dhuhrTime.split(':').map(Number);
  const dhuhrDecimal = dhuhrHours + (dhuhrMinutes / 60); // Convert to decimal hours

  // Calculate time offsets
  const fajrOffset = calculatePrayerTime(date, coordinates, false, true, 'fajr');
  const sunriseOffset = calculatePrayerTime(date, coordinates, true, false, 'sunrise');
  const asrOffset = calculatePrayerTime(date, coordinates, false, false, 'asr');
  const maghribOffset = calculatePrayerTime(date, coordinates, true, false, 'maghrib');
  const ishaOffset = calculatePrayerTime(date, coordinates, false, true, 'isha');

  const formatTime = (timeInDecimalHours: number) => {
    const hours = Math.floor(timeInDecimalHours);
    const minutes = Math.round((timeInDecimalHours - hours) * 60);
    const adjustedHours = (hours + 24) % 24; // Ensure hours are between 0-23
    return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return {
    // Subtract offset for Fajr and Sunrise
    Fajr: formatTime(dhuhrDecimal - fajrOffset),
    Sunrise: formatTime(dhuhrDecimal - sunriseOffset),
    Dhuhr: dhuhrTime,
    // Add offset for Asr, Maghrib, and Isha
    Asr: formatTime(dhuhrDecimal + asrOffset),
    Maghrib: formatTime(dhuhrDecimal + maghribOffset),
    Isha: formatTime(dhuhrDecimal + ishaOffset),
  };
}

export default function PrayerTimesScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const updatePrayerTimes = (date: Date, coords: Coordinates) => {
    try {
      const times = calculatePrayerTimes(
        date,
        coords
      );
      setPrayerTimes(times);
      setLoading(false);
    } catch (err) {
      setError('Failed to calculate prayer times');
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
          return;
        }

        // Request high accuracy for better altitude data
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation
        });
        
        setLocation(location);
        
        // Log the complete location data
        console.log('Raw location data:', {
          altitude: location.coords.altitude !== null 
            ? `${location.coords.altitude.toFixed(2)} meters` 
            : 'null',
          altitudeAccuracy: location.coords.altitudeAccuracy !== null 
            ? `±${location.coords.altitudeAccuracy.toFixed(2)} meters` 
            : 'null',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        const coords: Coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: Math.max(0, location.coords.altitude ?? 0) // Ensure non-negative
        };

        updatePrayerTimes(selectedDate, coords);
      } catch (err) {
        console.error('Location error:', err);
        setError('Failed to get location');
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (location) {
      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude ?? 0
      };
      console.log('locationData2',coords)
      updatePrayerTimes(selectedDate, coords);
    }
  }, [selectedDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const onChange = (event: any, date?: Date) => {
    const currentDate = date || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const PrayerCard = ({ name, time }: { name: string; time: string }) => (
    <LinearGradient
      colors={['#1F2937', '#374151']}
      style={styles.prayerCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}>
      <Text style={styles.prayerName}>{name}</Text>
      <Text style={styles.prayerTime}>{time}</Text>
    </LinearGradient>
  );

  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          style={{
            backgroundColor: '#374151',
            color: '#F3F4F6',
            padding: 12,
            borderRadius: 8,
            border: 'none',
            marginBottom: 20,
            width: '100%',
            fontSize: 16,
          }}
        />
      );
    }

    if (showDatePicker || Platform.OS === 'ios') {
      return (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
        />
      );
    }

    return null;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.locationText}>
        {location
          ? `📍 ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
          : 'Location not available'}
      </Text>
      
      <Pressable
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
      </Pressable>

      {renderDatePicker()}

      {prayerTimes && (
        <>
          <PrayerCard name="Fajr" time={prayerTimes.Fajr} />
          <PrayerCard name="Sunrise" time={prayerTimes.Sunrise} />
          <PrayerCard name="Dhuhr" time={prayerTimes.Dhuhr} />
          <PrayerCard name="Asr" time={prayerTimes.Asr} />
          <PrayerCard name="Maghrib" time={prayerTimes.Maghrib} />
          <PrayerCard name="Isha" time={prayerTimes.Isha} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  locationText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  dateButton: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  dateButtonText: {
    color: '#F3F4F6',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  prayerCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  prayerName: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  prayerTime: {
    color: '#60A5FA',
    fontSize: 24,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
});