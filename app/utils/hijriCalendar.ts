// Hijri calendar utility functions
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for Hijri date adjustment
const HIJRI_ADJUSTMENT_KEY = 'HIJRI_DATE_ADJUSTMENT';

// Islamic months names
export const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhu al-Qadah',
  'Dhu al-Hijjah'
];

// Days of the week in Arabic/Islamic context
export const HIJRI_DAYS = [
  'Al-Ahad',
  'Al-Ithnayn',
  'Al-Thulatha',
  'Al-Arbia',
  'Al-Khamis',
  'Al-Jumuah',
  'Al-Sabt'
];

// Get the stored Hijri date adjustment
export async function getHijriAdjustment(): Promise<number> {
  try {
    const adjustment = await AsyncStorage.getItem(HIJRI_ADJUSTMENT_KEY);
    return adjustment ? parseInt(adjustment) : 0;
  } catch (error) {
    console.error('Error getting Hijri adjustment:', error);
    return 0;
  }
}

// Save Hijri date adjustment
export async function setHijriAdjustment(days: number): Promise<void> {
  try {
    await AsyncStorage.setItem(HIJRI_ADJUSTMENT_KEY, days.toString());
  } catch (error) {
    console.error('Error saving Hijri adjustment:', error);
  }
}

/**
 * Converts a Gregorian date to Hijri date
 * Using a direct calculation method with known reference points
 * @param gregorianDate The Gregorian date to convert
 * @param adjustment Optional manual adjustment in days
 * @returns Hijri date object
 */
export function calculateHijriDate(
  gregorianDate: Date, 
  adjustment: number = 0
): {
  year: number;
  month: number;
  day: number;
  monthName: string;
  dayName: string;
  formattedDate: string;
} {
  // Create a copy of the date to avoid modifying the original
  const date = new Date(gregorianDate);
  
  // Known reference point: March 11, 2024 = 1 Ramadan 1445H
  const referenceGregorian = new Date(2024, 2, 11); // March 11, 2024
  const referenceHijri = {
    day: 1,
    month: 9, // Ramadan is the 9th month
    year: 1445
  };
  
  // Calculate days difference between the dates
  const daysDifference = Math.floor((date.getTime() - referenceGregorian.getTime()) / (1000 * 60 * 60 * 24));
  
  // Apply manual adjustment
  const adjustedDaysDifference = daysDifference + adjustment;
  
  // Hijri calendar has approximately 354.367 days per year
  // Each Hijri month alternates between 29 and 30 days
  // We'll use this to calculate the new date
  
  // Start with the reference date
  let hijriDay = referenceHijri.day;
  let hijriMonth = referenceHijri.month;
  let hijriYear = referenceHijri.year;
  
  // Function to get days in a Hijri month
  const getDaysInMonth = (month: number, year: number) => {
    // In general, odd months have 30 days and even months have 29 days
    // But this can vary in leap years
    const isLeapYear = isHijriLeapYear(year);
    
    if (month === 12 && isLeapYear) {
      return 30; // Dhu al-Hijjah has 30 days in leap years
    }
    
    return month % 2 === 1 ? 30 : 29;
  };
  
  // Adjust for negative difference (dates before reference)
  if (adjustedDaysDifference < 0) {
    let remainingDays = Math.abs(adjustedDaysDifference);
    
    while (remainingDays > 0) {
      if (hijriDay > 1) {
        hijriDay--;
        remainingDays--;
      } else {
        // Move to previous month
        hijriMonth--;
        if (hijriMonth < 1) {
          hijriMonth = 12;
          hijriYear--;
        }
        hijriDay = getDaysInMonth(hijriMonth, hijriYear);
        remainingDays--;
      }
    }
  } else {
    // Adjust for positive difference (dates after reference)
    let remainingDays = adjustedDaysDifference;
    
    while (remainingDays > 0) {
      const daysInMonth = getDaysInMonth(hijriMonth, hijriYear);
      const daysLeftInMonth = daysInMonth - hijriDay + 1;
      
      if (remainingDays >= daysLeftInMonth) {
        // Move to next month
        remainingDays -= daysLeftInMonth;
        hijriMonth++;
        hijriDay = 1;
        
        if (hijriMonth > 12) {
          hijriMonth = 1;
          hijriYear++;
        }
      } else {
        // Stay in current month
        hijriDay += remainingDays;
        remainingDays = 0;
      }
    }
  }
  
  // Get month and day names
  const monthName = HIJRI_MONTHS[hijriMonth - 1];
  const dayName = HIJRI_DAYS[date.getDay()];
  
  // Format the date
  const formattedDate = `${hijriDay} ${monthName} ${hijriYear}`;
  
  return {
    year: hijriYear,
    month: hijriMonth,
    day: hijriDay,
    monthName,
    dayName,
    formattedDate
  };
}

/**
 * Determines if a Hijri year is a leap year
 * Leap years in the Hijri calendar occur in a 30-year cycle
 * Years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29 in the cycle are leap years
 * @param year Hijri year
 * @returns true if leap year, false otherwise
 */
function isHijriLeapYear(year: number): boolean {
  const yearInCycle = year % 30;
  const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
  return leapYears.includes(yearInCycle === 0 ? 30 : yearInCycle);
}

// Function to format Hijri date in short format (e.g., "3 Ramadan 1446H")
export function formatHijriDate(hijriDate: ReturnType<typeof calculateHijriDate>): string {
  return `${hijriDate.day} ${hijriDate.monthName} ${hijriDate.year}H`;
}

// Calculate Hijri dates for an entire Gregorian month
export async function getHijriCalendarForMonth(year: number, month: number): Promise<{
  gregorianDate: Date;
  hijriDate: {
    day: number;
    month: number;
    year: number;
    monthName: string;
  }
}[]> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarData = [];
  
  // Get the stored adjustment
  const adjustment = await getHijriAdjustment();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const gregorianDate = new Date(year, month, day);
    const hijriDate = calculateHijriDate(gregorianDate, adjustment);
    
    calendarData.push({
      gregorianDate,
      hijriDate: {
        day: hijriDate.day,
        month: hijriDate.month,
        year: hijriDate.year,
        monthName: hijriDate.monthName
      }
    });
  }
  
  return calendarData;
}

// Calculate Sehri end time (5 minutes before Fajr)
export function calculateSehriEndTime(fajrTime: string): string {
  const [time, period] = fajrTime.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  // Convert to total minutes
  let totalMinutes = hours * 60 + minutes;
  if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
  if (period === 'AM' && hours === 12) totalMinutes = minutes;
  
  // Subtract 5 minutes
  totalMinutes -= 5;
  
  // Convert back to hours and minutes
  let resultHours = Math.floor(totalMinutes / 60);
  const resultMinutes = totalMinutes % 60;
  
  // Format back to 12-hour format
  const resultPeriod = resultHours >= 12 ? 'PM' : 'AM';
  resultHours = resultHours % 12 || 12;
  
  return `${resultHours}:${resultMinutes.toString().padStart(2, '0')} ${resultPeriod}`;
} 