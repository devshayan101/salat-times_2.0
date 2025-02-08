import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PrayerTimeInfo } from '../utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';

interface PrayerCardProps {
  name: string;
  time: string;
  isAsr?: boolean;
  isIsha?: boolean;
  asrMethod?: number;
  ishaMethod?: number;
  onAsrPress?: () => void;
  onIshaPress?: () => void;
  currentPrayer?: PrayerTimeInfo | null;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
}

export const PrayerCard = React.memo(({ 
  name, 
  time, 
  isAsr = false,
  isIsha = false,
  asrMethod = 2,
  ishaMethod = 1,
  onAsrPress,
  onIshaPress,
  currentPrayer,
  soundEnabled = true,
  onSoundToggle
}: PrayerCardProps) => {
  const displayName = isAsr 
    ? `${name} (${asrMethod === 1 ? 'Shafi' : 'Hanafi'})`
    : isIsha
    ? `${name} (${ishaMethod === 1 ? 'Hanafi' : 'Shafi'})`
    : name;
  const isPressable = isAsr || isIsha;

  const displayChange = isAsr 
    ? `(${asrMethod === 1 ? 'Hanafi' : 'Shafi'})`
    : isIsha
    ? `(${ishaMethod === 1 ? 'Shafi' : 'Hanafi'})`
    : name;

  const isCurrentPrayer = currentPrayer?.name === name;
  
  // Only show sound toggle for main prayers
  const isMainPrayer = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(name);

  return (
    <Pressable 
      onPress={isAsr ? onAsrPress : isIsha ? onIshaPress : undefined}
      style={({ pressed }) => [
        styles.pressableContainer,
        isPressable && pressed && styles.pressed
      ]}>
      <LinearGradient
        colors={isCurrentPrayer ? ['#1F4937', '#374151'] : ['#1F2937', '#374151']}
        style={[
          styles.prayerCard, 
          isPressable && styles.pressableCard,
          isCurrentPrayer && styles.currentPrayerCard
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.prayerHeader}>
          <Text style={styles.prayerName}>{displayName}</Text>
          {isPressable && (
            <Text style={styles.pressableHint}>Press for {displayChange}</Text>
          )}
        </View>
        <View style={styles.timeContainer}>
          <View style={styles.timeRow}>
            <Text style={styles.prayerTime}>{time}</Text>
            {isMainPrayer && onSoundToggle && (
              <Pressable
                onPress={(e) => {
                  // Stop event propagation to parent pressable
                  e.stopPropagation();
                  onSoundToggle();
                }}
                style={styles.soundButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={soundEnabled ? "volume-high" : "volume-mute"} 
                  size={24} 
                  color={soundEnabled ? "#60A5FA" : "#9CA3AF"}
                />
              </Pressable>
            )}
          </View>
          {isCurrentPrayer && currentPrayer && (
            <Text style={styles.countdownText}>
              Time remaining: {currentPrayer.remainingTime}
            </Text>
          )}
        </View>
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
  currentPrayerCard: {
    borderWidth: 2,
    borderColor: '#10B981',
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
  timeContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  countdownText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  soundButton: {
    padding: 4,
  },
}); 