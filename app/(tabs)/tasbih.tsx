import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../utils/ThemeContext';

// Storage key for saving tasbih count
const TASBIH_COUNT_KEY = 'tasbih_count';
const TASBIH_VIBRATION_KEY = 'tasbih_vibration';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

export default function TasbihScreen() {
  const [count, setCount] = useState(0);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const { theme, isDark } = useTheme();

  // Load saved count and vibration setting
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        // Load saved count
        const savedCount = await AsyncStorage.getItem(TASBIH_COUNT_KEY);
        if (savedCount !== null) {
          setCount(parseInt(savedCount, 10));
        }
        
        // Load vibration setting
        const vibrationSetting = await AsyncStorage.getItem(TASBIH_VIBRATION_KEY);
        if (vibrationSetting !== null) {
          setVibrationEnabled(vibrationSetting === 'true');
        }
      } catch (error) {
        console.error('Error loading tasbih settings:', error);
      }
    };
    
    loadSavedSettings();
  }, []);
  
  // Save count when it changes
  useEffect(() => {
    const saveCount = async () => {
      try {
        await AsyncStorage.setItem(TASBIH_COUNT_KEY, count.toString());
      } catch (error) {
        console.error('Error saving tasbih count:', error);
      }
    };
    
    saveCount();
  }, [count]);
  
  // Save vibration setting when it changes
  useEffect(() => {
    const saveVibrationSetting = async () => {
      try {
        await AsyncStorage.setItem(TASBIH_VIBRATION_KEY, vibrationEnabled.toString());
      } catch (error) {
        console.error('Error saving vibration setting:', error);
      }
    };
    
    saveVibrationSetting();
  }, [vibrationEnabled]);

  // Increment count and vibrate if enabled
  const incrementCount = () => {
    setCount(prevCount => prevCount + 1);
    if (vibrationEnabled) {
      Vibration.vibrate(20);
    }
  };

  // Reset count and vibrate if enabled
  const resetCount = () => {
    setCount(0);
    if (vibrationEnabled) {
      Vibration.vibrate([0, 30, 50, 30]);
    }
  };

  // Toggle vibration
  const toggleVibration = () => {
    setVibrationEnabled(prev => !prev);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.mainContainer}>
        {/* Counter display */}
        <View style={styles.counterDisplayContainer}>
          <Text style={[styles.counterText, { color: theme.textPrimary }]}>{count}</Text>
        </View>
        
        {/* Centered tap to count button */}
        <View style={styles.centerButtonContainer}>
          <TouchableOpacity 
            style={[styles.counterButton, { backgroundColor: theme.tasbihButtonBackground }]} 
            onPress={incrementCount}
            activeOpacity={0.6}
          >
            <Text style={[styles.counterButtonText, { color: theme.tasbihButtonText }]}>Tap to Count</Text>
          </TouchableOpacity>
        </View>

        {/* Preset targets */}
        <View style={[styles.presetContainer, { borderTopColor: theme.divider }]}>
          <Text style={[styles.presetTitle, { color: theme.textPrimary }]}>Common Tasbih Targets</Text>
          <View style={styles.presetRow}>
            {[33, 100, 313, 360, 1000].map(target => (
              <View 
                key={target} 
                style={[
                  styles.presetBadge, 
                  { backgroundColor: count >= target ? theme.success : theme.surface, borderColor: theme.divider },
                ]}
              >
                <Text 
                  style={[
                    styles.presetBadgeText, 
                    { color: count >= target ? 'white' : theme.textPrimary }
                  ]}
                >
                  {target}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.surface, borderColor: theme.divider }]} 
            onPress={resetCount}
          >
            <Ionicons name="refresh" size={22} color={theme.textPrimary} />
            <Text style={[styles.controlButtonText, { color: theme.textPrimary }]}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.surface, borderColor: theme.divider }]} 
            onPress={toggleVibration}
          >
            <Ionicons 
              name={vibrationEnabled ? "cellular" : "cellular-outline"} 
              size={22} 
              color={theme.textPrimary} 
            />
            <Text style={[styles.controlButtonText, { color: theme.textPrimary }]}>
              {vibrationEnabled ? 'Vibration On' : 'Vibration Off'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    padding: 16,
  },
  counterDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  counterText: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  centerButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  counterButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  presetContainer: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginTop: 20,
  },
  presetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  presetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  presetBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  controlButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
}); 