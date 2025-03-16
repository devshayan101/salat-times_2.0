import React from 'react';
import { View, Text, StyleSheet, Switch, Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PrayerTimes, PrayerSoundPreferences } from '../types';
import { schedulePrayerNotifications, clearAllPrayerNotifications } from '../services/notificationService';

interface NotificationToggleProps {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  prayerTimes: PrayerTimes | null;
  selectedDate: Date;
  prayerSounds?: PrayerSoundPreferences;
}

export const NotificationToggle = React.memo(({ 
  notificationsEnabled, 
  setNotificationsEnabled,
  prayerTimes,
  selectedDate,
  prayerSounds = {
    Fajr: { enabled: true, sound: 'default_beep' },
    Dhuhr: { enabled: true, sound: 'default_beep' },
    Asr: { enabled: true, sound: 'default_beep' },
    Maghrib: { enabled: true, sound: 'default_beep' },
    Isha: { enabled: true, sound: 'default_beep' }
  }
}: NotificationToggleProps) => {
  const toggleNotifications = async () => {
    try {
      if (!notificationsEnabled) {
        // User is enabling notifications
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
          return;
        }
        
        // Set notifications enabled first
        setNotificationsEnabled(true);
        
        // This will now schedule only the current prayer notification
        if (prayerTimes) {
          await schedulePrayerNotifications(prayerTimes, selectedDate, prayerSounds);
        }
      } else {
        // User is disabling notifications
        await Notifications.cancelAllScheduledNotificationsAsync();
        await clearAllPrayerNotifications();
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to toggle notifications. Please try again.');
    }
  };

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={styles.notificationToggle}>
      <Text style={styles.notificationText}>Salat Time Notifications</Text>
      <Switch
        value={notificationsEnabled}
        onValueChange={(value) => {
          // Only proceed if the value is changing
          if (value !== notificationsEnabled) {
            toggleNotifications();
          }
        }}
        trackColor={{ false: '#4B5563', true: '#4B5563' }}
        thumbColor={notificationsEnabled ? '#60A5FA' : '#9CA3AF'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  notificationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  notificationText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
}); 
export default NotificationToggle;