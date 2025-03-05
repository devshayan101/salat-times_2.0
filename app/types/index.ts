export interface PrayerTimes {
  [key: string]: string;  // Add index signature
  Fajr: string;
  Sunrise: string;
  Ishraq: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Zawal: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude: number;
}

// Interface for prayer sound preferences
export interface PrayerSoundPreference {
  enabled: boolean;
  sound: string;
}

export interface PrayerSoundPreferences {
  [key: string]: PrayerSoundPreference;
  Fajr: PrayerSoundPreference;
  Dhuhr: PrayerSoundPreference;
  Asr: PrayerSoundPreference;
  Maghrib: PrayerSoundPreference;
  Isha: PrayerSoundPreference;
}

// Interface for admin messages
export interface AdminMessage {
  id: string;
  title: string;
  content: string;
  date: string;
  isRead: boolean;
  priority: 'normal' | 'high';
} 