import React, { Suspense, lazy, ComponentType } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import FallbackScreen from './FallbackScreen';

interface LazyLoadProps {
  importFunc: () => Promise<{ default: ComponentType<any> }>;
  props?: any;
  loadingMessage?: string;
}

/**
 * LazyLoadComponent - A wrapper component that enables lazy loading for any component
 * 
 * @param importFunc - Function that imports the component to be lazily loaded
 * @param props - Props to pass to the lazily loaded component
 * @param loadingMessage - Optional message to display while loading
 */
export const LazyLoadComponent: React.FC<LazyLoadProps> = ({ 
  importFunc, 
  props = {}, 
  loadingMessage = 'Loading...'
}) => {
  const { theme } = useTheme();
  
  // Use lazy with error handling to ensure the component is loaded correctly
  const LazyComponent = React.useMemo(() => {
    try {
      return lazy(() => 
        importFunc()
          .then(module => {
            // Check if module or module.default is undefined
            if (!module || !module.default) {
              console.error('Module or default export is undefined', module);
              throw new Error('Component failed to load correctly');
            }
            return module;
          })
          .catch(error => {
            console.error('Error loading component:', error);
            // Return a simple fallback component if loading fails
            return { 
              default: () => (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                  <Text>Failed to load component</Text>
                </View>
              ) 
            };
          })
      );
    } catch (error) {
      console.error('Error in LazyLoadComponent:', error);
      // Return a simple fallback component in case of error
      return () => (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text>Failed to load component</Text>
        </View>
      );
    }
  }, [importFunc]);

  return (
    <Suspense 
      fallback={
        <FallbackScreen message={loadingMessage} />
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default LazyLoadComponent; 