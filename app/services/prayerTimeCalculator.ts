import { PrayerTimes, Coordinates } from '../types';

export function calculateDhuhr(longitude: number, date: Date): string {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  
  const B = (360 / 365.24) * (days - 81);
  const BRad = B * (Math.PI / 180);
  
  const Y = -date.getTimezoneOffset() / 60;
  
  const timeEquation = (9.87 * Math.sin(2 * BRad) - 7.53 * Math.cos(BRad) - 1.5 * Math.sin(BRad)) / 60;
  const dhuhrTime = Y - (longitude / 15) + 12 - timeEquation;
  
  const hours = Math.floor(dhuhrTime);
  const minutes = Math.round((dhuhrTime - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function calculatePrayerTime(
  date: Date,
  coordinates: Coordinates,
  isMaghribOrSunrise: boolean,
  isFajrOrIsha: boolean,
  salat: string,
  asrMethod: number = 2
): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const G = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  
  const H = 360 / 365.24;
  const inner = H * (G + 10) + 1.9137 * Math.sin(H * (G - 2) * (Math.PI / 180));

  const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);
  const radiansToDegrees = (radians: number) => radians * (180 / Math.PI);

  const sin23_44 = Math.sin(degreesToRadians(23.44));
  const cosInner = Math.cos(degreesToRadians(inner));
  const value = sin23_44 * cosInner;

  const C = -Math.asin(value);
  const C_degrees = radiansToDegrees(C);

  const sqrtE = Math.sqrt(coordinates.altitude + 40);
  const latRad = coordinates.latitude * (Math.PI / 180);

  let tanValue;
  if (latRad > C) {
      tanValue = Math.tan((latRad - C));
  } else {
      tanValue = Math.tan((C - latRad));
  }
  
  const A = isMaghribOrSunrise || isFajrOrIsha
    ? (isMaghribOrSunrise ? 91 : 110) + sqrtE * 0.0347
    : Math.atan(asrMethod + tanValue) * (180 / Math.PI);

  const ARad = A * (Math.PI / 180);

  const cosA = Math.cos(ARad);
  const cosLat = Math.cos(latRad);
  const cosC = Math.cos(C);
  const tanLat = Math.tan(latRad);
  const tanC = Math.tan(C);

  const term1 = cosA / (cosLat * cosC);
  const term2 = tanLat * tanC;
  const innerFormula = term1 - term2;
  
  const clampedInnerFormula = Math.max(-1, Math.min(1, innerFormula));
  const arcCos = Math.acos(clampedInnerFormula) * (180 / Math.PI);
  const timeOffset = arcCos / 15;

  return timeOffset;
}

export function calculatePrayerTimes(date: Date, coordinates: Coordinates, asrMethod: number = 2): PrayerTimes {
  const dhuhrTime = calculateDhuhr(coordinates.longitude, date);
  const [dhuhrHours, dhuhrMinutes] = dhuhrTime.split(':').map(Number);
  const dhuhrDecimal = dhuhrHours + (dhuhrMinutes / 60);

  const fajrOffset = calculatePrayerTime(date, coordinates, false, true, 'fajr', asrMethod);
  const sunriseOffset = calculatePrayerTime(date, coordinates, true, false, 'sunrise', asrMethod);
  const asrOffset = calculatePrayerTime(date, coordinates, false, false, 'asr', asrMethod);
  const maghribOffset = calculatePrayerTime(date, coordinates, true, false, 'maghrib', asrMethod);
  const ishaOffset = calculatePrayerTime(date, coordinates, false, true, 'isha', asrMethod);

  const formatTime = (timeInDecimalHours: number) => {
    const hours = Math.floor(timeInDecimalHours);
    const minutes = Math.round((timeInDecimalHours - hours) * 60);
    const adjustedHours = (hours + 24) % 24;
    
    const period = adjustedHours >= 12 ? 'PM' : 'AM';
    const displayHours = adjustedHours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const fajrTime = dhuhrDecimal - fajrOffset;
  const maghribTime = dhuhrDecimal + maghribOffset;
  const zawalTime = (maghribTime + fajrTime) / 2;

  return {
    Fajr: formatTime(fajrTime),
    Sunrise: formatTime(dhuhrDecimal - sunriseOffset),
    Dhuhr: formatTime(dhuhrDecimal),
    Asr: formatTime(dhuhrDecimal + asrOffset),
    Maghrib: formatTime(maghribTime),
    Isha: formatTime(dhuhrDecimal + ishaOffset),
    Zawal: formatTime(zawalTime),
  };
} 