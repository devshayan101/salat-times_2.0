import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { getHijriCalendarForMonth, calculateHijriDate, getHijriAdjustment } from '../utils/hijriCalendar';
import { useTheme } from '../utils/ThemeContext';

// Gregorian month names
const GREGORIAN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Gregorian days (starting from Sunday)
const GREGORIAN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}

export const HijriCalendar: React.FC<CalendarProps> = ({ 
  selectedDate, 
  onDateSelect,
  onClose
}) => {
  const { theme, isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [hijriAdjustment, setHijriAdjustment] = useState(0);
  const [currentHijriDate, setCurrentHijriDate] = useState<ReturnType<typeof calculateHijriDate> | null>(null);
  
  // Load Hijri adjustment and update calendar data
  useEffect(() => {
    const loadAdjustmentAndData = async () => {
      const adjustment = await getHijriAdjustment();
      setHijriAdjustment(adjustment);
      
      // Update current Hijri date with adjustment
      setCurrentHijriDate(calculateHijriDate(new Date(), adjustment));
      
      // Load calendar data with adjustment
      const data = await getHijriCalendarForMonth(currentYear, currentMonth);
      setCalendarData(data);
    };
    
    loadAdjustmentAndData();
  }, [currentMonth, currentYear]);
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Build calendar grid
  const buildCalendarGrid = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Calculate rows needed for the calendar
    const rows = Math.ceil((firstDayOfMonth + daysInMonth) / 7);
    
    const calendarGrid = [];
    let dayCounter = 1;
    
    // Build calendar grid
    for (let row = 0; row < rows; row++) {
      const weekRow = [];
      
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < firstDayOfMonth) {
          // Empty cells before the first day of the month
          weekRow.push(null);
        } else if (dayCounter > daysInMonth) {
          // Empty cells after the last day of the month
          weekRow.push(null);
        } else {
          // Valid day cells
          const dayData = calendarData.find(
            data => data.gregorianDate.getDate() === dayCounter
          );
          
          weekRow.push({
            gregorianDay: dayCounter,
            hijriDay: dayData?.hijriDate.day || null,
            hijriMonth: dayData?.hijriDate.month || null,
            date: new Date(currentYear, currentMonth, dayCounter)
          });
          
          dayCounter++;
        }
      }
      
      calendarGrid.push(weekRow);
    }
    
    return calendarGrid;
  };
  
  const calendar = buildCalendarGrid();
  const today = new Date();
  const isToday = (date: Date) => {
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  const isSelectedDay = (date: Date) => {
    return date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear();
  };
  
  // Check if a new Hijri month starts on this day
  const isHijriMonthStart = (data: any) => {
    if (!data || data.hijriDay !== 1) return false;
    return true;
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <Text style={[styles.hijriDate, { color: theme.textSecondary }]}>
          {currentHijriDate?.formattedDate}
        </Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Calendar</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: theme.primary }]}>Done</Text>
        </Pressable>
      </View>
      
      <View style={styles.monthSelector}>
        <Pressable onPress={goToPreviousMonth} style={styles.monthButton}>
          <Text style={[styles.monthButtonText, { color: theme.primary }]}>{'<'}</Text>
        </Pressable>
        <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>
          {GREGORIAN_MONTHS[currentMonth]} {currentYear}
        </Text>
        <Pressable onPress={goToNextMonth} style={styles.monthButton}>
          <Text style={[styles.monthButtonText, { color: theme.primary }]}>{'>'}</Text>
        </Pressable>
      </View>
      
      <View style={styles.weekdayHeader}>
        {GREGORIAN_DAYS.map((day, index) => (
          <Text 
            key={index}
            style={[
              styles.weekdayText, 
              { color: index === 0 || index === 6 ? theme.error : theme.textSecondary }
            ]}
          >
            {day}
          </Text>
        ))}
      </View>
      
      <ScrollView style={styles.calendarGrid}>
        {calendar.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((day, dayIndex) => (
              <Pressable
                key={`day-${weekIndex}-${dayIndex}`}
                style={[
                  styles.dayCell,
                  day && isSelectedDay(day.date) && { backgroundColor: theme.primary + '33' },
                  day && isToday(day.date) && styles.todayCell
                ]}
                onPress={() => day && onDateSelect(day.date)}
              >
                {day && (
                  <>
                    <Text 
                      style={[
                        styles.gregorianDay, 
                        { color: theme.textPrimary },
                        isToday(day.date) && { fontWeight: 'bold' }
                      ]}
                    >
                      {day.gregorianDay}
                    </Text>
                    <Text 
                      style={[
                        styles.hijriDay, 
                        { color: theme.textSecondary },
                        isHijriMonthStart(day) && { color: theme.success, fontWeight: 'bold' }
                      ]}
                    >
                      {day.hijriDay}
                    </Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  hijriDate: {
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  monthButton: {
    padding: 10,
  },
  monthButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  weekdayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flex: 1,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 60,
  },
  dayCell: {
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    margin: 2,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  gregorianDay: {
    fontSize: 16,
  },
  hijriDay: {
    fontSize: 12,
  },
}); 