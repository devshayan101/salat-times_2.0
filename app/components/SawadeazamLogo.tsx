import React from 'react';
import { Image, StyleSheet, View, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

export const SawadeazamLogo: React.FC<LogoProps> = ({ size = 'medium' }) => {
  const { isDark } = useTheme();
  
  // Choose logo based on theme
  const logoSource = isDark 
    ? require('../../assets/images/sawadeazam_logo_dark.png')
    : require('../../assets/images/sawadeazam_logo_light.png');
  
  // Size mappings
  const sizeStyles = {
    small: { width: 50, height: 50 },
    medium: { width: 80, height: 80 },
    large: { width: 120, height: 120 }
  };
  
  const openSawadeazamWebsite = () => {
    Linking.openURL('https://sawadeazam.org/');
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={openSawadeazamWebsite}>
      <Image 
        source={logoSource} 
        style={[styles.logo, sizeStyles[size]]}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Default size handled via props
  }
}); 
export default SawadeazamLogo;