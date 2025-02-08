import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PrayerTimes } from '../types';

// Fixed notification IDs to maintain persistence
const PRAYER_NOTIFICATION_ID = 'prayer-countdown';
const PRAYER_ALERT_NOTIFICATION_ID = 'prayer-alert';

// Sound file constants - reference the sounds defined in app.json
export const NOTIFICATION_SOUNDS: { [key: string]: string } = {
  default: 'default',
  Fajr: 'fajr',
  Dhuhr: 'dhuhr',
  Asr: 'asr',
  Maghrib: 'maghrib',
  Isha: 'isha'
};

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // Add presentation options to make sure notifications are visible
    ...(Platform.OS === 'ios' && {
      presentationOptions: ['badge', 'sound', 'alert', 'banner'],
    }),
  }),
});

// Helper function to format remaining time
function formatRemainingTime(ms: number): string {
  if (ms < 0) return '00:00:00';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

//Add notification for ios
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  // Only ask if permissions have not already been determined
  if (existingStatus !== 'granted') {
    // Request permission
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true,
        provideAppNotificationSettings: true,
      },
      android: {},
    });
    finalStatus = status;
  }
  
  // Log the permission status for debugging
  console.log('Notification permission status:', finalStatus);
  
  return finalStatus === 'granted';
}

export async function setNotificationChannel() {
  if (Platform.OS === 'android') {
    try {
      // Main prayer times notification channel
      await Notifications.setNotificationChannelAsync('prayer-times', {
        name: 'Salat Times',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      
      // Countdown notification channel (for persistent updates)
      await Notifications.setNotificationChannelAsync('prayer-countdown', {
        name: 'Prayer Countdown',
        importance: Notifications.AndroidImportance.MAX, // Set to MAX for better visibility
        sound: 'default', 
        vibrationPattern: [0, 0, 0, 0], // No vibration for updates
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
      
      console.log('Notification channels created successfully');
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  }
}

export async function showRemainingTimeNotification(
  prayerName: string, 
  remainingTime: string, 
  endTimeMs: number,
  soundEnabled: boolean = true
) {
  if (Platform.OS === 'web') return;
  
  try {
    // First alert notification (with sound if enabled)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${prayerName} Prayer - Time Remaining`,
        body: `Time left: ${remainingTime}`,
        subtitle: `Prepare for prayer`,
        sound: soundEnabled ? NOTIFICATION_SOUNDS[prayerName] || NOTIFICATION_SOUNDS.default : false,
        badge: 1,
        // Add data field to ensure consistent handling
        data: { type: 'alert', prayerName, remainingTime, soundEnabled },
      },
      identifier: PRAYER_ALERT_NOTIFICATION_ID,
      trigger: null, // Immediate notification
    });
    
    console.log(`Showing alert notification for ${prayerName}, sound ${soundEnabled ? 'enabled' : 'disabled'}`);
    
    // Initial countdown notification with enhanced visibility
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏱️ ${remainingTime} remaining for ${prayerName}`,
        body: `Current Prayer: ${prayerName}\nCountdown active`,
        sound: false, // No sound for the countdown updates
        sticky: true,
        autoDismiss: false,
        priority: 'max',
        // Add data field to ensure consistent handling
        data: { type: 'countdown', prayerName, remainingTime, soundEnabled },
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'prayer-countdown',
            ongoing: true,
            // Use a foreground service with priority
            foregroundServiceBehavior: 'foregroundService',
            color: '@color/notification_color',
            priority: 'max',
            // Explicitly define the notification icon to show in status bar
            smallIcon: '@drawable/ic_notification',
            // Override other icon properties for more visibility
            largeIcon: '@drawable/ic_notification'
          }
        }),
        ...(Platform.OS === 'ios' && {
          // iOS specific options
          ios: {
            sound: false,
            _displayInForeground: true,
          }
        })
      },
      identifier: PRAYER_NOTIFICATION_ID,
      trigger: null,
    });
    
    console.log(`Showing countdown notification for ${prayerName}: ${remainingTime}`);
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

// Function to update the countdown notification (for foreground updates)
export async function updateCountdownNotification(prayerName: string, remainingTime: string) {
  if (Platform.OS === 'web') return;
  
  try {
    // Update the existing notification with enhanced visibility
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏱️ ${remainingTime} remaining for ${prayerName}`,
        body: `Current Prayer: ${prayerName}\nCountdown active`,
        sound: false,
        sticky: true,
        autoDismiss: false,
        priority: 'max',
        // Add data field to ensure consistent handling
        data: { type: 'countdown', prayerName, remainingTime, updated: Date.now() },
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'prayer-countdown',
            ongoing: true,
            foregroundServiceBehavior: 'foregroundService',
            color: '@color/notification_color',
            priority: 'max',
            // Explicitly define the notification icon to show in status bar
            smallIcon: '@drawable/ic_notification',
            // Override other icon properties for more visibility
            largeIcon: '@drawable/ic_notification'
          }
        }),
        ...(Platform.OS === 'ios' && {
          // iOS specific options
          ios: {
            sound: false,
            _displayInForeground: true,
          }
        })
      },
      identifier: PRAYER_NOTIFICATION_ID,
      trigger: null,
    });
    
    // Log update for debugging
    console.log(`Updated countdown notification: ${prayerName} - ${remainingTime}`);
  } catch (error) {
    console.error('Failed to update countdown notification:', error);
  }
}

