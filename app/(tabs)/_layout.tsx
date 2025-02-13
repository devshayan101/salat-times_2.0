import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { getUnreadMessageCountAsync, initializeAdminMessages } from '../services/adminMessageService';
import { useTheme } from '../utils/ThemeContext';

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, isDark, toggleTheme } = useTheme();

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

  return (
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
        // Add a theme toggle button to the header
        headerRight: () => (
          <TouchableOpacity
            onPress={toggleTheme}
            style={{ marginRight: 16 }}
          >
            <Ionicons 
              name={isDark ? "sunny-outline" : "moon-outline"} 
              size={24} 
              color={theme.textPrimary} 
            />
          </TouchableOpacity>
        ),
      })}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Salat Times',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: 'Qibla Direction',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasbih"
        options={{
          title: 'Tasbih',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="finger-print" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ size, color }) => (
            <View>
              <Ionicons name="mail" size={size} color={color} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  right: -6,
                  top: -4,
                  backgroundColor: theme.error,
                  borderRadius: 10,
                  width: unreadCount > 9 ? 18 : 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}