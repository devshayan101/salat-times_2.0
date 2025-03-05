import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PrayerTimes, PrayerSoundPreference, PrayerSoundPreferences } from '../types';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification channel IDs
const PRAYER_COUNTDOWN_CHANNEL = 'prayer-countdown';
const PRAYER_ALERT_CHANNEL = 'prayer-alerts';

// Notification IDs
const PRAYER_COUNTDOWN_ID = 'prayer-countdown-notification';
const PRAYER_ALERT_ID = 'prayer-alert-notification';
const PRAYER_TIME_ENDING_ID = 'prayer-time-ending-notification';

// Background task name
const PRAYER_COUNTDOWN_TASK = 'PRAYER_COUNTDOWN_UPDATE';

// Sound file constants - reference the sounds defined in app.json
export const NOTIFICATION_SOUNDS: { [key: string]: string | undefined } = {
  default: 'default_beep',
  default_beep: 'default_beep',
  fajr: 'default_beep',
  dhuhr: 'default_beep',
  asr: 'default_beep',
  maghrib: 'default_beep',
  isha: 'default_beep',
  none: undefined // For silent notifications
};

// Available sound options for prayer notifications
export const SOUND_OPTIONS = [
  { label: 'System Default', value: 'default' },
  { label: 'Beep (Default)', value: 'default_beep' },
  { label: 'None (Silent)', value: 'none' }
];

// Function to get available sound options
export function getSoundOptions() {
  return SOUND_OPTIONS;
}

// Configure notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    ...(Platform.OS === 'ios' && {
      presentationOptions: ['badge', 'sound', 'alert', 'banner'],
    }),
  }),
});

// Helper function to format remaining time
export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return '00:00:00';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Request notification permissions
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
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
  
  return finalStatus === 'granted';
}

