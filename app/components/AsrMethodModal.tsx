import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { useTheme } from '../utils/ThemeContext';

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
  const { theme } = useTheme();
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Select Asr Calculation Method</Text>
          
          <RadioButton.Group onValueChange={value => onMethodChange(Number(value))} value={String(selectedMethod)}>
            <Pressable 
              style={styles.radioItem}
              onPress={() => onMethodChange(1)}
            >
              <RadioButton.Android value="1" color={theme.primary} />
              <Text style={[styles.radioLabel, { color: theme.textPrimary }]}>Shafi Method</Text>
            </Pressable>
            
            <Pressable 
              style={styles.radioItem}
              onPress={() => onMethodChange(2)}
            >
              <RadioButton.Android value="2" color={theme.primary} />
              <Text style={[styles.radioLabel, { color: theme.textPrimary }]}>Hanafi Method</Text>
            </Pressable>
          </RadioButton.Group>
          
          <Pressable style={[styles.closeButton, { backgroundColor: theme.headerBackground }]} onPress={onClose}>
            <Text style={[styles.closeButtonText, { color: theme.textPrimary }]}>Close</Text>
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
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
}); 

export default AsrMethodModal;