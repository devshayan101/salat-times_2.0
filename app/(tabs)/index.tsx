import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Pressable, AppState, TouchableOpacity, Modal, Switch, Alert } from 'react-native';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as BackgroundFetch from 'expo-background-fetch';

import { PrayerTimes, Coordinates, PrayerSoundPreferences } from '../types';
import { calculatePrayerTimes } from '../services/prayerTimeCalculator';
import { 
  schedulePrayerNotifications, 
  clearAllPrayerNotifications,
  setNotificationChannels,
  showPersistentCountdown,
  initializeCurrentPrayerCountdown,
  requestNotificationPermissions,
  NOTIFICATION_SOUNDS
} from '../services/notificationService';
import { PrayerCard } from '../components/PrayerCard';
import { NotificationToggle } from '../components/NotificationToggle';
import { SoundSelectionModal } from '../components/SoundSelectionModal';
import { SehriIftarCard } from '../components/SehriIftarCard';
import { AltitudeInputModal } from '../components/AltitudeInputModal';
import { HijriCalendar } from '../components/HijriCalendar';
import { getPrayerTimes, PrayerTimeInfo } from '../utils/timeUtils';
import { calculateHijriDate, formatHijriDate } from '../utils/hijriCalendar';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../utils/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHijriAdjustment } from '../utils/hijriCalendar';

// Constants for storage keys
const PRAYER_SOUNDS_STORAGE_KEY = 'PRAYER_SOUNDS';
const MANUAL_ALTITUDE_KEY = 'MANUAL_ALTITUDE';
const USE_MANUAL_ALTITUDE_KEY = 'USE_MANUAL_ALTITUDE';
const ASR_METHOD_KEY = 'ASR_METHOD';
const ISHA_METHOD_KEY = 'ISHA_METHOD';
const MADHAB_KEY = 'MADHAB_KEY';

