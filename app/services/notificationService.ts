import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PrayerTimes } from '../types';

// Fixed notification IDs to maintain persistence
const PRAYER_NOTIFICATION_ID = 'prayer-countdown';
const PRAYER_ALERT_NOTIFICATION_ID = 'prayer-alert';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

//Add notification for ios


export async function setNotificationChannel() {
  if (Platform.OS === 'android') {
    // Main prayer times notification channel
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'Salat Times',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
    
    // Countdown notification channel (for persistent updates)
    await Notifications.setNotificationChannelAsync('prayer-countdown', {
      name: 'Prayer Countdown',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: false,
      vibrationPattern: [0, 0, 0, 0], // No vibration for updates
    });
  }
}

export async function showRemainingTimeNotification(prayerName: string, remainingTime: string) {
  if (Platform.OS === 'web') return;
  
  try {
    // First alert notification (with sound)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${prayerName} Time Reminder`,
        body: `Only 20% of time remaining: ${remainingTime}`,
        sound: true,
      },
      identifier: PRAYER_ALERT_NOTIFICATION_ID,
      trigger: null, // Immediate notification
    });
    
    // Initial countdown notification (shows after the alert)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${prayerName} Time Countdown`,
        body: `Time remaining: ${remainingTime}`,
        sound: false,
        sticky: true,
        autoDismiss: false,
      },
      identifier: PRAYER_NOTIFICATION_ID,
      trigger: null,
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

// Function to update the countdown notification
export async function updateCountdownNotification(prayerName: string, remainingTime: string) {
  if (Platform.OS === 'web') return;
  
  try {
    // Update the existing notification using the same identifier
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${prayerName} Time Countdown`,
        body: `Time remaining: ${remainingTime}`,
        sound: false,
        sticky: true,
        autoDismiss: false,
        // Android specific options for update behavior
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'prayer-countdown',
            ongoing: true
          }
        })
      },
      identifier: PRAYER_NOTIFICATION_ID,
      trigger: null,
    });
  } catch (error) {
    console.error('Failed to update countdown notification:', error);
  }
}

// Function to clear countdown notifications
export async function clearCountdownNotifications() {
  try {
    await Notifications.dismissNotificationAsync(PRAYER_NOTIFICATION_ID);
    await Notifications.dismissNotificationAsync(PRAYER_ALERT_NOTIFICATION_ID);
  } catch (error) {
    console.error('Failed to clear notifications:', error);
  }
}

export async function schedulePrayerNotifications(prayerTimes: PrayerTimes, selectedDate: Date) {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const prayers = [
      { name: 'Fajr', time: prayerTimes.Fajr },
      { name: 'Sunrise', time: prayerTimes.Sunrise, message: 'Perform any Prayer after this time.' },
      { name: 'Ishraq', time: prayerTimes.Ishraq },
      { name: 'Dhuhr', time: prayerTimes.Dhuhr },
      { name: 'Asr', time: prayerTimes.Asr },
      { name: 'Maghrib', time: prayerTimes.Maghrib },
      { name: 'Isha', time: prayerTimes.Isha },
      { name: 'Zawal', time: prayerTimes.Zawal, message: 'Perform any Prayer after this time.' }
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
          title: 'Salat Time',
          body: `It's time for ${prayer.name}${prayer.message ? ` - ${prayer.message}` : ''}`,
          ...(Platform.OS === 'android' && {
            android: {
              channelId: 'prayer-times'
            }
          })
        },
        trigger: {
          channelId: 'prayer-times',
          hour: hour24,
          minute: minutes,
          repeats: true,
        },
      });
    }
  } catch (error) {
    console.error('Failed to schedule notifications:', error);
    throw error;
  }
} 