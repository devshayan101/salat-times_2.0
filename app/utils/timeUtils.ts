export interface PrayerTimeInfo {
  name: string;
  remainingTime: string;
  timeInMs: number;
  isCurrentPrayer: boolean;
}

function convertPrayerTimeToDate(prayerTime: string, baseDate: Date): Date {
  const [time, period] = prayerTime.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  const date = new Date(baseDate);
  let hour24 = hours;
  
  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;
  
  date.setHours(hour24, minutes, 0, 0);
  return date;
}

function formatRemainingTime(ms: number): string {
  if (ms < 0) return '00:00:00';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function getPrayerTimes(prayerTimes: Record<string, string>): PrayerTimeInfo {
  const now = new Date();
  const prayers = Object.entries(prayerTimes)
    .filter(([name]) => name !== 'Sunrise' && name !== 'Ishraq' && name !== 'Zawal') // Exclude non-prayer times
    .map(([name, time]) => {
      const date = convertPrayerTimeToDate(time, now);
      // If prayer time has passed today, add it for tomorrow
      if (date < now) {
        date.setDate(date.getDate() + 1);
      }
      return {
        name,
        date,
        time
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const nextPrayer = prayers.find(prayer => prayer.date > now) || prayers[0];
  const currentPrayer = nextPrayer === prayers[0] ? prayers[prayers.length - 1] : prayers[prayers.indexOf(nextPrayer) - 1];
  
  // Calculate time until current prayer ends (which is when next prayer starts)
  const timeUntilEnd = nextPrayer.date.getTime() - now.getTime();
  
  return {
    name: currentPrayer.name,
    remainingTime: formatRemainingTime(timeUntilEnd),
    timeInMs: timeUntilEnd,
    isCurrentPrayer: true
  };
} 