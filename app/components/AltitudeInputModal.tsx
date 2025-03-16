import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

interface AltitudeInputModalProps {
  visible: boolean;
  onClose: () => void;
  currentAltitude: number;
  onSave: (altitude: number) => void;
}

export const AltitudeInputModal: React.FC<AltitudeInputModalProps> = ({
  visible,
  onClose,
  currentAltitude,
  onSave
}) => {
  const { theme } = useTheme();
  const [altitude, setAltitude] = useState(currentAltitude.toString());
  
  const handleSave = () => {
    // Convert to number and validate
    const numAltitude = parseFloat(altitude);
    if (isNaN(numAltitude)) {
      // If not a valid number, reset to current altitude
      setAltitude(currentAltitude.toString());
      return;
    }
    
    // Save the new altitude
    onSave(numAltitude);
    onClose();
  };
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View 
          style={[styles.modalContent, { backgroundColor: theme.surface }]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Enter Altitude Manually
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter altitude in meters above sea level
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { 
                color: theme.textPrimary,
                borderColor: theme.divider
              }]}
              value={altitude}
              onChangeText={setAltitude}
              keyboardType="numeric"
              placeholder="Altitude in meters"
              placeholderTextColor={theme.textDisabled}
              autoFocus
            />
            <Text style={[styles.unit, { color: theme.textSecondary }]}>meters</Text>
          </View>
          
          <View style={styles.buttonRow}>
            <Pressable 
              style={[styles.button, styles.cancelButton, { borderColor: theme.divider }]} 
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable 
              style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]} 
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  unit: {
    marginLeft: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
  }
}); 

export default AltitudeInputModal;