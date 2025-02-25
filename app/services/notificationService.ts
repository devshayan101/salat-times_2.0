import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PrayerTimes } from '../types';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'Prayer Times',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function schedulePrayerNotifications(prayerTimes: PrayerTimes, selectedDate: Date) {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const prayers = [
      { name: 'Fajr', time: prayerTimes.Fajr },
      { name: 'Sunrise', time: prayerTimes.Sunrise },
      { name: 'Dhuhr', time: prayerTimes.Dhuhr },
      { name: 'Asr', time: prayerTimes.Asr },
      { name: 'Maghrib', time: prayerTimes.Maghrib },
      { name: 'Isha', time: prayerTimes.Isha },
    ];

    for (const prayer of prayers) {
      const [hours, minutesStr] = prayer.time.split(':')[0].split(' ')[0].split(':');
      const period = prayer.time.includes('PM') ? 'PM' : 'AM';
      const minutes = parseInt(minutesStr);
      
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;

      const now = new Date();
      const scheduledTime = new Date(selectedDate);
      scheduledTime.setHours(hour24, minutes, 0, 0);
      
      if (scheduledTime < now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Prayer Time',
          body: `It's time for ${prayer.name} prayer`,
        },
        trigger: {
          hour: hour24,
          minute: minutes,
          repeats: true,
          type: Platform.OS === 'android' ? 'daily' : 'calendar'
        },
      });
    }
  } catch (error) {
    console.error('Failed to schedule notifications:', error);
    throw error;
  }
} 