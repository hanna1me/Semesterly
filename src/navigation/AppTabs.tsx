import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import ScheduleScreen from '../screens/ScheduleScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import StudyStack from './StudyStack';
import type { AppTabsParamList } from './types';

const Tab = createBottomTabNavigator<AppTabsParamList>();

const ICONS: Record<keyof AppTabsParamList, keyof typeof Ionicons.glyphMap> = {
  Schedule: 'calendar-outline',
  Study: 'book-outline',
  Friends: 'people-outline',
  Profile: 'person-outline',
};

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
      })}
    >
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Study" component={StudyStack} options={{ headerShown: false }} />
      <Tab.Screen name="Friends">
        {() => <PlaceholderScreen label="Friends" />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {() => <PlaceholderScreen label="Profile" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
