import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SOUND_OPTIONS } from '../services/notificationService';

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
  // Log the modal state for debugging
  useEffect(() => {
    if (visible) {
      console.log(`Sound selection modal opened for ${prayerName}. Current sound: ${currentSound}`);
      console.log('Available sound options:', SOUND_OPTIONS);
    }
  }, [visible, prayerName, currentSound]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Sound for {prayerName}</Text>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </Pressable>
          </View>
          
          <ScrollView style={styles.soundList}>
            {SOUND_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.soundOption,
                  currentSound === option.value && styles.selectedOption
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  console.log(`Selected sound: ${option.value} for ${prayerName}`);
                  onSoundChange(option.value);
                }}
              >
                <Text style={[
                  styles.soundOptionText,
                  currentSound === option.value && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
                {currentSound === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#60A5FA" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={onClose}
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
    backgroundColor: '#1F2937',
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
    color: '#F3F4F6',
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
    backgroundColor: '#2D3748',
  },
  selectedOption: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  soundOptionText: {
    color: '#D1D5DB',
    fontSize: 16,
  },
  selectedOptionText: {
    color: '#F9FAFB',
    fontWeight: '600',
  },
  footer: {
    marginTop: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#60A5FA',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
}); 