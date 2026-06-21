import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TimerScreen from '../screens/timer/TimerScreen';
import SessionHistoryScreen from '../screens/timer/SessionHistoryScreen';
import type { StudyStackParamList } from './types';

const Stack = createStackNavigator<StudyStackParamList>();

export default function StudyStack() {
  return (
    <Stack.Navigator initialRouteName="Timer">
      <Stack.Screen name="Timer" component={TimerScreen} options={{ title: 'Study' }} />
      <Stack.Screen
        name="SessionHistory"
        component={SessionHistoryScreen}
        options={{ title: 'History' }}
      />
    </Stack.Navigator>
  );
}
