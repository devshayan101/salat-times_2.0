import React from 'react';
import { View, Text } from 'react-native';
import LazyLoadComponent from '../components/LazyLoadComponent';

export default function MessagesScreen() {
  return (
    <LazyLoadComponent 
      importFunc={() => import('../screens/MessagesScreen')}
      loadingMessage="Loading messages..."
    />
  );
} 