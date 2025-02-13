// Color scheme for the app

// Interface for theme colors
export interface ThemeColors {
  // Basic colors
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  
  // UI Elements
  cardBackground: string;
  cardBorder: string;
  tabBarBackground: string;
  headerBackground: string;
  divider: string;
  
  // Status indicators
  unread: string;
  highPriority: string;
  success: string;
  warning: string;
  
  // Specific components
  tasbihButtonBackground: string;
  tasbihButtonText: string;
}

// Dark theme colors
export const darkTheme: ThemeColors = {
  // Basic colors
  primary: '#60A5FA', // Bright blue
  secondary: '#8B5CF6', // Purple
  accent: '#F59E0B', // Amber
  background: '#111827', // Very dark blue-gray
  surface: '#1F2937', // Dark blue-gray
  error: '#EF4444', // Red
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textDisabled: '#9CA3AF',
  
  // UI Elements
  cardBackground: '#1F2937',
  cardBorder: '#374151',
  tabBarBackground: '#1F2937',
  headerBackground: '#1F2937',
  divider: '#374151',
  
  // Status indicators
  unread: '#60A5FA', // Blue
  highPriority: '#F87171', // Light red
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  
  // Specific components
  tasbihButtonBackground: '#3B82F6', // Vibrant blue
  tasbihButtonText: '#FFFFFF',
};

// Light theme colors
export const lightTheme: ThemeColors = {
  // Basic colors
  primary: '#2563EB', // Darker blue
  secondary: '#7C3AED', // Darker purple
  accent: '#D97706', // Darker amber
  background: '#F9FAFB', // Light gray
  surface: '#FFFFFF', // White
  error: '#DC2626', // Darker red
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textDisabled: '#9CA3AF',
  
  // UI Elements
  cardBackground: '#FFFFFF',
  cardBorder: '#E5E7EB',
  tabBarBackground: '#FFFFFF',
  headerBackground: '#F3F4F6',
  divider: '#E5E7EB',
  
  // Status indicators
  unread: '#2563EB', // Blue
  highPriority: '#DC2626', // Red
  success: '#059669', // Green
  warning: '#D97706', // Amber
  
  // Specific components
  tasbihButtonBackground: '#3B82F6', // Vibrant blue
  tasbihButtonText: '#FFFFFF',
};

// Default theme (dark or light)
export const defaultTheme = darkTheme;

// Export a function to get the appropriate theme based on system settings
export const getTheme = (isDarkMode: boolean): ThemeColors => {
  return isDarkMode ? darkTheme : lightTheme;
}; 