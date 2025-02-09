import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for saving tasbih count
const TASBIH_COUNT_KEY = 'tasbih_count';

export default function TasbihScreen() {
  const [count, setCount] = useState(0);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // Load saved count on component mount
  useEffect(() => {
    const loadSavedCount = async () => {
      try {
        const savedCount = await AsyncStorage.getItem(TASBIH_COUNT_KEY);
        if (savedCount !== null) {
          setCount(parseInt(savedCount, 10));
        }
      } catch (error) {
        console.error('Error loading tasbih count:', error);
      }
    };

    loadSavedCount();
  }, []);

  // Save count whenever it changes
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

  // Increment count
  const incrementCount = () => {
    setCount(prevCount => prevCount + 1);
    if (vibrationEnabled) {
      Vibration.vibrate(20); // Short vibration
    }
  };

  // Reset count
  const resetCount = () => {
    setCount(0);
    if (vibrationEnabled) {
      Vibration.vibrate([0, 30, 30, 30]); // Pattern vibration for reset
    }
  };

  // Toggle vibration
  const toggleVibration = () => {
    setVibrationEnabled(prev => !prev);
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>{count}</Text>
        <TouchableOpacity 
          style={styles.counterButton} 
          onPress={incrementCount}
          activeOpacity={0.7}
        >
          <Text style={styles.counterButtonText}>Tap to Count</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.presetContainer}>
        <Text style={styles.presetTitle}>Common Tasbih Targets</Text>
        <View style={styles.presetRow}>
          {[33, 100, 360,1000, 10000].map(target => (
            <View 
              key={target} 
              style={[
                styles.presetBadge, 
                count >= target && styles.presetBadgeReached
              ]}
            >
              <Text style={styles.presetBadgeText}>{target}</Text>
              {count >= target && (
                <Ionicons name="checkmark" size={14} color="#FFF" style={styles.checkIcon} />
              )}
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={resetCount}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh" size={20} color="#F3F4F6" />
        <Text style={styles.resetButtonText}>Reset Counter</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Vibration Toggle</Text>
        <TouchableOpacity onPress={toggleVibration} style={styles.vibrationToggle}>
          <Ionicons 
            name={vibrationEnabled ? "cellular" : "cellular-outline"} 
            size={30} 
            color={vibrationEnabled ? "#60A5FA" : "#9CA3AF"} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to use</Text>
        <Text style={styles.instructionsText}>• Tap the counter button to increase the count</Text>
        <Text style={styles.instructionsText}>• Press reset to start over</Text>
        <Text style={styles.instructionsText}>• Toggle vibration using the button in the top right</Text>
        <Text style={styles.instructionsText}>• Your count will be saved automatically</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  vibrationToggle: {
    padding: 8,
  },
  counterContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  counterText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#60A5FA',
    marginBottom: 20,
    fontVariant: ['tabular-nums'],
  },
  counterButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  counterButtonText: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '600',
  },
  presetContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  presetTitle: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetBadge: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    justifyContent: 'center',
  },
  presetBadgeReached: {
    backgroundColor: '#10B981',
  },
  presetBadgeText: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 4,
  },
  resetButton: {
    backgroundColor: '#4B5563',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  resetButtonText: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionsContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    paddingBottom: 40,
  },
  instructionsTitle: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionsText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
}); 