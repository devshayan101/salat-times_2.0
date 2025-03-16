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
  background: '#0F172A', // Very dark blue-gray (darker for better contrast)
  surface: '#1E293B', // Dark blue-gray
  error: '#EF4444', // Red
  
  // Text colors
  textPrimary: '#F8FAFC', // Slightly off-white for better eye comfort
  textSecondary: '#CBD5E1', // Light blue-gray
  textDisabled: '#94A3B8', // Medium blue-gray
  
  // UI Elements
  cardBackground: '#1E293B',
  cardBorder: '#334155',
  tabBarBackground: '#0F172A',
  headerBackground: '#1E293B',
  divider: '#334155',
  
  // Status indicators
  unread: '#38BDF8', // Bright blue
  highPriority: '#F87171', // Light red
  success: '#34D399', // Emerald green
  warning: '#FBBF24', // Amber
  
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
  background: '#F8FAFC', // Light blue-gray
  surface: '#FFFFFF', // White
  error: '#DC2626', // Darker red
  
  // Text colors
  textPrimary: '#0F172A', // Very dark blue-gray
  textSecondary: '#334155', // Dark blue-gray
  textDisabled: '#94A3B8', // Medium blue-gray
  
  // UI Elements
  cardBackground: '#FFFFFF',
  cardBorder: '#E2E8F0',
  tabBarBackground: '#F1F5F9',
  headerBackground: '#F1F5F9',
  divider: '#E2E8F0',
  
  // Status indicators
  unread: '#2563EB', // Blue
  highPriority: '#DC2626', // Red
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  
  // Specific components
  tasbihButtonBackground: '#2563EB', // Vibrant blue
  tasbihButtonText: '#FFFFFF',
};

// Default theme (dark or light)
export const defaultTheme = darkTheme;

// Export a function to get the appropriate theme based on system settings
export const getTheme = (isDarkMode: boolean): ThemeColors => {
  return isDarkMode ? darkTheme : lightTheme;
}; 