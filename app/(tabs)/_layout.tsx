import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#1F2937',
        },
        tabBarActiveTintColor: '#60A5FA',
        tabBarInactiveTintColor: '#9CA3AF',
        headerStyle: {
          backgroundColor: '#1F2937',
        },
        headerTintColor: '#FFFFFF',
      }}>
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
    </Tabs>
  );
}