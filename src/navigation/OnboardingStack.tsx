import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SchoolSearchScreen from '../screens/onboarding/SchoolSearchScreen';
import SemesterSelectScreen from '../screens/onboarding/SemesterSelectScreen';
import CourseSetupScreen from '../screens/onboarding/CourseSetupScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator initialRouteName="SchoolSearch">
      <Stack.Screen
        name="SchoolSearch"
        component={SchoolSearchScreen}
        options={{ title: 'Your School' }}
      />
      <Stack.Screen
        name="SemesterSelect"
        component={SemesterSelectScreen}
        options={{ title: 'Your Semester' }}
      />
      <Stack.Screen
        name="CourseSetup"
        component={CourseSetupScreen}
        options={{ title: 'Your Courses', headerLeft: () => null }}
      />
    </Stack.Navigator>
  );
}
