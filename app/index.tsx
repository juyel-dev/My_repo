import { Redirect } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { View, ActivityIndicator } from 'react-native';

export default function RootIndex() {
  const { state, isLoaded } = useApp();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d0d0d', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#8b5cf6" />
      </View>
    );
  }

  if (!state.settings.onboardingComplete) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
