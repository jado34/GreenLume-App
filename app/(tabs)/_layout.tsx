import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ITEMS = [
  { name: 'index', title: 'Home', icon: 'home' as const, iconOutline: 'home-outline' as const },
  { name: 'log', title: 'Actions', icon: 'flash' as const, iconOutline: 'flash-outline' as const },
  { name: 'forests', title: 'Progress', icon: 'stats-chart' as const, iconOutline: 'stats-chart-outline' as const },
  { name: 'profile', title: 'Profile', icon: 'person' as const, iconOutline: 'person-outline' as const },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: '#2D7A40',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamily.medium,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.icon : tab.iconOutline}
                size={22}
                color={focused ? '#2D7A40' : color}
              />
            ),
          }}
        />
      ))}
      <Tabs.Screen
        name="achievements"
        options={{
          href: null, // Hidden from tab bar, accessible internally
        }}
      />
    </Tabs>
  );
}



