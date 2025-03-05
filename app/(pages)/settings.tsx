import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { calculateHijriDate, getHijriAdjustment, setHijriAdjustment, formatHijriDate } from '../utils/hijriCalendar';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestNotificationPermissions } from '../services/notificationService';
import { AsrMethodModal } from '../components/AsrMethodModal';
import { IshaMethodModal } from '../components/IshaMethodModal';

// Storage keys
const NOTIFICATIONS_ENABLED_KEY = 'NOTIFICATIONS_ENABLED';
const ASR_METHOD_KEY = 'ASR_METHOD';
const ISHA_METHOD_KEY = 'ISHA_METHOD';

//Add Hanafi and Shafi toggle settings

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [hijriAdjustment, setHijriAdjustmentState] = useState(0);
  const [currentHijriDate, setCurrentHijriDate] = useState(calculateHijriDate(new Date()));
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [asrMethod, setAsrMethod] = useState(1); // Default: 1 for Shafi, 2 for Hanafi
  const [ishaMethod, setIshaMethod] = useState(1); // Default: 1 for Hanafi, 2 for Shafi
  const [showAsrModal, setShowAsrModal] = useState(false);
  const [showIshaModal, setShowIshaModal] = useState(false);
  
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
      
      // Load Asr method
      const savedAsrMethod = await AsyncStorage.getItem(ASR_METHOD_KEY);
      if (savedAsrMethod) {
        setAsrMethod(Number(savedAsrMethod));
      }
      
      // Load Isha method
      const savedIshaMethod = await AsyncStorage.getItem(ISHA_METHOD_KEY);
      if (savedIshaMethod) {
        setIshaMethod(Number(savedIshaMethod));
      }
    };
    
    loadSettings();
  }, []);
  
  // Update the displayed Hijri date with the current adjustment
  const updateHijriDate = (adjustment: number) => {
    const hijriDate = calculateHijriDate(new Date(), adjustment);
    setCurrentHijriDate(hijriDate);
  };
  
  // Adjust the Hijri date by the specified number of days
  const adjustHijriDate = async (days: number) => {
    const newAdjustment = hijriAdjustment + days;
    setHijriAdjustmentState(newAdjustment);
    updateHijriDate(newAdjustment);
    await setHijriAdjustment(newAdjustment);
  };
  
  // Reset the Hijri date adjustment to 0
  const resetHijriAdjustment = async () => {
    Alert.alert(
      'Reset Hijri Date',
      'Are you sure you want to reset the Hijri date adjustment?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          onPress: async () => {
            setHijriAdjustmentState(0);
            updateHijriDate(0);
            await setHijriAdjustment(0);
          }
        }
      ]
    );
  };
  
  // Toggle notifications and request permissions if needed
  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    
    if (newValue) {
      // Request permission when enabling notifications
      const granted = await requestNotificationPermissions();
      
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive prayer time alerts.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    // Save the new preference
    setNotificationsEnabled(newValue);
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(newValue));
  };
  
  // Handle Asr method change
  const handleAsrMethodChange = async (method: number) => {
    setAsrMethod(method);
    await AsyncStorage.setItem(ASR_METHOD_KEY, String(method));
  };
  
  // Handle Isha method change
  const handleIshaMethodChange = async (method: number) => {
    setIshaMethod(method);
    await AsyncStorage.setItem(ISHA_METHOD_KEY, String(method));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: theme.headerBackground },
          headerTintColor: theme.textPrimary
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Appearance</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Dark Mode</Text>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
              <Ionicons 
                name={isDark ? 'sunny-outline' : 'moon-outline'} 
                size={24} 
                color={theme.primary} 
              />
              <Text style={[styles.themeLabel, { color: theme.textSecondary }]}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Prayer Time Calculation</Text>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowAsrModal(true)}
          >
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Asr Calculation Method</Text>
            <View style={styles.valueContainer}>
              <Text style={[styles.valueText, { color: theme.textSecondary }]}>
                {asrMethod === 1 ? 'Shafi Method' : 'Hanafi Method'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textDisabled} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowIshaModal(true)}
          >
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Isha Calculation Method</Text>
            <View style={styles.valueContainer}>
              <Text style={[styles.valueText, { color: theme.textSecondary }]}>
                {ishaMethod === 1 ? 'Hanafi Method' : 'Shafi Method'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textDisabled} />
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Choose calculation methods based on your madhab for accurate prayer times.
          </Text>
        </View>
        
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Notifications</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Prayer Time Alerts</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: theme.divider, true: theme.primary + '70' }}
              thumbColor={notificationsEnabled ? theme.primary : theme.textDisabled}
            />
          </View>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Receive notifications for prayer times even when the app is closed.
          </Text>
        </View>
        
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Hijri Calendar</Text>
          
          <View style={styles.hijriDateContainer}>
            <Text style={[styles.currentHijriDate, { color: theme.primary }]}>
              {formatHijriDate(currentHijriDate)}
            </Text>
            <Text style={[styles.hijriAdjustment, { color: theme.textSecondary }]}>
              Adjustment: {hijriAdjustment > 0 ? '+' : ''}{hijriAdjustment} days
            </Text>
          </View>
          
          <Text style={[styles.hijriCalibrationInfo, { color: theme.textSecondary }]}>
            Adjust the Hijri date to match the local moon sighting in your region.
          </Text>
          
          <View style={styles.adjustmentButtons}>
            <TouchableOpacity 
              style={[styles.adjustButton, { backgroundColor: theme.primary + '20' }]}
              onPress={() => adjustHijriDate(-1)}
            >
              <Text style={[styles.adjustButtonText, { color: theme.primary }]}>-1 Day</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.resetButton, { borderColor: theme.divider }]}
              onPress={resetHijriAdjustment}
            >
              <Text style={[styles.resetButtonText, { color: theme.textSecondary }]}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.adjustButton, { backgroundColor: theme.primary + '20' }]}
              onPress={() => adjustHijriDate(1)}
            >
              <Text style={[styles.adjustButtonText, { color: theme.primary }]}>+1 Day</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>About</Text>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>
            SalatTimes v2.0.0
          </Text>
          <Text style={[styles.copyrightText, { color: theme.textSecondary }]}>
            © 2024 Sawadeazam
          </Text>
        </View>
      </ScrollView>
      
      {/* Modals */}
      <AsrMethodModal
        visible={showAsrModal}
        onClose={() => setShowAsrModal(false)}
        selectedMethod={asrMethod}
        onMethodChange={handleAsrMethodChange}
      />
      
      <IshaMethodModal
        visible={showIshaModal}
        onClose={() => setShowIshaModal(false)}
        selectedMethod={ishaMethod}
        onMethodChange={handleIshaMethodChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    marginRight: 4,
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.7,
  },
  hijriDateContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  currentHijriDate: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hijriAdjustment: {
    fontSize: 14,
  },
  hijriCalibrationInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  adjustmentButtons: {
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
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  resetButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  versionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
}); 