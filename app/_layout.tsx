import 'expo-router/entry';

import React, { useEffect, useState, ErrorInfo, Suspense } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { initializeAdminMessages } from './services/adminMessageService';
import { ThemeProvider, useTheme } from './utils/ThemeContext';
import { View, Text, StyleSheet, AppState, Button, LogBox, Platform, Alert } from 'react-native';
import FallbackScreen from './components/FallbackScreen';

// Ignore specific warnings that might be noisy but non-fatal
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
  'Require cycle:',
  'Warning: componentWill',
  'AsyncStorage has been extracted'
]);

// Global error handler to prevent app crashes
const setupErrorHandlers = () => {
  // Save the original error handler
  const originalErrorHandler = ErrorUtils.getGlobalHandler();
  
  // Set up a custom error handler
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Log the error
    console.error('Global error caught:', error);
    
    // Only handle fatal errors specially
    if (isFatal) {
      console.error('FATAL ERROR occurred');
      
      // Show an alert to the user instead of crashing
      try {
        Alert.alert(
          'Application Error',
          'An unexpected error occurred. Please restart the application.',
          [{ text: 'OK' }]
        );
      } catch (e) {
        // Even alert might fail in some crash scenarios
        console.error('Failed to show error alert:', e);
      }
    }
    
    // Still call the original handler
    originalErrorHandler(error, isFatal);
  });
  
  // Handle unhandled promise rejections in a simple way
  // Just log any unhandled promise rejections
  const logRejectionHandler = (event: any) => {
    console.warn('Unhandled promise rejection:', event);
  };

  // Use process.on for Node.js environments if available
  if (typeof process !== 'undefined' && process?.on) {
    process.on('unhandledRejection', logRejectionHandler);
  }
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore if splash screen is already hidden */
});

// Setup error handlers immediately
setupErrorHandlers();

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

// Error boundary component for production debugging
function ErrorDisplay({ error }: { error: Error | null }) {
  if (!error) return null;
  
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>App Error</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <Text style={styles.errorStack}>{error.stack}</Text>
    </View>
  );
}

// Error boundary class component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; info: ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('App Error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
          <Button 
            title="Try Again" 
            onPress={() => this.setState({ hasError: false, error: null, info: null })} 
          />
        </View>
      );
    }

    return this.props.children;
  }
}

// Root layout component
function RootLayoutContent() {
  const { theme, isDark } = useTheme();
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [showFallback, setShowFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Show fallback screen if initialization takes too long
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!isReady) {
        console.log('App initialization taking too long, showing fallback UI');
        setShowFallback(true);
        
        // Force app to ready state after an additional timeout
        const forceReadyTimer = setTimeout(() => {
          if (!isReady) {
            console.log('Forcing app to ready state after timeout');
            setIsReady(true);
          }
        }, 3000);
        
        return () => clearTimeout(forceReadyTimer);
      }
    }, 2000);
    
    return () => clearTimeout(fallbackTimer);
  }, [isReady]);
  
  // Add app state change listener to handle background/foreground transitions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && appState !== 'active') {
        // Force hide splash when app becomes active
        SplashScreen.hideAsync().catch(console.warn);
      }
      setAppState(nextAppState);
    });
    
    return () => {
      subscription.remove();
    };
  }, [appState]);
  
  useEffect(() => {
    // Initialize app resources
    const initializeApp = async () => {
      try {
        console.log('App initializing...', retryCount > 0 ? `(Retry ${retryCount})` : '');
        
        // Ensure splash screen is hidden after a timeout, no matter what
        const splashTimer = setTimeout(() => {
          console.log('Forcing splash screen to hide due to timeout');
          SplashScreen.hideAsync().catch(e => 
            console.warn('Failed to force hide splash screen:', e)
          );
        }, 5000);
        
        try {
          // Initialize admin messages with a timeout
          const initPromise = initializeAdminMessages();
          const timeoutPromise = new Promise<void>((_, reject) => 
            setTimeout(() => reject(new Error('Admin messages initialization timeout')), 3000)
          );
          
          // Use Promise.race to handle timeout
          await Promise.race([initPromise, timeoutPromise])
            .catch(err => {
              console.warn('Admin messages initialization issue, continuing anyway:', err);
            });
          
          console.log('App initialization completed');
        } catch (error) {
          console.warn('Non-fatal initialization error:', error);
          // Continue despite errors
        }
        
        // Clear splash timer if we got here
        clearTimeout(splashTimer);
        
        // Set app as ready and hide splash screen
        setIsReady(true);
        await SplashScreen.hideAsync().catch(e => 
          console.warn('Error hiding splash screen:', e)
        );
        
      } catch (error) {
        console.error('Critical error in initialization:', error);
        
        // If this is a network error, retry up to 2 times
        if (
          retryCount < 2 && 
          (error instanceof Error && 
           (error.message.includes('network') || 
            error.message.includes('timeout') ||
            error.message.includes('connection')))
        ) {
          console.log(`Retrying initialization (${retryCount + 1}/2)...`);
          setRetryCount(prev => prev + 1);
          
          // Wait a bit before retrying
          setTimeout(() => {
            initializeApp();
          }, 1000);
          
          return;
        }
        
        // Even with critical errors, still try to hide splash screen and continue
        setIsReady(true);
        SplashScreen.hideAsync().catch(console.warn);
      }
    };

    // Start initialization process
    initializeApp();
  }, [retryCount]);

  // Show fallback while loading or error screen if there's an error
  if (!isReady) {
    return showFallback ? <FallbackScreen /> : null;
  }

  // Only show error screen for truly fatal errors
  if (error && error.message.includes('fatal')) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <Suspense fallback={<FallbackScreen message="Loading app content..." />}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background }
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(pages)"
          options={{
            headerShown: false,
          }}
        />
        </Stack>
    </Suspense>
  );
}

// Wrap with ThemeProvider and ErrorBoundary
export default function RootLayout() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <RootLayoutContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#343a40',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorStack: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 10,
  },
});