const TimerSection = ({ 
  currentPrayer, 
  location, 
  hijriDate,
  showLocationDetails,
  toggleLocationDetails,
  onSetAltitude,
  manualAltitude,
  useManualAltitude,
  toggleUseManualAltitude
}: { 
  currentPrayer: PrayerTimeInfo | null, 
  location: Location.LocationObject | null,
  hijriDate: ReturnType<typeof calculateHijriDate> | null,
  showLocationDetails: boolean,
  toggleLocationDetails: () => void,
  onSetAltitude: () => void,
  manualAltitude: number | null,
  useManualAltitude: boolean,
  toggleUseManualAltitude: () => void
}) => {
  const timezoneOffset = -(new Date().getTimezoneOffset() / 60);
  const gmtString = `GMT:${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;
  const { theme, isDark } = useTheme();
  
  // Get the altitude to display (manual or from location)
  const displayAltitude = useManualAltitude && manualAltitude !== null 
    ? manualAltitude 
    : (location?.coords.altitude ?? 0);
  
  return (
    <View style={[styles.timerSection, { backgroundColor: theme.surface, borderTopColor: theme.divider }]}>
      <View style={styles.timerContainer}>
        {currentPrayer && (
          <>
            <Text style={[styles.currentPrayerName, { color: theme.primary }]}>{currentPrayer.name}</Text>
            <Text style={[styles.timerText, { color: theme.success }]}>{currentPrayer.remainingTime}</Text>
          </>
        )}
      </View>
      
      {/* Hijri date display */}
      {hijriDate && (
        <Text style={[styles.hijriDate, { color: theme.textSecondary }]}>
          {formatHijriDate(hijriDate)}
        </Text>
      )}
      
      {/* Location info with toggle button */}
      <View style={styles.locationSection}>
        <TouchableOpacity 
          onPress={toggleLocationDetails}
          style={styles.locationToggle}
        >
          <Text style={{ color: theme.textSecondary }}>
            {showLocationDetails ? 'Hide Location Details' : 'Show Location Details'}
          </Text>
          <Ionicons 
            name={showLocationDetails ? 'chevron-up' : 'chevron-down'}
            size={16} 
            color={theme.textSecondary} 
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
        
        {location && showLocationDetails && (
          <View style={[styles.locationDetails, { borderTopColor: theme.divider }]}>
            <View style={styles.locationRow}>
              <Text style={[styles.locationLabel, { color: theme.textSecondary }]}>Lat/Long:</Text>
              <Text style={[styles.locationValue, { color: theme.textPrimary }]}>
                {location.coords.latitude.toFixed(4)}°, {location.coords.longitude.toFixed(4)}°
              </Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={[styles.locationLabel, { color: theme.textSecondary }]}>Altitude:</Text>
              <TouchableOpacity 
                onPress={onSetAltitude}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="pencil" size={16} color={theme.primary} />
              </TouchableOpacity>
              <Switch
                value={useManualAltitude}
                onValueChange={toggleUseManualAltitude}
                trackColor={{ false: theme.divider, true: theme.primary + '80' }}
                thumbColor={useManualAltitude ? theme.primary : theme.textDisabled}
                style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }], marginRight: 8 }}
              />
              <Text style={[styles.locationValue, { color: theme.textPrimary }]}>
                {displayAltitude.toFixed(1)}m
                {!useManualAltitude && location.coords.altitudeAccuracy && 
                  ` ±${Math.max(0, location.coords.altitudeAccuracy).toFixed(1)}`}
                {useManualAltitude && " (Manual)"}
              </Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={[styles.locationLabel, { color: theme.textSecondary }]}>Timezone:</Text>
              <Text style={[styles.locationValue, { color: theme.textPrimary }]}>{gmtString}</Text>
            </View>
          </View>
        )}
      </View>
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
  const [isHanafiMadhab, setIsHanafiMadhab] = useState(true); // Add unified madhab state
  const [currentPrayer, setCurrentPrayer] = useState<PrayerTimeInfo | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [manualAltitude, setManualAltitude] = useState<number | null>(null);
  const [showAltitudeModal, setShowAltitudeModal] = useState(false);
  const [showHijriCalendar, setShowHijriCalendar] = useState(false);
  const [currentHijriDate, setCurrentHijriDate] = useState<ReturnType<typeof calculateHijriDate> | null>(null);
  const { theme } = useTheme();
  
  // Add state for sound selection modal
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [selectedPrayerForSound, setSelectedPrayerForSound] = useState<string>('');
  
  // Add state for prayer sound preferences
  const [prayerSounds, setPrayerSounds] = useState<PrayerSoundPreferences>({
    Fajr: { enabled: true, sound: 'default_beep' },
    Dhuhr: { enabled: true, sound: 'default_beep' },
    Asr: { enabled: true, sound: 'default_beep' },
    Maghrib: { enabled: true, sound: 'default_beep' },
    Isha: { enabled: true, sound: 'default_beep' }
  });
  
  // Ref to track if notification has been shown for current prayer
  const notificationShownRef = useRef<{[key: string]: boolean}>({});
  // Ref to track the current prayer we're showing notifications for
  const currentNotificationPrayerRef = useRef<string>('');
  // Ref to track last update time to limit the frequency of notification updates
  const lastNotificationUpdateRef = useRef<number>(0);

  // Add state for manual altitude usage
  const [useManualAltitude, setUseManualAltitude] = useState(false);

  // Load saved settings when component mounts
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        // Load manual altitude
        const savedAltitude = await AsyncStorage.getItem(MANUAL_ALTITUDE_KEY);
        const savedUseManual = await AsyncStorage.getItem(USE_MANUAL_ALTITUDE_KEY);
        
        // Load prayer method settings - check for unified madhab setting first
        const savedMadhab = await AsyncStorage.getItem(MADHAB_KEY);
        
        if (savedMadhab !== null) {
          // Use the unified madhab setting
          const isHanafi = savedMadhab === 'hanafi';
          // Set method values based on madhab
          setAsrMethod(isHanafi ? 2 : 1); // Hanafi: 2, Shafi: 1
          setIshaMethod(isHanafi ? 1 : 2); // Hanafi: 1, Shafi: 2
          setIsHanafiMadhab(isHanafi);
        } else {
          // Fallback to individual method settings
          const savedAsrMethod = await AsyncStorage.getItem(ASR_METHOD_KEY);
          const savedIshaMethod = await AsyncStorage.getItem(ISHA_METHOD_KEY);
          
          if (savedAsrMethod !== null) {
            setAsrMethod(parseInt(savedAsrMethod));
          }
          
          if (savedIshaMethod !== null) {
            setIshaMethod(parseInt(savedIshaMethod));
          }
        }
        
        if (savedAltitude !== null) {
          setManualAltitude(parseFloat(savedAltitude));
        }
        
        if (savedUseManual !== null) {
          setUseManualAltitude(savedUseManual === 'true');
        }
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    };
    
    loadSavedSettings();
  }, []);
  
  // Save Asr method when it changes
  useEffect(() => {
    AsyncStorage.setItem(ASR_METHOD_KEY, asrMethod.toString())
      .catch(err => console.error('Error saving Asr method:', err));
  }, [asrMethod]);
  
  // Save Isha method when it changes
  useEffect(() => {
    AsyncStorage.setItem(ISHA_METHOD_KEY, ishaMethod.toString())
      .catch(err => console.error('Error saving Isha method:', err));
  }, [ishaMethod]);
  
  // Save manual altitude when it changes
  useEffect(() => {
    if (manualAltitude !== null) {
      AsyncStorage.setItem(MANUAL_ALTITUDE_KEY, manualAltitude.toString())
        .catch(err => console.error('Error saving manual altitude:', err));
    }
  }, [manualAltitude]);
  
  // Save manual altitude preference when it changes
  useEffect(() => {
    AsyncStorage.setItem(USE_MANUAL_ALTITUDE_KEY, useManualAltitude.toString())
      .catch(err => console.error('Error saving manual altitude preference:', err));
  }, [useManualAltitude]);
  
  // Toggle location details visibility
  const toggleLocationDetails = () => {
    setShowLocationDetails(prev => !prev);
  };
  
  // Open altitude input modal
  const openAltitudeModal = () => {
    setShowAltitudeModal(true);
  };
  
  // Save manual altitude
  const saveManualAltitude = (altitude: number) => {
    setManualAltitude(altitude);
    
    // Update prayer times with new altitude if we have location
    if (location) {
      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: altitude
      };
      updatePrayerTimes(selectedDate, coords);
    }
  };
  
  // Toggle Hijri calendar
  const toggleHijriCalendar = () => {
    setShowHijriCalendar(prev => !prev);
  };
  
  // Handle date selection from Hijri calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowHijriCalendar(false);
    
    if (location) {
      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: manualAltitude ?? location.coords.altitude ?? 0
      };
      updatePrayerTimes(date, coords);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };
  
  const loadSoundPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem(PRAYER_SOUNDS_STORAGE_KEY);
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        setPrayerSounds(parsedPreferences);
        console.log('Loaded sound preferences:', parsedPreferences);
      } else {
        console.log('Using default sound preferences');
      }
    } catch (error) {
      console.error('Error loading sound preferences:', error);
    }
  };
  
  const saveSoundPreferences = async () => {
    try {
      await AsyncStorage.setItem(PRAYER_SOUNDS_STORAGE_KEY, JSON.stringify(prayerSounds));
      console.log('Sound preferences saved:', prayerSounds);
    } catch (error) {
      console.error('Error saving sound preferences:', error);
    }
  };
  
  const togglePrayerSound = (prayerName: string) => {
    setPrayerSounds(prev => ({
      ...prev,
      [prayerName]: {
        ...prev[prayerName],
        enabled: !prev[prayerName].enabled
      }
    }));
  };
  
  const changePrayerSound = (prayerName: string, sound: string) => {
    console.log(`Changing sound for ${prayerName} to: ${sound}`);
    setPrayerSounds(prev => {
      const updated = {
        ...prev,
        [prayerName]: {
          ...prev[prayerName],
          sound: sound
        }
      };
      console.log('Updated sound preferences:', updated);
      return updated;
    });
  };
  
  const openSoundSelection = (prayerName: string) => {
    setSelectedPrayerForSound(prayerName);
    setShowSoundModal(true);
  };
  
  const toggleUseManualAltitude = () => {
    const newValue = !useManualAltitude;
    setUseManualAltitude(newValue);
    
    // If toggling on and we have a manual altitude, update prayer times
    if (newValue && manualAltitude !== null && location) {
      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: manualAltitude
      };
      updatePrayerTimes(selectedDate, coords);
    } 
    // If toggling off and we have location, update with sensor altitude
    else if (!newValue && location) {
      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude ?? 0
      };
      updatePrayerTimes(selectedDate, coords);
    }
  };
  
  const updatePrayerTimes = async (date: Date, coords: Coordinates) => {
    try {
      // If using manual altitude and we have one, override the coords altitude
      if (useManualAltitude && manualAltitude !== null) {
        coords.altitude = manualAltitude;
      }
      
      // Calculate method values based on the unified madhab setting
      const asr = isHanafiMadhab ? 2 : 1;  // Hanafi: 2, Shafi: 1
      const isha = isHanafiMadhab ? 1 : 2; // Hanafi: 1, Shafi: 2
      
      const calculatedTimes = calculatePrayerTimes(date, coords, asr, isha);
      setPrayerTimes(calculatedTimes);

      // Setup notifications if enabled
      if (notificationsEnabled) {
        await schedulePrayerNotifications(calculatedTimes, date, prayerSounds);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error calculating prayer times:', err);
      setError('Failed to calculate prayer times.');
    } finally {
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

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation
        });
        
        setLocation(location);

        const coords: Coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: manualAltitude ?? Math.max(0, location.coords.altitude ?? 0)
        };

        updatePrayerTimes(selectedDate, coords);
      } catch (err) {
        console.error('Location error:', err);
        setError('Failed to get location');
        setLoading(false);
      }
    })();
  }, [manualAltitude]);

  useEffect(() => {
    if (location) {
      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: manualAltitude ?? (location.coords.altitude ?? 0)
      };
      updatePrayerTimes(selectedDate, coords);
    }
  }, [selectedDate, location, asrMethod, ishaMethod, manualAltitude]);
  
  // Add timer update effect with background notification
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    
    // Function to update the current prayer time
    const updateCurrentPrayer = () => {
      if (prayerTimes) {
        const current = getPrayerTimes(prayerTimes);
        setCurrentPrayer(current);
        
        // Removed the persistent countdown notification update
      }
    };
    
    // Initial update
    updateCurrentPrayer();
    
    // Set up interval to update every second in foreground
    timerInterval = setInterval(updateCurrentPrayer, 1000);
    
    // Clean up on unmount
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [prayerTimes]);
  
  // Listen for app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App coming to foreground - update UI only, not notification
        // Removed notification update code
      } else if (nextAppState.match(/inactive|background/) && appState === 'active') {
        // App going to background - no need to update notification anymore
        // Removed notification update code
      }
      
      setAppState(nextAppState);
    });
    
    return () => {
      subscription.remove();
      clearAllPrayerNotifications();
    };
  }, [prayerTimes, currentPrayer]);
  
  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Set up notification channels
        await setNotificationChannels();
        
        // Request notification permissions
        const permissionGranted = await requestNotificationPermissions();
        
        if (permissionGranted) {
          setNotificationsEnabled(true);
          
          // Removed the countdown notification code
        } else {
          setNotificationsEnabled(false);
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
        setNotificationsEnabled(false);
      }
    };
    
    initializeNotifications();
  }, []);
  
  // Calculate Hijri date whenever selected date changes
  useEffect(() => {
    const loadHijriDateWithAdjustment = async () => {
      try {
        // Get the adjustment from settings
        const adjustment = await getHijriAdjustment();
        
        // Calculate and set Hijri date based on selected date with adjustment
        const hijriDate = calculateHijriDate(selectedDate, adjustment);
        setCurrentHijriDate(hijriDate);
      } catch (error) {
        console.error('Error calculating Hijri date:', error);
      }
    };
    
    loadHijriDateWithAdjustment();
  }, [selectedDate]);
  
  // Rest of the code...

  const renderDatePicker = () => {
    if (showDatePicker) {
      return Platform.OS === 'ios' ? (
        <View style={[styles.datePickerContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.datePickerHeader}>
            <Pressable onPress={() => setShowDatePicker(false)} style={styles.datePickerButton}>
              <Text style={[styles.datePickerButtonText, { color: theme.primary }]}>Done</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setSelectedDate(selectedDate);
                if (location) {
                  // Create valid Coordinates object
                  const validCoords: Coordinates = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    altitude: location.coords.altitude ?? 0, // Use 0 if altitude is null
                  };
                  updatePrayerTimes(selectedDate, validCoords);
                }
              }
            }}
            style={styles.datePicker}
          />
        </View>
      ) : (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setSelectedDate(selectedDate);
              if (location) {
                // Create valid Coordinates object
                const validCoords: Coordinates = {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  altitude: location.coords.altitude ?? 0, // Use 0 if altitude is null
                };
                updatePrayerTimes(selectedDate, validCoords);
              }
            }
          }}
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.contentContainer}>
        <TimerSection 
          currentPrayer={currentPrayer} 
          location={location} 
          hijriDate={currentHijriDate}
          showLocationDetails={showLocationDetails}
          toggleLocationDetails={toggleLocationDetails}
          onSetAltitude={openAltitudeModal}
          manualAltitude={manualAltitude}
          useManualAltitude={useManualAltitude}
          toggleUseManualAltitude={toggleUseManualAltitude}
        />

        <Pressable
          style={[styles.dateButton, { backgroundColor: theme.surface }]}
          onPress={toggleHijriCalendar}>
          <Text style={[styles.dateButtonText, { color: theme.textPrimary }]}>{formatDate(selectedDate)}</Text>
        </Pressable>

        {renderDatePicker()}

        {prayerTimes && (
          <>
            {/* Sehri/Iftar info cards */}
            <SehriIftarCard 
              fajrTime={prayerTimes.Fajr} 
              maghribTime={prayerTimes.Maghrib} 
            />
            
            <PrayerCard 
              name="Fajr" 
              time={prayerTimes.Fajr} 
              currentPrayer={currentPrayer} 
              soundEnabled={prayerSounds.Fajr.enabled}
              soundType={prayerSounds.Fajr.sound}
              onSoundToggle={() => togglePrayerSound('Fajr')}
              onSoundLongPress={() => openSoundSelection('Fajr')}
            />
            <PrayerCard name="Sunrise" time={prayerTimes.Sunrise} currentPrayer={currentPrayer} />
            <PrayerCard name="Ishraq" time={prayerTimes.Ishraq} currentPrayer={currentPrayer} />
            <PrayerCard name="Zawal Time" time={prayerTimes.Zawal} currentPrayer={currentPrayer} />
            <PrayerCard 
              name="Dhuhr" 
              time={prayerTimes.Dhuhr} 
              currentPrayer={currentPrayer} 
              soundEnabled={prayerSounds.Dhuhr.enabled}
              soundType={prayerSounds.Dhuhr.sound}
              onSoundToggle={() => togglePrayerSound('Dhuhr')}
              onSoundLongPress={() => openSoundSelection('Dhuhr')}
            />
            <PrayerCard 
              name="Asr" 
              time={prayerTimes.Asr} 
              isAsr={true}
              asrMethod={asrMethod}
              onAsrPress={() => Alert.alert(
                'Prayer Method Settings',
                'Prayer calculation methods can now be changed in the Settings screen using the unified Madhab toggle.',
                [{ text: 'OK' }]
              )}
              currentPrayer={currentPrayer}
              soundEnabled={prayerSounds.Asr.enabled}
              soundType={prayerSounds.Asr.sound}
              onSoundToggle={() => togglePrayerSound('Asr')}
              onSoundLongPress={() => openSoundSelection('Asr')}
            />
            <PrayerCard 
              name="Maghrib" 
              time={prayerTimes.Maghrib} 
              currentPrayer={currentPrayer} 
              soundEnabled={prayerSounds.Maghrib.enabled}
              soundType={prayerSounds.Maghrib.sound}
              onSoundToggle={() => togglePrayerSound('Maghrib')}
              onSoundLongPress={() => openSoundSelection('Maghrib')}
            />
            <PrayerCard 
              name="Isha" 
              time={prayerTimes.Isha}
              isIsha={true}
              ishaMethod={ishaMethod}
              onIshaPress={() => Alert.alert(
                'Prayer Method Settings',
                'Prayer calculation methods can now be changed in the Settings screen using the unified Madhab toggle.',
                [{ text: 'OK' }]
              )}
              currentPrayer={currentPrayer}
              soundEnabled={prayerSounds.Isha.enabled}
              soundType={prayerSounds.Isha.sound}
              onSoundToggle={() => togglePrayerSound('Isha')}
              onSoundLongPress={() => openSoundSelection('Isha')}
            />
          </>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Calculating prayer times...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <SoundSelectionModal
        visible={showSoundModal}
        onClose={() => setShowSoundModal(false)}
        prayerName={selectedPrayerForSound}
        currentSound={selectedPrayerForSound ? prayerSounds[selectedPrayerForSound as keyof PrayerSoundPreferences].sound : ''}
        onSoundChange={(sound: string) => changePrayerSound(selectedPrayerForSound, sound)}
      />
      
      {/* Altitude Input Modal */}
      <AltitudeInputModal
        visible={showAltitudeModal}
        onClose={() => setShowAltitudeModal(false)}
        currentAltitude={manualAltitude ?? (location?.coords.altitude ?? 0)}
        onSave={saveManualAltitude}
      />
      
      {/* Hijri Calendar Modal */}
      {showHijriCalendar && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showHijriCalendar}
          onRequestClose={() => setShowHijriCalendar(false)}
        >
          <View style={styles.calendarModalContainer}>
            <HijriCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onClose={() => setShowHijriCalendar(false)}
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  timerSection: {
    padding: 16,
    borderTopWidth: 1,
    marginBottom: 16,
    borderRadius: 16,
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
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  hijriDate: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  locationSection: {
    marginTop: 8,
  },
  locationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  locationDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
  },
  locationValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  dateButton: {
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  notificationText: {
    fontSize: 16,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  calendarModalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  datePickerContainer: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
  },
  datePickerButton: {
    padding: 8,
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePicker: {
    height: 200,
  },
});