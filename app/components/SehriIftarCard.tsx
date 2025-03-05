import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculateSehriEndTime } from '../utils/hijriCalendar';
import { useTheme } from '../utils/ThemeContext';

interface SehriIftarCardProps {
  fajrTime: string;
  maghribTime: string;
}

export const SehriIftarCard: React.FC<SehriIftarCardProps> = ({ fajrTime, maghribTime }) => {
  const { theme } = useTheme();
  
  // Calculate Sehri end time (10 minutes before Fajr)
  const sehriEndTime = calculateSehriEndTime(fajrTime);
  
  // Iftar time is the same as Maghrib
  const iftarTime = maghribTime;
  
  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.card, 
          styles.sehriCard, 
          { backgroundColor: theme.surface }
        ]}
      >
        <Text style={[styles.label, { color: theme.textSecondary }]}>Sehri Last</Text>
        <Text style={[styles.time, { color: theme.primary }]}>
          {sehriEndTime}
        </Text>
        
      </View>
      
      <View 
        style={[
          styles.card, 
          styles.iftarCard, 
          { backgroundColor: theme.surface }
        ]}
      >
        <Text style={[styles.label, { color: theme.textSecondary }]}>Iftar</Text>
        <Text style={[styles.time, { color: theme.primary }]}>
          {iftarTime}
        </Text>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  card: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sehriCard: {
    marginRight: 8,
  },
  iftarCard: {
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  time: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  }
}); 