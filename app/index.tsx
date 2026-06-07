import { Redirect } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useApp } from '@/context/AppContext';

export default function IndexGate() {
  const { state, isLoaded } = useApp();

  if (!isLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  if (!state.settings.onboardingComplete) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
