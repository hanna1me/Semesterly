import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { TimerProvider } from './src/context/TimerContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <TimerProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </TimerProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
