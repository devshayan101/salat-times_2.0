import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

interface PrayerMethodToggleProps {
  isHanafi: boolean;
  onToggle: () => void;
}

export const PrayerMethodToggle: React.FC<PrayerMethodToggleProps> = ({
  isHanafi,
  onToggle
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Prayer Time Calculation Method
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Toggle between Hanafi and Shafi madhab for prayer time calculations
        </Text>
      </View>
      
      <View style={styles.toggleContainer}>
        <Text style={[
          styles.methodLabel, 
          { 
            color: !isHanafi ? theme.primary : theme.textSecondary,
            fontWeight: !isHanafi ? 'bold' : 'normal'
          }
        ]}>
          Shafi
        </Text>
        
        <Switch
          value={isHanafi}
          onValueChange={onToggle}
          trackColor={{ false: theme.primary, true: theme.primary }}
          thumbColor={theme.surface}
          ios_backgroundColor={theme.primary}
          style={styles.switch}
        />
        
        <Text style={[
          styles.methodLabel, 
          { 
            color: isHanafi ? theme.primary : theme.textSecondary,
            fontWeight: isHanafi ? 'bold' : 'normal'
          }
        ]}>
          Hanafi
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.infoButton, { backgroundColor: theme.divider }]}
        onPress={() => Alert.alert(
          "Prayer Time Calculation Methods",
          "Hanafi and Shafi schools have different methods for calculating Asr and Isha prayer times. This setting applies both methods together for simplicity.",
          [{ text: "OK", onPress: () => console.log("OK Pressed") }]
        )}
      >
        <Text style={[styles.infoText, { color: theme.textPrimary }]}>What's the difference?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  methodLabel: {
    fontSize: 16,
    paddingHorizontal: 12,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  infoButton: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
  }
}); 
export default PrayerMethodToggle;