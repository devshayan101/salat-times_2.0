import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Dimensions, TextInput, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';

// Storage keys
const TASBIH_COUNT_KEY = '@tasbih_count';
const VIBRATION_ENABLED_KEY = '@vibration_enabled';
const CUSTOM_TARGET_KEY = '@custom_target';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

export default function TasbihScreen() {
  const [count, setCount] = useState(0);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [customTarget, setCustomTarget] = useState(33); // Default tasbih target
  const [targetReached, setTargetReached] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempTarget, setTempTarget] = useState('33');
  const { theme, isDark } = useTheme();
  
  // Load saved count and settings
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        // Load count
        const savedCount = await AsyncStorage.getItem(TASBIH_COUNT_KEY);
        if (savedCount !== null) {
          setCount(parseInt(savedCount, 10));
        }
        
        // Load vibration setting
        const vibrationSetting = await AsyncStorage.getItem(VIBRATION_ENABLED_KEY);
        if (vibrationSetting !== null) {
          setVibrationEnabled(vibrationSetting === 'true');
        }
        
        // Load custom target
        const savedTarget = await AsyncStorage.getItem(CUSTOM_TARGET_KEY);
        if (savedTarget !== null) {
          setCustomTarget(parseInt(savedTarget, 10));
        }
      } catch (error) {
        console.error('Error loading saved settings:', error);
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
        console.error('Error saving count:', error);
      }
    };
    
    saveCount();
    
    // Check if target is reached
    if (count > 0 && count === customTarget && !targetReached) {
      setTargetReached(true);
      // Double vibration when target is reached
      if (vibrationEnabled) {
        Vibration.vibrate([0, 300, 200, 300]);
      }
    } else if (count !== customTarget && targetReached) {
      setTargetReached(false);
    }
  }, [count, customTarget, targetReached, vibrationEnabled]);
  
  // Save vibration setting when it changes
  useEffect(() => {
    const saveVibrationSetting = async () => {
      try {
        await AsyncStorage.setItem(VIBRATION_ENABLED_KEY, vibrationEnabled.toString());
      } catch (error) {
        console.error('Error saving vibration setting:', error);
      }
    };
    
    saveVibrationSetting();
  }, [vibrationEnabled]);
  
  // Save custom target when it changes
  useEffect(() => {
    const saveCustomTarget = async () => {
      try {
        await AsyncStorage.setItem(CUSTOM_TARGET_KEY, customTarget.toString());
      } catch (error) {
        console.error('Error saving custom target:', error);
      }
    };
    
    saveCustomTarget();
  }, [customTarget]);
  
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
    setTargetReached(false);
    if (vibrationEnabled) {
      Vibration.vibrate([0, 30, 50, 30]);
    }
  };
  
  // Toggle vibration
  const toggleVibration = () => {
    setVibrationEnabled(prev => !prev);
  };
  
  // Save custom target
  const saveTarget = () => {
    const newTarget = parseInt(tempTarget, 10);
    if (!isNaN(newTarget) && newTarget > 0) {
      setCustomTarget(newTarget);
    }
    setModalVisible(false);
  };
  
  // Open set target modal
  const openTargetModal = () => {
    setTempTarget(customTarget.toString());
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      

        {/* Preset targets */}
        <View style={styles.presetsContainer}>
          <Text style={[styles.presetsTitle, { color: theme.textSecondary }]}>Common Tasbih Targets</Text>
          <View style={styles.presetButtonsContainer}>
            {[33, 100, 313, 1000].map(target => (
              <TouchableOpacity 
                key={target} 
                style={[
                  styles.presetButton,
                  { 
                    backgroundColor: customTarget === target ? theme.primary : theme.surface,
                    borderColor: theme.divider 
                  }
                ]}
                onPress={() => setCustomTarget(target)}
              >
                <Text style={[
                  styles.presetButtonText, 
                  { color: customTarget === target ? theme.tasbihButtonText : theme.textPrimary }
                ]}>
                  {target}
                </Text>
                {count >= target && (
                  <View style={[styles.checkmark, { backgroundColor: theme.success }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Control buttons */}
        <View style={styles.controlButtons}>
          
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.surface, borderColor: theme.divider }]} 
            onPress={toggleVibration}
          >
            <Ionicons 
              name={vibrationEnabled ? "cellular" : "cellular-outline"} 
              size={18} 
              color={vibrationEnabled ? theme.success : theme.textSecondary} 
            />
            <Text style={[styles.controlButtonText, { color: vibrationEnabled ? theme.success : theme.textSecondary }]}>
              {vibrationEnabled ? 'Vibration On' : 'Vibration Off'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.surface, borderColor: theme.divider }]} 
            onPress={resetCount}
          >
            <Text style={[styles.controlButtonText, { color: theme.error }]}>Reset</Text>
          </TouchableOpacity>
        </View>

    <ScrollView>
      <View style={styles.mainContainer}>
        {/* Counter display */}
        <View style={styles.counterDisplayContainer}>
          <Text style={[styles.counterText, { color: theme.textPrimary }]}>{count}</Text>
          
          {/* Target indicator */}
          <View style={styles.targetContainer}>
            <Text style={[styles.targetText, { color: theme.textSecondary }]}>
              Target: {customTarget}
            </Text>
            <TouchableOpacity onPress={openTargetModal} style={styles.editTargetButton}>
              <Ionicons name="pencil" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Target reached indicator */}
          {targetReached && (
            <View style={[styles.targetReachedBadge, { backgroundColor: theme.success }]}>
              <Text style={styles.targetReachedText}>Target Reached!</Text>
            </View>
          )}
        </View>
        
        {/* Centered tap to count button */}
        <View style={styles.centerButtonContainer}>
          <TouchableOpacity 
            style={[
              styles.counterButton, 
              { backgroundColor: theme.tasbihButtonBackground },
              targetReached && { backgroundColor: theme.success }
            ]} 
            onPress={incrementCount}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: theme.tasbihButtonText }]}>
              Tap to Count
            </Text>
          </TouchableOpacity>
        </View>
        
        

        
      </View>
      
      {/* Custom target modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Set Custom Target
                </Text>
                <TextInput
                  style={[styles.targetInput, { 
                    color: theme.textPrimary,
                    borderColor: theme.divider,
                    backgroundColor: isDark ? '#2C3E50' : '#F8FAFC' 
                  }]}
                  value={tempTarget}
                  onChangeText={setTempTarget}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="Enter target number"
                  placeholderTextColor={theme.textDisabled}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { borderColor: theme.divider }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={[styles.modalButtonText, { color: theme.error }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.primary }]}
                    onPress={saveTarget}
                  >
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterDisplayContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  counterText: {
    fontSize: 60,
    fontWeight: 'bold',
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  targetText: {
    fontSize: 16,
    marginRight: 8,
  },
  editTargetButton: {
    padding: 4,
  },
  targetReachedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  targetReachedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    width: '100%',
  },
  counterButton: {
    width: '60%',
    maxWidth: 300,
    aspectRatio: 1,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  presetsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  presetsTitle: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  presetButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
    marginVertical: 8,
    position: 'relative',
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  targetInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 