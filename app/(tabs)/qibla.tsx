import React from 'react';
import LazyLoadComponent from '../components/LazyLoadComponent';

export default function QiblaScreen() {
  return (
    <LazyLoadComponent 
      importFunc={() => import('../screens/QiblaScreen')}
      loadingMessage="Loading Qibla direction..."
    />
  );
}