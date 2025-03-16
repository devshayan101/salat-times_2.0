import React, { useState, useEffect, useRef, ErrorInfo } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal, BackHandler, Dimensions, Animated, Easing, Platform } from 'react-native';
import { getUnreadMessageCountAsync, initializeAdminMessages } from '../services/adminMessageService';
import { useTheme } from '../utils/ThemeContext';
import { SawadeazamLogo } from '../components/SawadeazamLogo';
import { useRouter } from 'expo-router';
import { ScrollView, GestureHandlerRootView } from 'react-native-gesture-handler';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

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
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, isDark, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  // Load unread count - now asynchronous
  const loadUnreadCount = async () => {
    try {
      // Initialize messages first from MongoDB
      await initializeAdminMessages();
      // Get unread count from MongoDB
      const count = await getUnreadMessageCountAsync();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  // Check for unread messages when the component mounts
  useEffect(() => {
    // Initial load
    loadUnreadCount();
    
    // Set up interval to check for new messages
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 5000);
    
    // Clean up
    return () => clearInterval(interval);
  }, []);

  // Handle back button press to close drawer
  useEffect(() => {
    const backAction = () => {
      if (showMenu && !isAnimating) {
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
  }, [showMenu, isAnimating]);

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

  // Function to open the menu with animation
  const openMenu = () => {
    if (isAnimating || showMenu) return;
    
    setIsAnimating(true);
    setShowMenu(true);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  // Function to close the menu with animation
  const closeMenu = () => {
    if (isAnimating || !showMenu) return;
    
    setIsAnimating(true);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic)
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      setShowMenu(false);
      setIsAnimating(false);
    });
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
            title: 'Prayer Times',
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
      
      {/* Custom Drawer Menu - Only render when showMenu is true */}
      {showMenu ? (
        <Modal
          visible={showMenu}
          transparent={true}
          animationType="none"
          onRequestClose={closeMenu}
          statusBarTranslucent={true}
        >
          <View style={styles.modalContainer}>
            <Animated.View 
              style={[
                styles.backdrop,
                { opacity: backdropOpacity }
              ]}
            >
              <TouchableOpacity 
                style={styles.backdropTouchable}
                activeOpacity={1}
                onPress={closeMenu}
              />
            </Animated.View>
            
            <View style={styles.drawerContainer}>
              <Animated.View 
                style={[
                  styles.menuContainer, 
                  { 
                    backgroundColor: theme.background,
                    transform: [{ translateX: slideAnim }],
                    zIndex: 999,
                    ...(Platform.OS === 'android' && { 
                      paddingTop: 40,
                      marginTop: 0
                    })
                  }
                ]}
              >
                <View style={styles.menuHeader}>
                  <Image
                    source={require('../../assets/images/icon.png')}
                    style={styles.menuLogo}
                  />
                  <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>SalatTimes</Text>
                  <TouchableOpacity 
                    onPress={closeMenu}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={theme.textPrimary} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.menuItems}>
                  <MenuItem 
                    icon="time-outline" 
                    label="Prayer Times" 
                    onPress={() => navigateTo('index')} 
                    theme={theme}
                  />
                  
                  <MenuItem 
                    icon="ellipsis-horizontal-circle-outline" 
                    label="Tasbih Counter" 
                    onPress={() => navigateTo('tasbih')} 
                    theme={theme}
                  />
                  
                  <MenuItem 
                    icon="compass-outline" 
                    label="Qibla Direction" 
                    onPress={() => navigateTo('qibla')} 
                    theme={theme}
                  />
                  
                  <MenuItem 
                    icon="mail-outline" 
                    label="Messages" 
                    onPress={() => navigateTo('messages')} 
                    theme={theme}
                    badge={unreadCount > 0 ? String(unreadCount) : undefined}
                  />
                  
                  <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                  
                  <MenuItem 
                    icon="information-circle-outline" 
                    label="About" 
                    onPress={() => navigateTo('(pages)/about')} 
                    theme={theme}
                  />
                  
                  <MenuItem 
                    icon="settings-outline" 
                    label="Settings" 
                    onPress={() => navigateTo('(pages)/settings')} 
                    theme={theme}
                  />
                  
                  <MenuItem 
                    icon="help-circle-outline" 
                    label="Help" 
                    onPress={() => navigateTo('(pages)/help')} 
                    theme={theme}
                  />
                  
                  <MenuItem 
                    icon="call-outline" 
                    label="Contact Us" 
                    onPress={() => navigateTo('(pages)/contact')} 
                    theme={theme}
                  />
                  
                  <MenuItem 
                    icon="heart-outline" 
                    label="Donations" 
                    onPress={() => navigateTo('(pages)/donations')} 
                    theme={theme}
                  />
                  
                  <MenuItem 
                    icon="megaphone-outline" 
                    label="Advertisements" 
                    onPress={() => navigateTo('(pages)/advertisements')} 
                    theme={theme}
                  />
                  
                  <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                  
                  <View style={styles.footer}>
                    <View style={styles.themeToggleContainer}>
                      <Text style={[styles.themeToggleLabel, { color: theme.textSecondary }]}>
                        {isDark ? 'Dark Mode' : 'Light Mode'}
                      </Text>
                      <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleButton}>
                        <Ionicons
                          name={isDark ? 'sunny-outline' : 'moon-outline'}
                          size={24}
                          color={theme.primary}
                        />
                      </TouchableOpacity>
                    </View>
                    <SawadeazamLogo size='medium' />
                  </View>
                </ScrollView>
              </Animated.View>
            </View>
          </View>
        </Modal>
      ) : null}
    </GestureHandlerRootView>
  );
}

// Menu item component
interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  theme: any;
  badge?: string;
}

const MenuItem = ({ icon, label, onPress, theme, badge }: MenuItemProps) => (
  <TouchableOpacity 
    style={styles.menuItem} 
    onPress={onPress}
  >
    <View style={styles.menuItemContent}>
      <Ionicons name={icon as any} size={24} color={theme.primary} style={styles.menuItemIcon} />
      <Text style={[styles.menuItemLabel, { color: theme.textPrimary }]}>{label}</Text>
    </View>
    {badge && (
      <View style={[styles.badge, { backgroundColor: theme.error }]}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
  </TouchableOpacity>
);

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
  themeToggle: {
    marginLeft: 16,
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  backdropTouchable: {
    flex: 1,
  },
  drawerContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  menuContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuLogo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemLabel: {
    fontSize: 16,
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
  divider: {
    height: 1,
    marginVertical: 8,
  },
  footer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  themeToggleButton: {
    padding: 4,
  },
});