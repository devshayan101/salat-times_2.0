import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LeftMenu from './LeftMenu';
import { useTheme } from '../utils/ThemeContext';

const MenuUsageExample: React.FC = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { theme } = useTheme();
  
  const openMenu = () => {
    setMenuVisible(true);
  };
  
  const closeMenu = () => {
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Menu Button */}
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={openMenu}
      >
        <Ionicons 
          name="menu" 
          size={24} 
          color={theme.textPrimary} 
        />
      </TouchableOpacity>
      
      {/* Left Menu Component */}
      <LeftMenu 
        isVisible={menuVisible} 
        onClose={closeMenu} 
        unreadMessageCount={2} // Example unread message count
      />
      
      {/* Your other content */}
      {/* ... */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuButton: {
    padding: 10,
  },
});

export default MenuUsageExample; 