// Function to clear countdown notifications
export async function clearCountdownNotifications() {
  try {
    // Clear notifications
    await Notifications.dismissNotificationAsync(PRAYER_NOTIFICATION_ID);
    await Notifications.dismissNotificationAsync(PRAYER_ALERT_NOTIFICATION_ID);
    console.log('Cleared countdown notifications');
  } catch (error) {
    console.error('Failed to clear notifications:', error);
  }
}

export async function schedulePrayerNotifications(
  prayerTimes: PrayerTimes, 
  selectedDate: Date,
  soundPreferences: { [key: string]: boolean } = {}
) {
  if (Platform.OS === 'web') return;

  try {
    // Cancel any existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    await clearCountdownNotifications();
    console.log('Cancelled previous scheduled notifications');

    // Get current prayer information
    const currentTime = new Date();
    let currentPrayerIndex = -1;
    
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

    // Convert prayer times to date objects for comparison
    const prayerDateTimes = prayers.map(prayer => {
      const [hours, minutesStr] = prayer.time.split(':')[0].split(' ')[0].split(':');
      const period = prayer.time.includes('PM') ? 'PM' : 'AM';
      const minutes = parseInt(minutesStr);
      
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;

      const prayerTime = new Date(selectedDate);
      prayerTime.setHours(hour24, minutes, 0, 0);
      
      return {
        ...prayer,
        dateTime: prayerTime,
        hour24,
        minutes
      };
    });

    // Find the current prayer (the latest prayer before now)
    let lastPrayerBeforeNow = prayerDateTimes[prayerDateTimes.length - 1];
    for (let i = 0; i < prayerDateTimes.length; i++) {
      const prayerDateTime = prayerDateTimes[i].dateTime;
      if (prayerDateTime <= currentTime) {
        lastPrayerBeforeNow = prayerDateTimes[i];
        currentPrayerIndex = i;
      } else {
        break; // We found the first future prayer, so the previous one is our current prayer
      }
    }

    console.log(`Current prayer is: ${lastPrayerBeforeNow.name} (index ${currentPrayerIndex})`);
    
    // Only process main prayers
    if (currentPrayerIndex >= 0) {
      // Find next prayer (which might be tomorrow)
      const nextPrayerIdx = (currentPrayerIndex + 1) % prayerDateTimes.length;
      const nextPrayer = prayerDateTimes[nextPrayerIdx];
      
      // Calculate remaining time for notification
      const endTime = new Date(nextPrayer.dateTime);
      if (endTime < currentTime) {
        // If next prayer is tomorrow, adjust the date
        endTime.setDate(endTime.getDate() + 1);
      }
      
      const remainingMs = endTime.getTime() - currentTime.getTime();
      const remainingTimeStr = formatRemainingTime(remainingMs);
      
      console.log(`Current prayer: ${lastPrayerBeforeNow.name}, Next prayer: ${nextPrayer.name}`);
      console.log(`Remaining time until next prayer: ${remainingTimeStr}`);
      
      // Show notification for current prayer if it's a main prayer
      const isMainPrayer = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(lastPrayerBeforeNow.name);
      if (isMainPrayer && remainingMs > 0) {
        // Get the sound preference for this prayer (default to true if not specified)
        const soundEnabled = soundPreferences[lastPrayerBeforeNow.name] !== undefined 
          ? soundPreferences[lastPrayerBeforeNow.name] 
          : true;
          
        console.log(`Showing notification for current prayer: ${lastPrayerBeforeNow.name} (sound: ${soundEnabled ? 'on' : 'off'})`);
        await showRemainingTimeNotification(
          lastPrayerBeforeNow.name, 
          remainingTimeStr, 
          endTime.getTime(),
          soundEnabled
        );
      }
      
      // The countdown timer will handle showing upcoming prayer notifications
      console.log(`Set up logic to show notification for next prayer: ${nextPrayer.name}`);
    }
  } catch (error) {
    console.error('Failed to schedule notifications:', error);
    throw error;
  }
} 