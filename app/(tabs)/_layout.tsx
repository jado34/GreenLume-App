import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ITEMS = [
  { name: 'index', title: 'Home', icon: 'home' as const, iconOutline: 'home-outline' as const },
  { name: 'log', title: 'Log', icon: 'add-circle' as const, iconOutline: 'add-circle-outline' as const },
  // FIX #15: Changed from 'people' to 'leaf' — a leaf better represents community forests
  { name: 'forests', title: 'Forests', icon: 'leaf' as const, iconOutline: 'leaf-outline' as const },
  { name: 'achievements', title: 'Badges', icon: 'trophy' as const, iconOutline: 'trophy-outline' as const },
  { name: 'profile', title: 'Profile', icon: 'person' as const, iconOutline: 'person-outline' as const },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.neutral200,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.neutral300,
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamily.medium,
          fontSize: 11,
        },
      }}
    >
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.icon : tab.iconOutline}
                size={tab.name === 'log' ? 28 : 22}
                color={tab.name === 'log' && focused ? Colors.primary : color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}


