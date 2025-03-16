import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PrayerTimeInfo } from '../utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';

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
  soundType?: string;
  onSoundToggle?: () => void;
  onSoundLongPress?: () => void;
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
  soundType = 'default_beep',
  onSoundToggle,
  onSoundLongPress
}: PrayerCardProps) => {
  const { theme, isDark } = useTheme();
  
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
        colors={isCurrentPrayer ? 
          [theme.surface, isDark ? '#1F4937' : '#E6F7F1'] : 
          [theme.surface, isDark ? '#374151' : '#F3F4F6']}
        style={[
          styles.prayerCard, 
          isPressable && {
            borderWidth: 1,
            borderColor: theme.primary
          },
          isCurrentPrayer && {
            borderWidth: 2,
            borderColor: theme.success
          }
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.prayerHeader}>
          <Text style={[styles.prayerName, { color: theme.textPrimary }]}>{displayName}</Text>
          {isPressable && (
            <Text style={[styles.pressableHint, { color: theme.textDisabled }]}>Press for {displayChange}</Text>
          )}
        </View>
        <View style={styles.timeContainer}>
          <View style={styles.timeRow}>
            <Text style={[styles.prayerTime, { color: theme.primary }]}>{time}</Text>
            {isMainPrayer && onSoundToggle && (
              <Pressable
                onPress={(e) => {
                  // Stop event propagation to parent pressable
                  e.stopPropagation();
                  onSoundToggle();
                }}
                onLongPress={(e) => {
                  // Stop event propagation to parent pressable
                  e.stopPropagation();
                  if (onSoundLongPress) {
                    onSoundLongPress();
                  }
                }}
                style={styles.soundButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.soundIconContainer}>
                  <Ionicons 
                    name={soundEnabled ? "volume-high" : "volume-mute"} 
                    size={24} 
                    color={soundEnabled ? theme.primary : theme.textDisabled}
                  />
                  {soundEnabled && soundType !== 'default_beep' && (
                    <Text style={[styles.soundTypeIndicator, { color: theme.textSecondary }]}>
                      {soundType === 'default' ? 'Default' : 
                       soundType === 'none' ? 'Silent' :
                       soundType.charAt(0).toUpperCase() + soundType.slice(1)}
                    </Text>
                  )}
                </View>
              </Pressable>
            )}
          </View>
          {isCurrentPrayer && currentPrayer && (
            <Text style={[styles.countdownText, { color: theme.success }]}>
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
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prayerName: {
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
    fontSize: 24,
    fontWeight: '700',
  },
  pressableHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  soundButton: {
    padding: 4,
  },
  soundIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundTypeIndicator: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
}); 
export default PrayerCard;