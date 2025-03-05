import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SOUND_OPTIONS, NOTIFICATION_SOUNDS } from '../services/notificationService';
import { useTheme } from '../utils/ThemeContext';
import * as Notifications from 'expo-notifications';

interface SoundSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  prayerName: string;
  currentSound: string;
  onSoundChange: (sound: string) => void;
}

export const SoundSelectionModal = ({ 
  visible, 
  onClose, 
  prayerName,
  currentSound,
  onSoundChange 
}: SoundSelectionModalProps) => {
  const { theme, isDark } = useTheme();
  const [selectedSound, setSelectedSound] = useState(currentSound);
  
  // Reset selected sound when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedSound(currentSound);
      console.log(`Sound selection modal opened for ${prayerName}. Current sound: ${currentSound}`);
    }
  }, [visible, currentSound, prayerName]);

  // Function to play a sample of the selected sound
  const playSoundPreview = async (soundId: string) => {
    if (Platform.OS === 'web') return;

    try {
      // Don't play if "none" is selected
      if (soundId === 'none') return;
      
      // Get the actual sound value from our mapping
      const actualSound = NOTIFICATION_SOUNDS[soundId] || soundId;
      
      // Create a temporary notification to play the sound
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Sound Preview: ${soundId}`,
          body: `Testing sound for ${prayerName} prayer`,
          sound: actualSound,
          autoDismiss: true,
          data: { previewOnly: true }
        },
        trigger: null, // Immediate
      });
      
      console.log(`Previewing sound: ${soundId}`);
    } catch (error) {
      console.error('Error playing sound preview:', error);
    }
  };
  
  // Function to save the selected sound
  const saveSelectedSound = () => {
    onSoundChange(selectedSound);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Select Sound for {prayerName}
            </Text>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>
          
          <ScrollView style={styles.soundList}>
            {SOUND_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.soundOption,
                  { backgroundColor: isDark ? '#2D3748' : '#F1F5F9' },
                  selectedSound === option.value && [
                    styles.selectedOption, 
                    { borderColor: theme.primary, backgroundColor: isDark ? '#374151' : '#E2E8F0' }
                  ]
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedSound(option.value);
                  // Play sound preview
                  playSoundPreview(option.value);
                }}
              >
                <Text style={[
                  styles.soundOptionText,
                  { color: theme.textPrimary },
                  selectedSound === option.value && { color: theme.primary, fontWeight: '600' }
                ]}>
                  {option.label}
                </Text>
                {selectedSound === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.cancelButton, { borderColor: theme.divider }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={saveSelectedSound}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  soundList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  soundOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    borderWidth: 1,
  },
  soundOptionText: {
    fontSize: 16,
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    width: '48%',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
}); 