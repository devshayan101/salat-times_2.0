import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Pressable } from 'react-native';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
// import { Audio } from 'expo-av';

import { PrayerTimes, Coordinates } from '../types';
import { calculatePrayerTimes } from '../services/prayerTimeCalculator';
import { 
  setNotificationChannel, 
  schedulePrayerNotifications, 
  showRemainingTimeNotification,
  updateCountdownNotification,
  clearCountdownNotifications
} from '../services/notificationService';
import { PrayerCard } from '../components/PrayerCard';
import { NotificationToggle } from '../components/NotificationToggle';
import { AsrMethodModal } from '../components/AsrMethodModal';
import { IshaMethodModal } from '../components/IshaMethodModal';
import { getPrayerTimes, PrayerTimeInfo } from '../utils/timeUtils';

const TimerSection = ({ currentPrayer, location }: { currentPrayer: PrayerTimeInfo | null, location: Location.LocationObject | null }) => {
  const timezoneOffset = -(new Date().getTimezoneOffset() / 60);
  const gmtString = `GMT:${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;
  
  return (
    <View style={styles.timerSection}>
      <View style={styles.timerContainer}>
        {currentPrayer && (
          <>
            <Text style={styles.currentPrayerName}>{currentPrayer.name}</Text>
            <Text style={styles.timerText}>{currentPrayer.remainingTime}</Text>
          </>
        )}
      </View>
      {location && (
        <View style={styles.locationDetails}>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>Lat/Long:</Text>
            <Text style={styles.locationValue}>
              {location.coords.latitude.toFixed(4)}°, {location.coords.longitude.toFixed(4)}°
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>Altitude:</Text>
            <Text style={styles.locationValue}>
              {Math.max(0, location.coords.altitude ?? 0).toFixed(1)}meters ±{Math.max(0, location.coords.altitudeAccuracy ?? 0).toFixed(1)}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>Timezone:</Text>
            <Text style={styles.locationValue}>{gmtString}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default function PrayerTimesScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showAsrModal, setShowAsrModal] = useState(false);
  const [showIshaModal, setShowIshaModal] = useState(false);
  const [asrMethod, setAsrMethod] = useState(2); // Default to Hanafi method
  const [ishaMethod, setIshaMethod] = useState(1); // Default to Hanafi method
  const [currentPrayer, setCurrentPrayer] = useState<PrayerTimeInfo | null>(null);
  
  // Ref to track if notification has been shown for current prayer
  const notificationShownRef = useRef<{[key: string]: boolean}>({});
  // Ref to track the current prayer we're showing notifications for
  const currentNotificationPrayerRef = useRef<string>('');
  // Ref to track last update time to limit the frequency of notification updates
  const lastNotificationUpdateRef = useRef<number>(0);
  
  //make 'hanafi' color blue - denoting hyperlink - ok
  //Add Ishraq time. - ok
  //Time remaining for prayer. - ok
  //Nemaz time remainig counter - ok
  //Give notification when 20% of time is left
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
      const times = calculatePrayerTimes(date, coords, asrMethod, ishaMethod);
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

  // const playBeepSound = async () => {
  //   try {
  //     const { sound } = await Audio.Sound.createAsync(
  //       require('../../assets/beep.mp3')
  //     );
  //     await sound.playAsync();
  //   } catch (error) {
  //     console.log('Error playing sound:', error);
  //   }
  // };

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
      console.log(location);
      updatePrayerTimes(selectedDate, coords);
    }
  }, [selectedDate, location, asrMethod, ishaMethod]);

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

  // Add countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (prayerTimes) {
      const updateCurrentPrayer = () => {
        const current = getPrayerTimes(prayerTimes);
        setCurrentPrayer(current);
        
        // Skip non-prayer times for notifications
        const isPrayerTime = current && 
          current.name !== 'Sunrise' && 
          current.name !== 'Zawal Time' &&
          current.name !== 'Ishraq';
        
        if (isPrayerTime && notificationsEnabled) {
          // Check if we need to show a notification for 20% time remaining
          if (current.percentageRemaining <= 20 && 
              current.percentageRemaining > 0 &&
              !notificationShownRef.current[current.name]) {
            
            // Mark this prayer as having shown a notification
            notificationShownRef.current[current.name] = true;
            currentNotificationPrayerRef.current = current.name;
            
            // Show the initial notification with remaining time
            showRemainingTimeNotification(current.name, current.remainingTime);
          }
          
          // Update the countdown notification if we've shown one for this prayer
          // but limit updates to once per second to avoid excessive updates
          const now = Date.now();
          if (currentNotificationPrayerRef.current === current.name && 
              now - lastNotificationUpdateRef.current >= 1000) {
            updateCountdownNotification(current.name, current.remainingTime);
            lastNotificationUpdateRef.current = now;
          }
        }
        
        // Reset notification flags when prayer changes
        if (current && currentNotificationPrayerRef.current && 
            currentNotificationPrayerRef.current !== current.name) {
          // Clear notifications when prayer changes
          clearCountdownNotifications();
          notificationShownRef.current = {};
          currentNotificationPrayerRef.current = '';
        }
      };
      
      updateCurrentPrayer();
      timer = setInterval(updateCurrentPrayer, 1000);
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
      // Clear notifications when component unmounts
      clearCountdownNotifications();
    };
  }, [prayerTimes, notificationsEnabled]);

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
      <TimerSection currentPrayer={currentPrayer} location={location} />

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
          <PrayerCard name="Fajr" time={prayerTimes.Fajr} currentPrayer={currentPrayer} />
          <PrayerCard name="Sunrise" time={prayerTimes.Sunrise} currentPrayer={currentPrayer} />
          <PrayerCard name="Ishraq" time={prayerTimes.Ishraq} currentPrayer={currentPrayer} />
          <PrayerCard name="Zawal Time" time={prayerTimes.Zawal} currentPrayer={currentPrayer} />
          <PrayerCard name="Dhuhr" time={prayerTimes.Dhuhr} currentPrayer={currentPrayer} />
          <PrayerCard 
            name="Asr" 
            time={prayerTimes.Asr} 
            isAsr={true}
            asrMethod={asrMethod}
            onAsrPress={() => setShowAsrModal(true)}
            currentPrayer={currentPrayer}
          />
          <PrayerCard name="Maghrib" time={prayerTimes.Maghrib} currentPrayer={currentPrayer} />
          <PrayerCard 
            name="Isha" 
            time={prayerTimes.Isha} 
            isIsha={true}
            ishaMethod={ishaMethod}
            onIshaPress={() => setShowIshaModal(true)}
            currentPrayer={currentPrayer}
          />
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

      <IshaMethodModal
        visible={showIshaModal}
        onClose={() => setShowIshaModal(false)}
        selectedMethod={ishaMethod}
        onMethodChange={(method) => {
          setIshaMethod(method);
          setShowIshaModal(false);
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
  timerSection: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPrayerName: {
    color: '#60A5FA',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  timerText: {
    color: '#10B981',
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  locationDetails: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 16,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  locationValue: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '600',
  },
});