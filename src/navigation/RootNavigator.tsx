import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import AppTabs from './AppTabs';

export default function RootNavigator() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      {!session ? (
        <AuthStack />
      ) : !profile?.school_name ? (
        <OnboardingStack />
      ) : (
        <AppTabs />
      )}
    </NavigationContainer>
  );
}
