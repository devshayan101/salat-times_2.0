export interface PrayerTimeInfo {
  name: string;
  remainingTime: string;
  timeInMs: number;
  isCurrentPrayer: boolean;
  percentageRemaining: number;
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
    .filter(([name]) => name !== 'Ishraq') // Only exclude Ishraq, keep Sunrise and Zawal for time calculations
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
  
  // Calculate total duration of current prayer period
  const previousPrayerIndex = prayers.indexOf(currentPrayer);
  const nextPrayerIndex = prayers.indexOf(nextPrayer);
  
  let totalDuration: number;
  
  if (previousPrayerIndex === prayers.length - 1 && nextPrayerIndex === 0) {
    // If current prayer is the last one and next is the first one (overnight)
    const nextDay = new Date(nextPrayer.date);
    nextDay.setDate(nextDay.getDate() - 1);
    totalDuration = nextPrayer.date.getTime() - nextDay.getTime();
  } else {
    totalDuration = nextPrayer.date.getTime() - currentPrayer.date.getTime();
  }
  
  // Calculate percentage of time remaining
  const percentageRemaining = (timeUntilEnd / totalDuration) * 100;
  
  return {
    name: currentPrayer.name,
    remainingTime: formatRemainingTime(timeUntilEnd),
    timeInMs: timeUntilEnd,
    isCurrentPrayer: true,
    percentageRemaining
  };
} 