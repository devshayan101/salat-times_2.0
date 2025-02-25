import React from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PrayerTimes } from '../types';
import { schedulePrayerNotifications } from '../services/notificationService';

interface NotificationToggleProps {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  prayerTimes: PrayerTimes | null;
  selectedDate: Date;
}

export const NotificationToggle = React.memo(({ 
  notificationsEnabled, 
  setNotificationsEnabled,
  prayerTimes,
  selectedDate
}: NotificationToggleProps) => {
  const handleNotificationToggle = async (value: boolean) => {
    try {
      if (Platform.OS === 'web') {
        alert('Notifications are not supported on web platforms');
        return;
      }

      if (value) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          setNotificationsEnabled(true);
          if (prayerTimes) {
            await schedulePrayerNotifications(prayerTimes, selectedDate);
          }
        }
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      setNotificationsEnabled(false);
    }
  };

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={styles.notificationToggle}>
      <Text style={styles.notificationText}>Prayer Time Notifications</Text>
      <Switch
        value={notificationsEnabled}
        onValueChange={handleNotificationToggle}
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