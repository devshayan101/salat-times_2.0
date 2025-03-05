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
  const LazyComponent = React.useMemo(() => lazy(importFunc), [importFunc]);

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