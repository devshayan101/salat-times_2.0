import React, { useState, useEffect, ErrorInfo } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, Image, StyleSheet, BackHandler, Platform } from 'react-native';
import { getUnreadMessageCountAsync } from '../services/adminMessageService';
import { useTheme } from '../utils/ThemeContext';
import { SawadeazamLogo } from '../components/SawadeazamLogo';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LeftMenu from '../components/LeftMenu';

// Error boundary component to catch rendering errors in tabs
class TabErrorBoundary extends React.Component<
  { children: React.ReactNode; name: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in tab ${this.props.name}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
          <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
            Something went wrong
          </Text>
          <Text style={{textAlign: 'center', marginBottom: 20}}>
            There was an error loading this screen. Please try again later.
          </Text>
          <TouchableOpacity 
            style={{padding: 12, backgroundColor: '#3B82F6', borderRadius: 8}}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={{color: 'white', fontWeight: '600'}}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  // Fetch unread message count on mount and when app comes to foreground
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadMessageCountAsync();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to get unread count:', error);
      }
    };

    fetchUnreadCount();

    // Poll for messages every 15 minutes (not too often to save battery)
    const interval = setInterval(fetchUnreadCount, 900000);

    return () => clearInterval(interval);
  }, []);

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      if (menuVisible) {
        closeMenu();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [menuVisible]);

  // Navigate to a screen with error handling
  const navigateTo = (screen: string) => {
    try {
      // Close the menu first to prevent animation conflicts
      closeMenu();
      
      // Use setTimeout to ensure menu is closed before navigation
      setTimeout(() => {
        try {
          // For pages folder, use the full path
          if (screen.startsWith('(pages)/')) {
            router.push(`/${screen}` as any);
          } else {
            // For tabs, use the relative path
            router.push(screen as any);
          }
        } catch (error) {
          console.error('Navigation error:', error);
          // Try alternative navigation approach if the first fails
          try {
            // Fallback navigation
            if (screen.startsWith('(pages)/')) {
              router.replace(`/${screen}` as any);
            } else {
              router.replace(screen as any);
            }
          } catch (innerError) {
            console.error('Alternative navigation also failed:', innerError);
          }
        }
      }, 300); // Wait for drawer close animation to complete
    } catch (error) {
      console.error('Failed to navigate:', error);
    }
  };

  // Function to open the menu 
  const openMenu = () => {
    setMenuVisible(true);
  };

  // Function to close the menu
  const closeMenu = () => {
    setMenuVisible(false);
  };

  // Custom header with logo
  const LogoHeader = ({ routeName }: { routeName?: string }) => (
    <View style={styles.headerContainer}>
      {routeName !== 'qibla' && (
        <TouchableOpacity 
          onPress={openMenu}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
      )}
      <Image 
        source={require('../../assets/images/icon.png')} 
        style={styles.logo} 
      />
      <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>SalatTimes</Text>
    </View>
  );

  // Add global error handling for route navigation errors
  useEffect(() => {
    // In React Native, we can use try/catch for global error handling
    // or a simplified approach with a custom error handler
    const handleGlobalError = (error: Error) => {
      console.error('Global error caught:', error.message);
      // You could show a toast or Alert.alert here
    };

    // Set up error boundary as a backup for rendering errors
    // This is the most we can do in React Native without window/ErrorEvent
    const errorSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // Using BackHandler as a general app-level event listener
      // We'll just return false to not actually handle back press
      return false;
    });

    return () => {
      errorSubscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: true,
          tabBarStyle: {
            backgroundColor: theme.tabBarBackground,
            borderTopColor: theme.divider,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textDisabled,
          headerStyle: {
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.textPrimary,
          headerTitle: (props) => <LogoHeader routeName={route.name} />,
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <SawadeazamLogo size="small" />
            </View>
          ),
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Salat Times',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasbih"
          options={{
            title: 'Tasbih',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ellipsis-horizontal-circle-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="qibla"
          options={{
            title: 'Qibla',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="compass-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size }) => (
              <View>
                <Ionicons name="mail-outline" size={size} color={color} />
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.error }]}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
      </Tabs>
      
      {/* Use the new LeftMenu component */}
      <LeftMenu 
        isVisible={menuVisible} 
        onClose={closeMenu} 
        unreadMessageCount={unreadCount}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  menuButton: {
    marginRight: 16,
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: 'red', // This will be overridden by the theme color
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 16,
    paddingHorizontal: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});