// Set up notification channels for Android
export async function setNotificationChannels() {
  if (Platform.OS === 'android') {
    // Prayer countdown channel (persistent notification)
    await Notifications.setNotificationChannelAsync(PRAYER_COUNTDOWN_CHANNEL, {
      name: 'Prayer Countdown',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 0, 0, 0], // No vibration for countdown updates
      sound: undefined, // No sound for countdown updates
      enableVibrate: false,
      showBadge: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    
    // Prayer alerts channel (for prayer time notifications)
    await Notifications.setNotificationChannelAsync(PRAYER_ALERT_CHANNEL, {
      name: 'Prayer Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default_beep',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    
    console.log('Notification channels created successfully');
  }
}

// Register background task for countdown updates
export async function registerBackgroundTask() {
  // Define the task
  TaskManager.defineTask(PRAYER_COUNTDOWN_TASK, async () => {
    try {
      // Get the stored prayer data
      const prayerData = await getPrayerDataFromStorage();
      
      if (!prayerData) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }
      
      const { prayerName, endTimeMs } = prayerData;
      const now = Date.now();
      const remainingMs = endTimeMs - now;
      
      // If prayer time has passed, clear the notification
      if (remainingMs <= 0) {
        await Notifications.dismissNotificationAsync(PRAYER_COUNTDOWN_ID);
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }
      
      // Update the countdown notification
      await showPersistentCountdown(prayerName, remainingMs, endTimeMs);
      
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Background task error:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
  
  // Register the task
  await BackgroundFetch.registerTaskAsync(PRAYER_COUNTDOWN_TASK, {
    minimumInterval: 60, // Update every minute (in seconds)
    stopOnTerminate: false,
    startOnBoot: true,
  });
  
  console.log('Background task registered');
}

// Store prayer data for background updates
async function storePrayerDataForBackground(prayerName: string, endTimeMs: number) {
  try {
    await TaskManager.isTaskRegisteredAsync(PRAYER_COUNTDOWN_TASK);
    
    // Store the data in AsyncStorage
    const data = JSON.stringify({ prayerName, endTimeMs });
    await AsyncStorage.setItem('PRAYER_COUNTDOWN_DATA', data);
  } catch (error) {
    console.error('Error storing prayer data:', error);
  }
}

// Get prayer data from storage
async function getPrayerDataFromStorage() {
  try {
    const data = await AsyncStorage.getItem('PRAYER_COUNTDOWN_DATA');
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error getting prayer data:', error);
    return null;
  }
}

// Show persistent countdown notification
export async function showPersistentCountdown(
  prayerName: string, 
  remainingMs: number, 
  endTimeMs: number
) {
  try {
    // Format the remaining time
    const remainingTime = formatRemainingTime(remainingMs);
    
    // Store data for background updates
    await storePrayerDataForBackground(prayerName, endTimeMs);
    
    // Calculate percentage remaining
    const totalDuration = 3600000; // Assume 1 hour as default duration
    const percentRemaining = (remainingMs / totalDuration) * 100;
    
    // Check if we need to show time ending notification (at 20%)
    if (percentRemaining <= 20 && percentRemaining > 19) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time About to End for ${prayerName}`,
          body: `${remainingTime} left until next prayer.`,
          data: { type: 'time-ending', prayerName },
          sound: 'default_beep',
        },
        trigger: null,
        identifier: PRAYER_TIME_ENDING_ID
      });
    }
    
    // Create the persistent notification
    const notificationContent: Notifications.NotificationContentInput = {
      title: `${prayerName} Prayer Time`,
      body: `Time remaining: ${remainingTime}`,
      data: {
        prayerName,
        endTimeMs,
        type: 'countdown',
        updated: Date.now()
      },
      ...(Platform.OS === 'android' && {
        android: {
          channelId: PRAYER_COUNTDOWN_CHANNEL,
          ongoing: true, // Make it persistent
          sticky: true,
          color: '#60A5FA',
          progress: {
            max: 100,
            current: Math.max(0, Math.min(100, percentRemaining)),
            indeterminate: false
          },
          actions: [
            {
              title: 'Dismiss',
              icon: 'ic_clear',
              identifier: 'dismiss',
              buttonType: 'default',
            }
          ]
        }
      })
    };
    
    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Immediate notification
      identifier: PRAYER_COUNTDOWN_ID // Use fixed ID to replace existing notification
    });
    
    console.log(`Updated countdown notification for ${prayerName}: ${remainingTime}`);
    
  } catch (error) {
    console.error('Error showing persistent countdown:', error);
  }
}

// Clear all prayer notifications
export async function clearAllPrayerNotifications() {
  try {
    await Notifications.dismissNotificationAsync(PRAYER_COUNTDOWN_ID);
    await Notifications.dismissNotificationAsync(PRAYER_ALERT_ID);
    await Notifications.dismissNotificationAsync(PRAYER_TIME_ENDING_ID);
    console.log('All prayer notifications cleared');
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

// Schedule prayer time notification
export async function schedulePrayerNotification(
  prayerName: string,
  prayerTime: Date,
  soundEnabled: boolean = true,
  soundName: string = 'default_beep'
) {
  try {
    // Get the sound to use
    let sound: string | undefined = undefined;
    
    if (soundEnabled) {
      if (soundName && NOTIFICATION_SOUNDS[soundName] !== undefined) {
        sound = soundName;
      } else {
        sound = 'default_beep'; // Fallback to default
      }
    }
    
    // Create notification content
    const notificationContent: Notifications.NotificationContentInput = {
      title: `${prayerName} Prayer Time`,
      body: `It's time for ${prayerName} prayer`,
      data: {
        prayerName,
        type: 'alert'
      },
      sound,
      ...(Platform.OS === 'android' && {
        android: {
          channelId: PRAYER_ALERT_CHANNEL,
          priority: 'max',
          sound,
          vibrate: [0, 250, 250, 250],
          color: '#FF5733',
        }
      })
    };
    
    // Calculate seconds until prayer time
    const now = new Date();
    const secondsUntilPrayer = Math.max(1, Math.floor((prayerTime.getTime() - now.getTime()) / 1000));
    
    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: { 
        seconds: secondsUntilPrayer,
        channelId: PRAYER_ALERT_CHANNEL
      },
      identifier: `prayer-${prayerName}-${prayerTime.getTime()}` // Unique ID for each prayer notification
    });
    
    console.log(`Scheduled notification for ${prayerName} at ${prayerTime.toLocaleTimeString()} with sound: ${sound || 'none'}`);
    
  } catch (error) {
    console.error('Error scheduling prayer notification:', error);
  }
}

// Initialize the current prayer countdown
export async function initializeCurrentPrayerCountdown(
  prayerName: string,
  endTimeMs: number
) {
  try {
    const now = Date.now();
    const remainingMs = endTimeMs - now;
    
    if (remainingMs > 0) {
      // Show the persistent countdown notification
      await showPersistentCountdown(prayerName, remainingMs, endTimeMs);
      
      // Register the background task if not already registered
      if (!(await TaskManager.isTaskRegisteredAsync(PRAYER_COUNTDOWN_TASK))) {
        await registerBackgroundTask();
      }
    }
  } catch (error) {
    console.error('Error initializing prayer countdown:', error);
  }
}

// Schedule a notification for when time is running out for the current prayer
export async function scheduleRemainingTimeNotification(
  prayerName: string,
  prayerTime: Date,
  nextPrayerTime: Date | null,
  remainingPercent: number = 15,
  soundEnabled: boolean = true,
  soundName: string = 'default_beep'
) {
  try {
    // If there's no next prayer time, we can't calculate when the current prayer ends
    if (!nextPrayerTime) return;
    
    // Calculate the total duration of the prayer period
    const prayerDurationMs = nextPrayerTime.getTime() - prayerTime.getTime();
    
    // Calculate when to send the notification (when remainingPercent of time is left)
    const notificationTimeMs = nextPrayerTime.getTime() - (prayerDurationMs * remainingPercent / 100);
    const notificationTime = new Date(notificationTimeMs);
    
    // Don't schedule if the notification time has already passed
    const now = new Date();
    if (notificationTime <= now) return;
    
    // Get the sound to use
    let sound: string | undefined = undefined;
    
    if (soundEnabled) {
      if (soundName && NOTIFICATION_SOUNDS[soundName] !== undefined) {
        sound = soundName;
      } else {
        sound = 'default_beep'; // Fallback to default
      }
    }
    
    // Create notification content
    const notificationContent: Notifications.NotificationContentInput = {
      title: `${prayerName} Time Ending Soon`,
      body: `Only ${remainingPercent}% of time remaining for ${prayerName} prayer`,
      data: {
        prayerName,
        type: 'remaining-time'
      },
      sound,
      ...(Platform.OS === 'android' && {
        android: {
          channelId: PRAYER_ALERT_CHANNEL,
          priority: 'high',
          sound,
          vibrate: [0, 250, 250, 250],
          color: '#FF9800', // Orange color for remaining time notifications
        }
      })
    };
    
    // Calculate seconds until notification time
    const secondsUntilNotification = Math.max(1, Math.floor((notificationTime.getTime() - now.getTime()) / 1000));
    
    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: { 
        seconds: secondsUntilNotification,
        channelId: PRAYER_ALERT_CHANNEL
      },
      identifier: `prayer-remaining-${prayerName}-${notificationTime.getTime()}` // Unique ID
    });
    
    console.log(`Scheduled remaining time notification for ${prayerName} at ${notificationTime.toLocaleTimeString()}`);
    
  } catch (error) {
    console.error('Error scheduling remaining time notification:', error);
  }
}

