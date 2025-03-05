import { Stack } from 'expo-router';
import { useTheme } from '../utils/ThemeContext';

export default function PagesLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.headerBackground,
        },
        headerTintColor: theme.textPrimary,
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
} 