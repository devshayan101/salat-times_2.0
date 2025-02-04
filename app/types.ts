export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude: number;
}

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