// Schedule notifications for all prayer times
export async function schedulePrayerNotifications(
  prayerTimes: PrayerTimes, 
  selectedDate: Date,
  soundPreferences: PrayerSoundPreferences = {
    Fajr: { enabled: true, sound: 'default_beep' },
    Dhuhr: { enabled: true, sound: 'default_beep' },
    Asr: { enabled: true, sound: 'default_beep' },
    Maghrib: { enabled: true, sound: 'default_beep' },
    Isha: { enabled: true, sound: 'default_beep' }
  }
) {
  try {
    // Clear any existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Get the prayer times for today
    const prayers = [
      { name: 'Fajr', time: prayerTimes.Fajr },
      { name: 'Dhuhr', time: prayerTimes.Dhuhr },
      { name: 'Asr', time: prayerTimes.Asr },
      { name: 'Maghrib', time: prayerTimes.Maghrib },
      { name: 'Isha', time: prayerTimes.Isha }
    ];
    
    const now = new Date();
    let currentPrayerIndex = -1;
    let nextPrayerIndex = -1;
    
    // Find the current and next prayers
    for (let i = 0; i < prayers.length; i++) {
      const prayer = prayers[i];
      const [time, period] = prayer.time.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      
      const prayerDate = new Date(selectedDate);
      prayerDate.setHours(hour24, minutes, 0, 0);
      
      if (prayerDate > now) {
        if (nextPrayerIndex === -1) {
          nextPrayerIndex = i;
          
          // Current prayer is the one before next prayer
          currentPrayerIndex = i > 0 ? i - 1 : prayers.length - 1;
        }
      } else {
        // This prayer has already passed today, it might be the current one
        currentPrayerIndex = i;
      }
    }
    
    // If no future prayer found, use the first prayer (for tomorrow)
    if (nextPrayerIndex === -1 && prayers.length > 0) {
      nextPrayerIndex = 0;
      currentPrayerIndex = prayers.length - 1; // Last prayer of today
      
      // Adjust date to tomorrow for next prayer
      const tomorrow = new Date(selectedDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      selectedDate = tomorrow;
    }
    
    // Schedule notification for the current prayer
    if (currentPrayerIndex !== -1) {
      const prayer = prayers[currentPrayerIndex];
      
      // Get sound preferences for this prayer
      const prayerKey = prayer.name as keyof PrayerSoundPreferences;
      const soundEnabled = soundPreferences[prayerKey]?.enabled ?? true;
      const soundName = soundPreferences[prayerKey]?.sound ?? 'default_beep';
      
      // Parse the prayer time
      const [time, period] = prayer.time.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      
      // Create a date object for the prayer time
      const prayerDate = new Date(selectedDate);
      let hour24 = hours;
      
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      
      prayerDate.setHours(hour24, minutes, 0, 0);
      
      // Only schedule if the prayer time is still in the future or very recent (within last 5 minutes)
      const isRecent = (now.getTime() - prayerDate.getTime()) < 5 * 60 * 1000; // 5 minutes in milliseconds
      const isFuture = prayerDate > now;
      
      if (isFuture || isRecent) {
        // Schedule the notification
        await schedulePrayerNotification(
          prayer.name,
          prayerDate,
          soundEnabled,
          soundName
        );
        
        // Get the next prayer time to calculate when the current prayer ends
        const nextPrayerInfo = prayers[nextPrayerIndex];
        if (nextPrayerInfo) {
          const [nextTime, nextPeriod] = nextPrayerInfo.time.split(' ');
          const [nextHours, nextMinutes] = nextTime.split(':').map(Number);
          
          let nextHour24 = nextHours;
          if (nextPeriod === 'PM' && nextHours !== 12) nextHour24 += 12;
          if (nextPeriod === 'AM' && nextHours === 12) nextHour24 = 0;
          
          const nextPrayerDate = new Date(selectedDate);
          nextPrayerDate.setHours(nextHour24, nextMinutes, 0, 0);
          
          // If next prayer is tomorrow, adjust the date
          if (nextPrayerDate < prayerDate) {
            nextPrayerDate.setDate(nextPrayerDate.getDate() + 1);
          }
          
          // Schedule notification for when 15% of time remains
          await scheduleRemainingTimeNotification(
            prayer.name,
            prayerDate,
            nextPrayerDate,
            15, // 15% of time remaining
            soundEnabled,
            soundName
          );
        }
      }
    }
  } catch (error) {
    console.error('Error scheduling prayer notifications:', error);
  }
}