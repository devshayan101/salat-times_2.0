import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { initializeAdminMessages } from './services/adminMessageService';
import { ThemeProvider, useTheme } from './utils/ThemeContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

// Root layout component
function RootLayoutContent() {
  const { theme, isDark } = useTheme();
  
  useEffect(() => {
    // Initialize app resources
    const initializeApp = () => {
      try {
        // Initialize admin messages synchronously
        initializeAdminMessages();
      } catch (error) {
        console.error('Error initializing admin messages:', error);
      } finally {
        // Hide splash screen
        setTimeout(() => {
          SplashScreen.hideAsync().catch(console.error);
        }, 500);
      }
    };

    initializeApp();
  }, []);

  return (
    <>
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: theme.background }
      }}>
        <Stack.Screen name="index" />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="+not-found" 
          options={{ 
            title: 'Oops!',
            headerStyle: { backgroundColor: theme.headerBackground },
            headerTintColor: theme.textPrimary
          }} 
        />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

// Wrap with ThemeProvider
export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
