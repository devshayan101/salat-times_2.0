import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, darkTheme, lightTheme } from './theme';

// Key for storing theme preference
const THEME_STORAGE_KEY = 'user_theme_preference';

// Create a context for the theme
interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => {},
});

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get device color scheme
  const deviceColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(deviceColorScheme === 'dark');
  const [theme, setTheme] = useState<ThemeColors>(isDark ? darkTheme : lightTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          const isDarkTheme = savedTheme === 'dark';
          setIsDark(isDarkTheme);
          setTheme(isDarkTheme ? darkTheme : lightTheme);
        } else {
          // No saved preference, use device setting
          setIsDark(deviceColorScheme === 'dark');
          setTheme(deviceColorScheme === 'dark' ? darkTheme : lightTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemePreference();
  }, [deviceColorScheme]);

  // Save theme preference when it changes
  useEffect(() => {
    if (isLoaded) {
      const saveThemePreference = async () => {
        try {
          await AsyncStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
        } catch (error) {
          console.error('Error saving theme preference:', error);
        }
      };

      saveThemePreference();
    }
  }, [isDark, isLoaded]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setIsDark(prev => {
      const newValue = !prev;
      setTheme(newValue ? darkTheme : lightTheme);
      return newValue;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 