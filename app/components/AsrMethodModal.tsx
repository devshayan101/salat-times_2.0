import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { RadioButton } from 'react-native-paper';

interface AsrMethodModalProps {
  visible: boolean;
  onClose: () => void;
  selectedMethod: number;
  onMethodChange: (method: number) => void;
}

export const AsrMethodModal = React.memo(({ 
  visible, 
  onClose, 
  selectedMethod, 
  onMethodChange 
}: AsrMethodModalProps) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Select Asr Calculation Method</Text>
          
          <RadioButton.Group onValueChange={value => onMethodChange(Number(value))} value={String(selectedMethod)}>
            <View style={styles.radioItem}>
              <RadioButton.Android value="1" color="#60A5FA" />
              <Text style={styles.radioLabel}>Shafi Method</Text>
            </View>
            
            <View style={styles.radioItem}>
              <RadioButton.Android value="2" color="#60A5FA" />
              <Text style={styles.radioLabel}>Hanafi Method</Text>
            </View>
          </RadioButton.Group>
          
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioLabel: {
    color: '#F3F4F6',
    fontSize: 16,
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#F3F4F6',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
}); 