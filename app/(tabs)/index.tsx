import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Pressable } from 'react-native';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Audio } from 'expo-av';

import { PrayerTimes, Coordinates } from '../types';
import { calculatePrayerTimes } from '../services/prayerTimeCalculator';
import { setNotificationChannel, schedulePrayerNotifications } from '../services/notificationService';
import { PrayerCard } from '../components/PrayerCard';
import { NotificationToggle } from '../components/NotificationToggle';
import { AsrMethodModal } from '../components/AsrMethodModal';

export default function PrayerTimesScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showAsrModal, setShowAsrModal] = useState(false);
  const [asrMethod, setAsrMethod] = useState(2); // Default to Hanafi method

  //make 'hanafi' color blue - denoting hyperlink
  //Time remaining for prayer.
  //tasbih counter
  //Qibla direction with compass
  //Advert page - option to push Advert to Advert page.
  //Custom message page - option to push message to page.

  
  useEffect(() => {
    setNotificationChannel();
  }, []);

  const updatePrayerTimes = async (date: Date, coords: Coordinates) => {
    try {
      setLoading(true);
      const times = calculatePrayerTimes(date, coords, asrMethod);
      setPrayerTimes(times);
      if (notificationsEnabled) {
        await schedulePrayerNotifications(times, date);
      }
    } catch (err) {
      console.error('Error updating prayer times:', err);
      setError('Failed to calculate prayer times');
    } finally {
      setLoading(false);
    }
  };

  const playBeepSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/beep.mp3')
      );
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
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

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation
        });
        
        setLocation(location);

        const coords: Coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: Math.max(0, location.coords.altitude ?? 0)
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
      updatePrayerTimes(selectedDate, coords);
    }
  }, [selectedDate, location, asrMethod]);

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

      <NotificationToggle
        notificationsEnabled={notificationsEnabled}
        setNotificationsEnabled={setNotificationsEnabled}
        prayerTimes={prayerTimes}
        selectedDate={selectedDate}
      />

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
          <PrayerCard name="Ishraq" time={prayerTimes.Ishraq} />
          <PrayerCard name="Zawal Time" time={prayerTimes.Zawal} />
          <PrayerCard name="Dhuhr" time={prayerTimes.Dhuhr} />
          <PrayerCard 
            name="Asr" 
            time={prayerTimes.Asr} 
            isAsr={true}
            asrMethod={asrMethod}
            onAsrPress={() => setShowAsrModal(true)}
          />
          <PrayerCard name="Maghrib" time={prayerTimes.Maghrib} />
          <PrayerCard name="Isha" time={prayerTimes.Isha} />
        </>
      )}

      <AsrMethodModal
        visible={showAsrModal}
        onClose={() => setShowAsrModal(false)}
        selectedMethod={asrMethod}
        onMethodChange={(method) => {
          setAsrMethod(method);
          setShowAsrModal(false);
        }}
      />
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
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
});