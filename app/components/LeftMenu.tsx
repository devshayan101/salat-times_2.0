import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Dimensions, 
  ScrollView, 
  Modal,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { useRouter } from 'expo-router';

// Get screen dimensions for drawer sizing
const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

// Props interface
interface LeftMenuProps {
  isVisible: boolean;
  onClose: () => void;
  unreadMessageCount?: number;
}

// Menu item interface
interface MenuItem {
  icon: string;
  label: string;
  route: string;
  badge?: string | number;
}

const LeftMenu: React.FC<LeftMenuProps> = ({ 
  isVisible, 
  onClose, 
  unreadMessageCount = 0 
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [menuHidden, setMenuHidden] = useState(true);
  
  // Define menu items
  const menuItems: MenuItem[] = [
    { 
      icon: 'time-outline', 
      label: 'Salat Times', 
      route: '/' 
    },
    { 
      icon: 'compass-outline', 
      label: 'Qibla Direction', 
      route: 'qibla' 
    },
    { 
      icon: 'finger-print-outline', 
      label: 'Tasbih Counter', 
      route: 'tasbih' 
    },
    { 
      icon: 'mail-outline', 
      label: 'Messages', 
      route: 'messages',
      badge: unreadMessageCount > 0 ? unreadMessageCount.toString() : undefined
    },
    { 
      icon: 'settings-outline', 
      label: 'Settings', 
      route: '(pages)/settings' 
    },
    { 
      icon: 'cash-outline', 
      label: 'Donations', 
      route: '(pages)/donations' 
    },
    { 
      icon: 'call-outline', 
      label: 'Contact Us', 
      route: '(pages)/contact' 
    },
    { 
      icon: 'information-circle-outline', 
      label: 'About Us', 
      route: '(pages)/about' 
    },
  ];

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isVisible) {
        onClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isVisible, onClose]);

  // Handle animations when visibility changes
  useEffect(() => {
    if (isVisible) {
      setMenuHidden(false);
      // Open animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMenuHidden(true);
      });
    }
  }, [isVisible, slideAnim, backdropOpacity]);

  // Handle navigation
  const navigateTo = (route: string) => {
    onClose();
    
    // Small delay to allow drawer to close before navigation
    setTimeout(() => {
      try {
        // For pages folder, use the full path
        if (route.startsWith('(pages)/')) {
          router.push(`/${route}` as any);
        } else {
          // For tabs, use the relative path
          router.push(route as any);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        try {
          if (route.startsWith('(pages)/')) {
            router.replace(`/${route}` as any);
          } else {
            router.replace(route as any);
          }
        } catch (innerError) {
          console.error('Alternative navigation also failed:', innerError);
        }
      }
    }, 300);
  };

  if (!isVisible && menuHidden) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View 
          style={[
            styles.backdrop, 
            { opacity: backdropOpacity }
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>
        
        {/* Drawer */}
        <View style={styles.drawerContainer}>
          <Animated.View 
            style={[
              styles.menuContainer, 
              { 
                backgroundColor: theme.surface,
                borderRightColor: theme.divider,
                borderRightWidth: 1,
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            {/* Header */}
            <View 
              style={[
                styles.menuHeader, 
                { borderBottomColor: theme.divider }
              ]}
            >
              <Image 
                source={require('../../assets/images/icon.png')} 
                style={styles.menuLogo} 
              />
              <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                SalatTimes
              </Text>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {/* Menu Items */}
            <ScrollView style={styles.menuItems}>
              {menuItems.map((item, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.menuItem} 
                  onPress={() => navigateTo(item.route)}
                >
                  <View style={styles.menuItemContent}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={24} 
                      color={theme.primary} 
                      style={styles.menuItemIcon} 
                    />
                    <Text 
                      style={[
                        styles.menuItemLabel, 
                        { color: theme.textPrimary }
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {item.badge && (
                    <View 
                      style={[
                        styles.badge, 
                        { backgroundColor: theme.error }
                      ]}
                    >
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Theme Toggle */}
            <TouchableOpacity 
              style={[
                styles.themeToggle, 
                { borderTopColor: theme.divider }
              ]} 
              onPress={toggleTheme}
            >
              <Ionicons 
                name={isDark ? "sunny-outline" : "moon-outline"} 
                size={24} 
                color={theme.primary} 
              />
              <Text 
                style={[
                  styles.themeToggleText, 
                  { color: theme.textPrimary }
                ]}
              >
                {isDark ? "Light Mode" : "Dark Mode"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  themeToggleText: {
    fontSize: 16,
    marginLeft: 16,
  },
});

export default LeftMenu; 