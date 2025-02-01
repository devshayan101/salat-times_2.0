import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PrayerCardProps {
  name: string;
  time: string;
  isAsr?: boolean;
  isIsha?: boolean;
  asrMethod?: number;
  onAsrPress?: () => void;
  onIshaPress?: () => void;
}

export const PrayerCard = React.memo(({ 
  name, 
  time, 
  isAsr = false,
  isIsha = false,
  asrMethod = 2,
  onAsrPress,
  onIshaPress
}: PrayerCardProps) => {
  const displayName = isAsr ? `${name} (${asrMethod === 1 ? 'Shafi' : 'Hanafi'})` : name;
  const isPressable = isAsr || isIsha;

  return (
    <Pressable 
      onPress={isAsr ? onAsrPress : isIsha ? onIshaPress : undefined}
      style={({ pressed }) => [
        styles.pressableContainer,
        isPressable && pressed && styles.pressed
      ]}>
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={[styles.prayerCard, isPressable && styles.pressableCard]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.prayerHeader}>
          <Text style={styles.prayerName}>{displayName}</Text>
          {isPressable && (
            <Text style={styles.pressableHint}>Press to change</Text>
          )}
        </View>
        <Text style={styles.prayerTime}>{time}</Text>
      </LinearGradient>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressableContainer: {
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  prayerCard: {
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pressableCard: {
    borderWidth: 1,
    borderColor: '#60A5FA',
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
  pressableHint: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
  },
}); 