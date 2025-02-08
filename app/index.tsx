import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the tab home page
  return <Redirect href="/(tabs)" />;
} 