import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { DrawerContentScrollView } from '@react-navigation/drawer';

interface DrawerItemProps {
  label: string;
  icon: string;
  onPress: () => void;
  isActive?: boolean;
}

const DrawerItem = ({ label, icon, onPress, isActive = false }: DrawerItemProps) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.drawerItem,
        isActive && { backgroundColor: theme.primary + '20' }
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={24}
        color={isActive ? theme.primary : theme.textSecondary}
        style={styles.drawerItemIcon}
      />
      <Text
        style={[
          styles.drawerItemLabel,
          { color: isActive ? theme.primary : theme.textPrimary }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export function DrawerContent({ navigation, state }: any) {
  const { theme, isDark, toggleTheme } = useTheme();
  const currentRouteName = state.routes[state.index].name;
  
  return (
    <DrawerContentScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
        />
        <Text style={[styles.appName, { color: theme.textPrimary }]}>SalatTimes</Text>
      </View>
      
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      
      <DrawerItem
        label="Salat Times"
        icon="time-outline"
        onPress={() => navigation.navigate('index')}
        isActive={currentRouteName === 'index'}
      />
      
      <DrawerItem
        label="Qibla Direction"
        icon="compass-outline"
        onPress={() => navigation.navigate('qibla')}
        isActive={currentRouteName === 'qibla'}
      />
      
      <DrawerItem
        label="Tasbih Counter"
        icon="finger-print-outline"
        onPress={() => navigation.navigate('tasbih')}
        isActive={currentRouteName === 'tasbih'}
      />
      
      <DrawerItem
        label="Messages"
        icon="mail-outline"
        onPress={() => navigation.navigate('messages')}
        isActive={currentRouteName === 'messages'}
      />
      
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      
      <DrawerItem
        label="About Us"
        icon="information-circle-outline"
        onPress={() => navigation.navigate('(pages)/about')}
        isActive={currentRouteName === '(pages)/about'}
      />
      
      <DrawerItem
        label="Contact Us"
        icon="call-outline"
        onPress={() => navigation.navigate('(pages)/contact')}
        isActive={currentRouteName === '(pages)/contact'}
      />
      
      <DrawerItem
        label="Donations"
        icon="heart-outline"
        onPress={() => navigation.navigate('(pages)/donations')}
        isActive={currentRouteName === '(pages)/donations'}
      />
      
      <DrawerItem
        label="Advertisements"
        icon="megaphone-outline"
        onPress={() => navigation.navigate('(pages)/advertisements')}
        isActive={currentRouteName === '(pages)/advertisements'}
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
        
        <View style={styles.logoContainer}>
          <Image
            source={isDark ? require('../../assets/images/sawadeazam_logo_dark.png') : require('../../assets/images/sawadeazam_logo_light.png')}
            style={styles.sawadeazamLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  drawerItemIcon: {
    marginRight: 16,
  },
  drawerItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    marginTop: 16,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  themeToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeToggleButton: {
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  sawadeazamLogo: {
    width: 120,
    height: 60,
  },
}); 
export default DrawerContent;