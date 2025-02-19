import { useEffect, useState } from 'react';
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
  latitude: number,
  longitude: number,
  elevation: number,
  isMaghribOrSunrise: boolean,
  isFajrOrIsha: boolean
): number {
  // Calculate days from January 1st
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const G = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;

  // Calculate C parameter
  const H = 360 / 365.24;
  const solarDeclination = 23.44 * Math.cos((H * (G + 10) + 1.9137 * Math.sin(H * (G - 2))) * (Math.PI / 180));
  const C = Math.asin(Math.sin(solarDeclination * (Math.PI / 180))) * (180 / Math.PI);

  // Calculate A parameter based on prayer type and elevation
  const sqrtE = Math.sqrt(elevation);
  const A = isMaghribOrSunrise || isFajrOrIsha
    ? (isMaghribOrSunrise ? 91 : 110) + sqrtE * 0.0347
    : 90;

  // Convert latitude to radians
  const B = latitude * (Math.PI / 180);
  const CRad = C * (Math.PI / 180);

  // Main calculation
  const cosA = Math.cos(A * (Math.PI / 180));
  const cosB = Math.cos(B);
  const cosC = Math.cos(CRad);
  const tanB = Math.tan(B);
  const tanC = Math.tan(CRad);

  const innerFormula = (cosA / (cosB * cosC)) - (tanB * tanC);
  const arcCos = Math.acos(innerFormula) * (180 / Math.PI);

  return isFajrOrIsha ? (arcCos / 15) : -(arcCos / 15);
}

function calculatePrayerTimes(date: Date, latitude: number, longitude: number, elevation: number): PrayerTimes {
  const dhuhrTime = calculateDhuhr(longitude, date);
  const [dhuhrHours, dhuhrMinutes] = dhuhrTime.split(':').map(Number);

  const fajrOffset = calculatePrayerTime(date, latitude, longitude, elevation, false, true);
  const sunriseOffset = calculatePrayerTime(date, latitude, longitude, elevation, true, false);
  const asrOffset = calculatePrayerTime(date, latitude, longitude, elevation, false, false);
  const maghribOffset = calculatePrayerTime(date, latitude, longitude, elevation, true, false);
  const ishaOffset = calculatePrayerTime(date, latitude, longitude, elevation, false, true);

  const formatTime = (baseHours: number, offset: number) => {
    const totalMinutes = (baseHours * 60) + dhuhrMinutes + (offset * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const adjustedHours = (hours + 24) % 24; // Ensure hours are between 0-23
    return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return {
    Fajr: formatTime(dhuhrHours, fajrOffset),
    Sunrise: formatTime(dhuhrHours, sunriseOffset),
    Dhuhr: dhuhrTime,
    Asr: formatTime(dhuhrHours, asrOffset),
    Maghrib: formatTime(dhuhrHours, maghribOffset),
    Isha: formatTime(dhuhrHours, ishaOffset),
  };
}

export default function PrayerTimesScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const updatePrayerTimes = (date: Date, coords: { latitude: number; longitude: number; altitude: number }) => {
    try {
      const times = calculatePrayerTimes(date, coords.latitude, coords.longitude, coords.altitude || 0);
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

        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        updatePrayerTimes(selectedDate, location.coords);
      } catch (err) {
        setError('Failed to get location');
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (location) {
      updatePrayerTimes(selectedDate, location.coords);
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