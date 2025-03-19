import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { calculateHijriDate, getHijriAdjustment, setHijriAdjustment, formatHijriDate } from '../utils/hijriCalendar';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestNotificationPermissions } from '../services/notificationService';
import { PrayerMethodToggle } from '../components/PrayerMethodToggle';

// Storage keys
const NOTIFICATIONS_ENABLED_KEY = 'NOTIFICATIONS_ENABLED';
const ASR_METHOD_KEY = 'ASR_METHOD';
const ISHA_METHOD_KEY = 'ISHA_METHOD';
const MADHAB_KEY = 'MADHAB_KEY'; // New key for combined setting

//Add Hanafi and Shafi toggle settings

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [hijriAdjustment, setHijriAdjustmentState] = useState(0);
  const [currentHijriDate, setCurrentHijriDate] = useState(calculateHijriDate(new Date()));
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Replace separate method states with a single madhab state
  const [isHanafiMadhab, setIsHanafiMadhab] = useState(true); // Default to Hanafi
  
  // Load the current Hijri adjustment and notification preferences
  useEffect(() => {
    const loadSettings = async () => {
      // Load Hijri adjustment
      const adjustment = await getHijriAdjustment();
      setHijriAdjustmentState(adjustment);
      updateHijriDate(adjustment);
      
      // Load notification preference
      const notificationPref = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      setNotificationsEnabled(notificationPref === 'true');
      
      // Load madhab preference (new unified setting)
      const savedMadhab = await AsyncStorage.getItem(MADHAB_KEY);
      if (savedMadhab !== null) {
        setIsHanafiMadhab(savedMadhab === 'hanafi');
      } else {
        // For backward compatibility, check the old separate method settings
        const savedAsrMethod = await AsyncStorage.getItem(ASR_METHOD_KEY);
        const savedIshaMethod = await AsyncStorage.getItem(ISHA_METHOD_KEY);
        
        // If both are set to Hanafi or both to Shafi, use that
        if (savedAsrMethod === '2' && savedIshaMethod === '1') {
          // Both are Hanafi
          setIsHanafiMadhab(true);
        } else if (savedAsrMethod === '1' && savedIshaMethod === '2') {
          // Both are Shafi
          setIsHanafiMadhab(false);
        }
        // Otherwise keep the default (Hanafi)
      }
    };
    
    loadSettings();
  }, []);
  
  // Update the displayed Hijri date with the current adjustment
  const updateHijriDate = (adjustment: number) => {
    const hijriDate = calculateHijriDate(new Date(), adjustment);
    setCurrentHijriDate(hijriDate);
  };
  
  // Adjust the Hijri date by increasing or decreasing days
  const adjustHijriDate = async (days: number) => {
    const newAdjustment = hijriAdjustment + days;
    await setHijriAdjustment(newAdjustment);
    setHijriAdjustmentState(newAdjustment);
    updateHijriDate(newAdjustment);
    
    // Notify other parts of the app about the Hijri date adjustment change
    await AsyncStorage.setItem('HIJRI_DATE_UPDATED', Date.now().toString());
  };
  
  // Reset the Hijri date adjustment to 0
  const resetHijriAdjustment = async () => {
    await setHijriAdjustment(0);
    setHijriAdjustmentState(0);
    updateHijriDate(0);
    
    // Notify other parts of the app about the Hijri date adjustment change
    await AsyncStorage.setItem('HIJRI_DATE_UPDATED', Date.now().toString());
  };
  
  // Toggle the notification preference
  const toggleNotifications = async () => {
    try {
      const newValue = !notificationsEnabled;
      
      if (newValue) {
        // Request permissions when enabling notifications
        const permissionGranted = await requestNotificationPermissions();
        if (!permissionGranted) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive prayer time alerts.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, newValue.toString());
      setNotificationsEnabled(newValue);
      
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };
  
  // Toggle between Hanafi and Shafi madhab
  const toggleMadhab = async () => {
    const newValue = !isHanafiMadhab;
    setIsHanafiMadhab(newValue);
    
    // Save the unified madhab preference
    await AsyncStorage.setItem(MADHAB_KEY, newValue ? 'hanafi' : 'shafi');
    
    // Also update the individual method settings for backward compatibility
    if (newValue) {
      // Hanafi
      await AsyncStorage.setItem(ASR_METHOD_KEY, '2'); // Hanafi for Asr
      await AsyncStorage.setItem(ISHA_METHOD_KEY, '1'); // Hanafi for Isha
    } else {
      // Shafi
      await AsyncStorage.setItem(ASR_METHOD_KEY, '1'); // Shafi for Asr
      await AsyncStorage.setItem(ISHA_METHOD_KEY, '2'); // Shafi for Isha
    }
    
    // Dispatch an event to notify other screens about the settings change
    // We'll use local storage as a communication channel
    await AsyncStorage.setItem('SETTINGS_UPDATED', Date.now().toString());
    
    // Show confirmation to the user
    Alert.alert(
      'Settings Updated',
      `Prayer time calculations will now use ${newValue ? 'Hanafi' : 'Shafi'} method. Changes have been applied immediately.`,
      [{ text: 'OK' }]
    );
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerTitleStyle: { color: theme.textPrimary },
        }}
      />
      
      <View style={styles.content}>
        {/* Hijri Date Adjustment */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Hijri Date Adjustment</Text>
          
          <View style={styles.hijriDateContainer}>
            <Text style={[styles.hijriDate, { color: theme.textPrimary }]}>
              {formatHijriDate(currentHijriDate)}
            </Text>
          </View>
          
          <View style={styles.adjustmentControls}>
            <TouchableOpacity 
              style={[styles.adjustButton, { backgroundColor: theme.primary }]} 
              onPress={() => adjustHijriDate(-1)}
            >
              <Text style={styles.adjustButtonText}>-1 Day</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.adjustButton, { backgroundColor: theme.secondary }]} 
              onPress={() => resetHijriAdjustment()}
            >
              <Text style={styles.adjustButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.adjustButton, { backgroundColor: theme.primary }]} 
              onPress={() => adjustHijriDate(1)}
            >
              <Text style={styles.adjustButtonText}>+1 Day</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Adjust the Hijri date if needed to match your local moon sighting.
          </Text>
        </View>
        
        {/* Prayer Time Calculation with unified toggle */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <PrayerMethodToggle 
            isHanafi={isHanafiMadhab}
            onToggle={toggleMadhab}
          />
        </View>
        
        {/* Notification Settings */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Prayer Time Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={notificationsEnabled ? '#f4f3f4' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
          
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Receive notifications for prayer times, even when the app is closed.
          </Text>
        </View>
        
        {/* Theme Settings */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Appearance</Text>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={isDark ? '#f4f3f4' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
          
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Switch between light and dark themes.
          </Text>
        </View>
        
        {/* About Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>About</Text>
          
          <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
            SalatTimes v1.0.0
          </Text>
          
          <Text style={[styles.aboutDescription, { color: theme.textSecondary }]}>
            Developed by SawadeAzam for the Muslim community
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingLabel: {
    fontSize: 16,
  },
  hijriDateContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  hijriDate: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  adjustmentControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  adjustButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  adjustButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.7,
  },
  aboutText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  aboutDescription: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
}); 