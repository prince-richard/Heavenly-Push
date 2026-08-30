import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAccessibility } from '@/hooks/useAccessibility';
import type { RootStackParamList } from '@/types/navigation';
import { TabNavigator } from './TabNavigator';
import { VerseDetailScreen } from '@/app/screens/VerseDetailScreen';
import { PlanDetailScreen } from '@/app/screens/PlanDetailScreen';
import { VoiceCommandsScreen } from '@/app/screens/VoiceCommandsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors } = useAccessibility();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VerseDetail"
        component={VerseDetailScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Verse',
        }}
      />
      <Stack.Screen
        name="PlanDetail"
        component={PlanDetailScreen}
        options={{
          headerShown: true,
          title: 'Plan',
        }}
      />
      <Stack.Screen
        name="VoiceCommands"
        component={VoiceCommandsScreen}
        options={{
          headerShown: true,
          title: 'Voice Commands',
        }}
      />
    </Stack.Navigator>
  );
}
