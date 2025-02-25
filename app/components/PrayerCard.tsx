import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PrayerCardProps {
  name: string;
  time: string;
  isAsr?: boolean;
  asrMethod?: number;
  onAsrPress?: () => void;
}

export const PrayerCard = React.memo(({ 
  name, 
  time, 
  isAsr = false,
  asrMethod = 2,
  onAsrPress
}: PrayerCardProps) => {
  const displayName = isAsr ? `${name} (${asrMethod === 1 ? 'Shafi' : 'Hanafi'})` : name;

  return (
    <Pressable onPress={isAsr ? onAsrPress : undefined}>
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.prayerCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.prayerHeader}>
          <Text style={styles.prayerName}>{displayName}</Text>
        </View>
        <Text style={styles.prayerTime}>{time}</Text>
      </LinearGradient>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  prayerCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prayerName: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  prayerTime: {
    color: '#60A5FA',
    fontSize: 24,
    fontWeight: '700',
  },
}); 